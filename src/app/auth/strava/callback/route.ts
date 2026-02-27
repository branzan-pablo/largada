import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string; // avatar URL
  profile_medium: string;
}

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  athlete: StravaAthlete;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  const origin = request.nextUrl.origin;

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/corridas?error=auth`);
  }

  // Validate CSRF state against cookie
  const cookieHeader = request.headers.get("cookie") ?? "";
  const stateCookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("strava_oauth_state="));
  const expectedState = stateCookie?.split("=")[1];

  if (!expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/corridas?error=auth`);
  }

  try {
    // 1. Exchange code for access token + athlete data
    const tokenRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errorParam = tokenRes.status === 403 ? "strava_limit" : "auth";
      return NextResponse.redirect(`${origin}/corridas?error=${errorParam}`);
    }

    const tokenData: StravaTokenResponse = await tokenRes.json();
    const { athlete } = tokenData;

    const email = `athlete_${athlete.id}@auth.largada.app`;
    const fullName = `${athlete.firstname} ${athlete.lastname}`.trim();
    const stravaAvatarUrl = athlete.profile || athlete.profile_medium || "";

    const supabaseAdmin = createAdminClient();

    // 2. Find existing user by indexed strava_athlete_id (O(1) lookup)
    let userId: string | null = null;

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("strava_athlete_id", athlete.id)
      .maybeSingle();

    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      // 3. Try to create new user
      const { data: newUserData, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            strava_id: athlete.id,
            provider: "strava",
          },
        });

      if (newUserData?.user) {
        userId = newUserData.user.id;

        // Ensure profile exists with strava_athlete_id
        // (handle_new_user trigger should create it, but upsert as safety net)
        await supabaseAdmin
          .from("profiles")
          .upsert(
            { id: userId, full_name: fullName, strava_athlete_id: athlete.id },
            { onConflict: "id" },
          );
      } else if (createError) {
        // Fallback: user exists but strava_athlete_id not yet set (pre-migration users)
        // Search by email — check both current and legacy email formats
        const legacyEmail = `strava_${athlete.id}@strava.largada.app`;
        const MAX_PAGES = 20;
        let page = 1;
        const perPage = 50;
        while (page <= MAX_PAGES) {
          const { data: pageData } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage,
          });
          const users = pageData?.users ?? [];
          if (users.length === 0) break;
          const match = users.find(
            (u) => u.email === email || u.email === legacyEmail,
          );
          if (match) {
            userId = match.id;
            break;
          }
          if (users.length < perPage) break;
          page++;
        }

        if (!userId) {
          return NextResponse.redirect(`${origin}/corridas?error=auth`);
        }

        console.warn(
          `[Strava Callback] Fallback user lookup for athlete ${athlete.id} — migrate strava_athlete_id`,
        );
      }
    }

    if (!userId) {
      return NextResponse.redirect(`${origin}/corridas?error=auth`);
    }

    // Copy avatar from Strava CDN to Supabase Storage (Strava API Agreement: 7-day cache limit).
    // Storing locally decouples our app from Strava's infrastructure.
    const localAvatarUrl = stravaAvatarUrl
      ? await uploadAvatarToStorage(supabaseAdmin, userId, stravaAvatarUrl)
      : null;

    const userMetadata = {
      full_name: fullName,
      avatar_url: localAvatarUrl,
      strava_id: athlete.id,
      provider: "strava",
    };

    // Update user metadata and profile with latest info
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: userMetadata,
    });
    await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        avatar_url: localAvatarUrl,
        strava_athlete_id: athlete.id,
      },
      { onConflict: "id" },
    );

    // 4. Store Strava tokens (upsert — handles both first login and re-login)
    await supabaseAdmin.from("strava_tokens").upsert(
      {
        user_id: userId,
        athlete_id: athlete.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        scope: "read,profile:read_all",
      },
      { onConflict: "user_id" },
    );

    // 5. Generate a magic link to create a session
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkError || !linkData) {
      return NextResponse.redirect(`${origin}/corridas?error=auth`);
    }

    // 6. Extract token from the link and verify it to establish session
    const hashed_token = linkData.properties.hashed_token;

    const redirectResponse = NextResponse.redirect(`${origin}/corridas`);
    // Clear the CSRF state cookie
    redirectResponse.cookies.set("strava_oauth_state", "", {
      maxAge: 0,
      path: "/",
    });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
              redirectResponse.cookies.set(name, value, options);
            }
          },
        },
      },
    );

    // Verify the OTP to establish the session (sets cookies via setAll)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: hashed_token,
    });

    if (verifyError) {
      return NextResponse.redirect(`${origin}/corridas?error=auth`);
    }

    // 7. Redirect to the app with session cookies attached
    return redirectResponse;
  } catch {
    return NextResponse.redirect(`${origin}/corridas?error=auth`);
  }
}

/**
 * Download an avatar from an external URL and upload it to Supabase Storage.
 * Returns the public URL of the uploaded avatar, or null on failure.
 * This decouples avatar serving from Strava's CDN (Strava API Agreement: 7-day cache limit).
 */
async function uploadAvatarToStorage(
  admin: SupabaseClient<Database>,
  userId: string,
  externalUrl: string,
): Promise<string | null> {
  try {
    const res = await fetch(externalUrl, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
    const buffer = await res.arrayBuffer();
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("avatars")
      .upload(path, buffer, { contentType, upsert: true });

    if (uploadError) {
      console.warn(
        `[Strava Callback] Avatar upload failed: ${uploadError.message}`,
      );
      return null;
    }

    const { data: urlData } = admin.storage.from("avatars").getPublicUrl(path);
    return urlData.publicUrl;
  } catch (err) {
    console.warn(`[Strava Callback] Avatar download/upload failed:`, err);
    return null;
  }
}

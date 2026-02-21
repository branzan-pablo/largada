import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string; // avatar URL
  profile_medium: string;
}

interface StravaTokenResponse {
  access_token: string;
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

    const email = `strava_${athlete.id}@strava.largada.app`;
    const fullName = `${athlete.firstname} ${athlete.lastname}`.trim();
    const avatarUrl = athlete.profile || athlete.profile_medium || "";

    const supabaseAdmin = createAdminClient();
    const userMetadata = {
      full_name: fullName,
      avatar_url: avatarUrl,
      strava_id: athlete.id,
      provider: "strava",
    };

    // 2. Try to create user — if already exists, Supabase returns an error
    const { data: newUserData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: userMetadata,
      });

    let userId: string;

    if (newUserData?.user) {
      // New user created
      userId = newUserData.user.id;
    } else if (createError) {
      // User already exists — find them (bounded search)
      let existingUserId: string | null = null;
      const MAX_PAGES = 20;
      let page = 1;
      const perPage = 50;
      while (page <= MAX_PAGES) {
        const { data: pageData } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
        const users = pageData?.users ?? [];
        if (users.length === 0) break;
        const match = users.find((u) => u.email === email);
        if (match) {
          existingUserId = match.id;
          break;
        }
        if (users.length < perPage) break;
        page++;
      }

      if (!existingUserId) {
        return NextResponse.redirect(`${origin}/corridas?error=auth`);
      }

      userId = existingUserId;

      // Update user metadata with latest Strava info
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: userMetadata,
      });

      // Update profile with latest info
      await supabaseAdmin
        .from("profiles")
        .update({ full_name: fullName, avatar_url: avatarUrl })
        .eq("id", userId);
    } else {
      return NextResponse.redirect(`${origin}/corridas?error=auth`);
    }

    // 3. Generate a magic link to create a session
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkError || !linkData) {
      return NextResponse.redirect(`${origin}/corridas?error=auth`);
    }

    // 4. Extract token from the link and verify it to establish session
    const hashed_token = linkData.properties.hashed_token;

    const redirectResponse = NextResponse.redirect(`${origin}/corridas`);
    // Clear the CSRF state cookie
    redirectResponse.cookies.set("strava_oauth_state", "", { maxAge: 0, path: "/" });

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
      }
    );

    // Verify the OTP to establish the session (sets cookies via setAll)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: hashed_token,
    });

    if (verifyError) {
      return NextResponse.redirect(`${origin}/corridas?error=auth`);
    }

    // 5. Redirect to the app with session cookies attached
    return redirectResponse;
  } catch {
    return NextResponse.redirect(`${origin}/corridas?error=auth`);
  }
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Force canonical www domain in production to prevent OAuth state mismatch.
  // Skip API routes — redirecting POST requests (e.g. webhooks) breaks them.
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;
  if (host === "largadas.com.br" && !pathname.startsWith("/api/")) {
    const url = request.nextUrl.clone();
    url.host = "www.largadas.com.br";
    return NextResponse.redirect(url, { status: 301 });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Server-side route protection
  const protectedPaths = ["/perfil", "/sugerir", "/admin"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const url = new URL("/corridas", request.url);
    url.searchParams.set("login", "true");
    url.searchParams.set("redirectTo", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Profile checks (admin + onboarding) for authenticated users on app routes
  if (user && !pathname.startsWith("/api/") && !pathname.startsWith("/auth/")) {
    const needsAdminCheck = pathname.startsWith("/admin");
    const needsOnboardingCheck = !pathname.startsWith("/onboarding") && !pathname.startsWith("/reset-password");

    if (needsAdminCheck) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.redirect(new URL("/corridas", request.url));
      }
    } else if (needsOnboardingCheck) {
      const onboardingDone = request.cookies.get("onboarding_completed")?.value === "1";
      if (!onboardingDone) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();

        if (profile && !profile.onboarding_completed) {
          return NextResponse.redirect(new URL("/onboarding", request.url));
        }
        // Cache the result so future requests skip the DB query
        supabaseResponse.cookies.set("onboarding_completed", "1", {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

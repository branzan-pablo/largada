import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  // Server-side route protection
  const protectedPaths = ["/perfil", "/sugerir", "/admin"];
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const url = new URL("/corridas", request.url);
    url.searchParams.set("login", "true");
    return NextResponse.redirect(url);
  }

  // Profile checks (admin + onboarding) for authenticated users on app routes
  if (user && !pathname.startsWith("/api/") && !pathname.startsWith("/auth/")) {
    const needsAdminCheck = pathname.startsWith("/admin");
    const needsOnboardingCheck = isProtected && !pathname.startsWith("/onboarding");

    if (needsAdminCheck || needsOnboardingCheck) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, city_id, onboarding_completed")
        .eq("id", user.id)
        .single();

      if (needsAdminCheck && profile?.role !== "admin") {
        return NextResponse.redirect(new URL("/corridas", request.url));
      }

      if (
        needsOnboardingCheck &&
        profile &&
        !profile.onboarding_completed &&
        profile.city_id === null
      ) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
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

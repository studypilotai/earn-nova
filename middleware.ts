import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // =====================================================
  // GET CURRENT USER
  // =====================================================

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // =====================================================
  // PUBLIC ROUTES
  // =====================================================
  // These pages can be opened without login.

  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/admin/login",
    "/forgot-password",
    "/reset-password",
  ];

  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/auth/");

  // =====================================================
  // CUSTOMER PROTECTED ROUTES
  // =====================================================

  const customerRoutes = [
    "/dashboard",
    "/tasks",
    "/videos",
    "/spin",
    "/referral",
    "/account",
    "/withdraw",
    "/deposit",
    "/activate",
    "/settings",
  ];

  const isCustomerRoute = customerRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );

  // =====================================================
  // ADMIN ROUTES
  // =====================================================

  const isAdminLogin =
    pathname === "/admin/login";

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  // =====================================================
  // ADMIN LOGIN IS PUBLIC
  // =====================================================

  if (isAdminLogin) {
    // Anyone can open admin login page.
    // Logged-in users can also open it.

    return response;
  }

  // =====================================================
  // USER NOT LOGGED IN
  // =====================================================

  if (!user) {
    // Admin panel requires login
    if (isAdminRoute) {
      const loginUrl = new URL(
        "/admin/login",
        request.url
      );

      loginUrl.searchParams.set(
        "redirect",
        pathname
      );

      return NextResponse.redirect(loginUrl);
    }

    // Customer pages require login
    if (isCustomerRoute) {
      const loginUrl = new URL(
        "/login",
        request.url
      );

      loginUrl.searchParams.set(
        "redirect",
        pathname
      );

      return NextResponse.redirect(loginUrl);
    }

    // Public pages are allowed
    return response;
  }

  // =====================================================
  // LOGGED-IN CUSTOMER/ADMIN
  // =====================================================

  // Don't allow logged-in users to go back to
  // customer login/signup.

  if (
    pathname === "/login" ||
    pathname === "/signup"
  ) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  // =====================================================
  // ADMIN PROTECTION
  // =====================================================

  if (isAdminRoute) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    // Profile missing or database error
    if (error || !profile) {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }

    // Only admin can access admin panel
    if (profile.role !== "admin") {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      );
    }

    // Admin allowed
    return response;
  }

  // =====================================================
  // CUSTOMER PROTECTED ROUTES
  // =====================================================

  if (isCustomerRoute) {
    return response;
  }

  // =====================================================
  // OTHER ROUTES
  // =====================================================

  return response;
}

// =======================================================
// MIDDLEWARE MATCHER
// =======================================================

export const config = {
  matcher: [
    // Customer routes
    "/dashboard/:path*",
    "/tasks/:path*",
    "/videos/:path*",
    "/spin/:path*",
    "/referral/:path*",
    "/account/:path*",
    "/withdraw/:path*",
    "/deposit/:path*",
    "/activate/:path*",
    "/settings/:path*",

    // Admin routes
    "/admin/:path*",

    // Authentication routes
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",

    // Auth callbacks
    "/auth/:path*",
  ],
};
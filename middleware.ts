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

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(name, value, options);
            }
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  /* =========================================================
     BASIC ROUTE TYPES
     ========================================================= */

  const isMaintenancePage =
    pathname === "/maintenance";

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const isAdminApiRoute =
    pathname === "/api/admin" ||
    pathname.startsWith("/api/admin/");

  const isApiRoute =
    pathname.startsWith("/api/");

  /* =========================================================
     PUBLIC ROUTES
     ========================================================= */

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

  /* =========================================================
     GET CURRENT USER
     ========================================================= */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* =========================================================
     MAINTENANCE MODE
     ========================================================= */

  let maintenanceMode = false;

  try {
    const { data: settings } = await supabase
      .from("site_settings")
      .select("maintenance_mode")
      .eq("id", 1)
      .maybeSingle();

    maintenanceMode =
      settings?.maintenance_mode === true;
  } catch (error) {
    console.error(
      "Maintenance check failed:",
      error
    );
  }

  /* =========================================================
     MAINTENANCE PAGE ITSELF
     ========================================================= */

  if (isMaintenancePage) {
    /*
     * If maintenance is OFF, don't leave the user
     * stuck on /maintenance.
     */
    if (!maintenanceMode) {
      if (user) {
        return NextResponse.redirect(
          new URL("/dashboard", request.url)
        );
      }

      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }

    return response;
  }

  /* =========================================================
     ADMIN ACCESS DURING MAINTENANCE
     ========================================================= */

  if (maintenanceMode) {
    /*
     * Admin routes remain accessible so admin can
     * turn maintenance mode OFF.
     */

    if (isAdminRoute || isAdminApiRoute) {
      /*
       * Continue below for normal admin authentication
       * and role checking.
       */
    } else {
      /*
       * Every customer/public/API route goes to
       * maintenance page.
       *
       * This includes:
       * /
       * /login
       * /signup
       * /dashboard
       * /activate
       * /forgot-password
       * /reset-password
       * etc.
       */

      return NextResponse.redirect(
        new URL("/maintenance", request.url)
      );
    }
  }

  /* =========================================================
     PUBLIC ROUTES
     ========================================================= */

  if (isPublicRoute) {
    return response;
  }

  /* =========================================================
     API ROUTES
     ========================================================= */

  /*
   * Non-admin APIs should normally require authentication.
   *
   * Admin APIs are allowed through maintenance mode,
   * but the API itself performs admin verification.
   */

  if (isApiRoute) {
    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    return response;
  }

  /* =========================================================
     AUTH REQUIRED
     ========================================================= */

  if (!user) {
    if (isAdminRoute) {
      return NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  /* =========================================================
     ADMIN ROLE CHECK
     ========================================================= */

  if (isAdminRoute) {
    const { data: profile, error } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (
      error ||
      !profile ||
      profile.role !== "admin"
    ) {
      /*
       * If maintenance is active, don't expose
       * admin pages to normal customers.
       */
      if (maintenanceMode) {
        return NextResponse.redirect(
          new URL("/maintenance", request.url)
        );
      }

      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }

    return response;
  }

  /* =========================================================
     CUSTOMER PROFILE CHECK
     ========================================================= */

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select(
        "id, role, is_blocked, block_reason"
      )
      .eq("id", user.id)
      .maybeSingle();

  /*
   * Profile missing / query failed
   */
  if (profileError || !profile) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  /* =========================================================
     BLOCKED ACCOUNT
     ========================================================= */

  if (
    profile.role === "customer" &&
    profile.is_blocked === true
  ) {
    /*
     * Keep blocked customer away from protected
     * customer pages.
     */
    if (
      pathname.startsWith("/dashboard") ||
      pathname === "/activate"
    ) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }
  }

  /* =========================================================
     CUSTOMER ACTIVATION CHECK
     ========================================================= */

  if (
    profile.role === "customer"
  ) {
    const isDashboardRoute =
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/");

    const isActivateRoute =
      pathname === "/activate" ||
      pathname.startsWith("/activate/");

    /*
     * Admin pages already returned above.
     */

    if (
      isDashboardRoute &&
      !isActivateRoute
    ) {
      const { data: activation } =
        await supabase
          .from("activations")
          .select("status")
          .eq("user_id", user.id)
          .in("status", [
            "pending",
            "approved",
          ])
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      /*
       * No approved activation:
       *
       * Send user to /activate.
       */
      if (
        !activation ||
        activation.status !== "approved"
      ) {
        return NextResponse.redirect(
          new URL("/activate", request.url)
        );
      }
    }

    /*
     * If user is already activated and visits
     * /activate, send them to dashboard.
     */
    if (isActivateRoute) {
      const { data: activation } =
        await supabase
          .from("activations")
          .select("status")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      if (activation?.status === "approved") {
        return NextResponse.redirect(
          new URL("/dashboard", request.url)
        );
      }
    }
  }

  /* =========================================================
     DEFAULT
     ========================================================= */

  return response;
}

/* =========================================================
   MIDDLEWARE MATCHER
   ========================================================= */

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
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

  const pathname = request.nextUrl.pathname;

  /* =========================================================
     ROUTE TYPES
  ========================================================= */

  const isMaintenancePage = pathname === "/maintenance";

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const isAdminApiRoute =
    pathname === "/api/admin" ||
    pathname.startsWith("/api/admin/");

  const isApiRoute = pathname.startsWith("/api/");

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
     AUTH USER
  ========================================================= */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* =========================================================
     MAINTENANCE
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
     MAINTENANCE PAGE
  ========================================================= */

  if (isMaintenancePage) {
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
     MAINTENANCE MODE
  ========================================================= */

  if (maintenanceMode) {
    if (!isAdminRoute && !isAdminApiRoute) {
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
     API
  ========================================================= */

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
     LOGIN REQUIRED
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
     ADMIN ROUTES
  ========================================================= */

  if (isAdminRoute) {
    const {
      data: profile,
      error,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (
      error ||
      !profile ||
      profile.role !== "admin"
    ) {
      await supabase.auth.signOut();

      return NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
    }

    return response;
  }

  /* =========================================================
     CUSTOMER PROFILE
  ========================================================= */

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      "id, role, is_blocked, block_reason"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();

    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  /* =========================================================
     CUSTOMER CANNOT ACCESS ADMIN
  ========================================================= */

  if (profile.role === "customer") {
    /*
     * Customer dashboard is ALWAYS allowed.
     * Activation status does NOT affect routing.
     */

    if (
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/")
    ) {
      if (profile.is_blocked === true) {
        await supabase.auth.signOut();

        return NextResponse.redirect(
          new URL("/login", request.url)
        );
      }

      return response;
    }

    /* =======================================================
       CUSTOMER ACTIVATE PAGE
    ======================================================= */

    if (
      pathname === "/activate" ||
      pathname.startsWith("/activate/")
    ) {
      if (profile.is_blocked === true) {
        await supabase.auth.signOut();

        return NextResponse.redirect(
          new URL("/login", request.url)
        );
      }

      return response;
    }

    /* =======================================================
       CUSTOMER NORMAL PROTECTED PAGES
    ======================================================= */

    if (profile.is_blocked === true) {
      await supabase.auth.signOut();

      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }

    return response;
  }

  /* =========================================================
     UNKNOWN / INVALID ROLE
  ========================================================= */

  await supabase.auth.signOut();

  return NextResponse.redirect(
    new URL("/login", request.url)
  );
}

/* =========================================================
   MATCHER
========================================================= */

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};


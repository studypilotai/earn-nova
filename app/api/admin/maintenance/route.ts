import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function getAdmin() {
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
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) => {
                cookieStore.set(name, value, options);
              }
            );
          } catch {}
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return null;
  }

  return user;
}

/*
 * =========================================================
 * GET MAINTENANCE SETTINGS
 * =========================================================
 */

export async function GET() {
  try {
    const admin = await getAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await supabase
      .from("site_settings")
      .select(
        "id, maintenance_mode, maintenance_title, maintenance_message, updated_at"
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings: data,
    });
  } catch (error) {
    console.error("Maintenance GET error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/*
 * =========================================================
 * UPDATE MAINTENANCE SETTINGS
 * =========================================================
 */

export async function PATCH(request: Request) {
  try {
    const admin = await getAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (
      typeof body.maintenance_mode !== "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "maintenance_mode must be true or false",
        },
        { status: 400 }
      );
    }

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY is missing",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const updateData: {
      maintenance_mode: boolean;
      maintenance_title?: string;
      maintenance_message?: string;
    } = {
      maintenance_mode:
        body.maintenance_mode,
    };

    if (
      typeof body.maintenance_title ===
        "string" &&
      body.maintenance_title.trim()
    ) {
      updateData.maintenance_title =
        body.maintenance_title.trim();
    }

    if (
      typeof body.maintenance_message ===
        "string" &&
      body.maintenance_message.trim()
    ) {
      updateData.maintenance_message =
        body.maintenance_message.trim();
    }

    const { data, error } = await supabase
      .from("site_settings")
      .update(updateData)
      .eq("id", 1)
      .select(
        "id, maintenance_mode, maintenance_title, maintenance_message, updated_at"
      )
      .single();

    if (error) {
      console.error(
        "Maintenance update error:",
        error
      );

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: data,
    });
  } catch (error) {
    console.error(
      "Maintenance PATCH error:",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
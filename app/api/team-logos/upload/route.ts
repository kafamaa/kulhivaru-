import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

export async function POST(request: Request) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    return NextResponse.json(
      {
        error:
          "Missing Supabase service-role credentials on server.",
        details: {
          NEXT_PUBLIC_SUPABASE_URL: url ? "set" : "missing",
          SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey
            ? "set"
            : "missing",
        },
      },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const teamId = String(formData.get("teamId") ?? "");
  const file = formData.get("file");

  if (!teamId) {
    return NextResponse.json({ error: "teamId is required" }, { status: 400 });
  }
  if (!file || typeof (file as any).arrayBuffer !== "function") {
    return NextResponse.json(
      { error: "file is required" },
      { status: 400 }
    );
  }

  const originalName = (file as any).name || "logo";
  const path = `teams/${teamId}/${Date.now()}-${originalName}`;

  const { error: uploadError } = await admin.storage
    .from("team-logos")
    .upload(path, file as any, {
      upsert: true,
      contentType: (file as any).type || undefined,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("team-logos").getPublicUrl(path);

  if (!publicUrl) {
    return NextResponse.json(
      { error: "Could not generate public URL." },
      { status: 500 }
    );
  }

  // Update team profile using service role (bypasses RLS)
  const { error: teamError } = await admin
    .from("teams")
    .update({ logo_url: publicUrl })
    .eq("id", teamId);

  if (teamError) {
    return NextResponse.json(
      { error: teamError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ publicUrl });
}


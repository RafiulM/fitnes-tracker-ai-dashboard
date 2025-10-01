import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { z } from "zod";

const profileUpdateSchema = z.object({
  target_weight: z.number().positive().max(1000).nullable().optional(),
  weight_unit: z.enum(["lbs", "kg"]).optional(),
  dietary_preference: z.string().max(120).nullable().optional(),
  theme_preference: z.enum(["light", "dark", "system"]).optional(),
});

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert({ user_id: userId })
      .select("*")
      .maybeSingle();

    if (createError) {
      return Response.json({ error: createError.message }, { status: 500 });
    }

    return Response.json({ data: created });
  }

  return Response.json({ data });
}

export async function PUT(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const payload = profileUpdateSchema.parse(await req.json());

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      user_id: userId,
      ...payload,
    }, {
      onConflict: "user_id",
    })
    .select("*")
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data });
}

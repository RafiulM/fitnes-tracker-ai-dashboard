import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { z } from "zod";

const querySchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export async function GET(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const searchParams = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = querySchema.safeParse(searchParams);

  if (!parsed.success) {
    return Response.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const { start, end, limit } = parsed.data;

  let query = supabase
    .from("meals")
    .select(
      "id, description, calories, protein_g, carbs_g, fats_g, eaten_at, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("eaten_at", { ascending: false });

  if (start) {
    query = query.gte("eaten_at", start);
  }
  if (end) {
    query = query.lte("eaten_at", end);
  }
  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ data });
}

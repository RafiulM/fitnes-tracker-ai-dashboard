import { createSupabaseServerClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let query = supabase
      .from("workouts")
      .select("*")
      .eq("user_id", userId)
      .order("performed_at", { ascending: false });

    if (startDate) {
      query = query.gte("performed_at", startDate);
    }
    if (endDate) {
      query = query.lte("performed_at", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching workouts:", error);
      return NextResponse.json(
        { error: "Failed to fetch workouts" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Workouts API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { type, sets, reps, load, performed_at } = await req.json();

    if (!type) {
      return NextResponse.json(
        { error: "Workout type is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("workouts")
      .insert({
        user_id: userId,
        type,
        sets,
        reps,
        load,
        performed_at: performed_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating workout entry:", error);
      return NextResponse.json(
        { error: "Failed to create workout entry" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Workouts API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
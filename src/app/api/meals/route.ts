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
      .from("meals")
      .select("*")
      .eq("user_id", userId)
      .order("eaten_at", { ascending: false });

    if (startDate) {
      query = query.gte("eaten_at", startDate);
    }
    if (endDate) {
      query = query.lte("eaten_at", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching meals:", error);
      return NextResponse.json(
        { error: "Failed to fetch meals" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Meals API error:", error);
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
    const { description, calories, eaten_at } = await req.json();

    if (!description) {
      return NextResponse.json(
        { error: "Meal description is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("meals")
      .insert({
        user_id: userId,
        description,
        calories,
        eaten_at: eaten_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating meal entry:", error);
      return NextResponse.json(
        { error: "Failed to create meal entry" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Meals API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
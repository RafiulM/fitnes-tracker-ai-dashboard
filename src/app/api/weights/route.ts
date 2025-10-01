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
      .from("weights")
      .select("*")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false });

    if (startDate) {
      query = query.gte("recorded_at", startDate);
    }
    if (endDate) {
      query = query.lte("recorded_at", endDate);
    }

    const { data, error } = await query;

    console.log (data, error)

    if (error) {
      console.error("Error fetching weights:", error);
      return NextResponse.json(
        { error: "Failed to fetch weights" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Weights API error:", error);
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
    const { weight, unit, recorded_at } = await req.json();

    if (!weight || !unit) {
      return NextResponse.json(
        { error: "Weight and unit are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("weights")
      .insert({
        user_id: userId,
        weight,
        unit,
        recorded_at: recorded_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating weight entry:", error);
      return NextResponse.json(
        { error: "Failed to create weight entry" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Weights API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
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
      .from("body_fat")
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

    if (error) {
      console.error("Error fetching body fat:", error);
      return NextResponse.json(
        { error: "Failed to fetch body fat data" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Body fat API error:", error);
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
    const { percentage, recorded_at } = await req.json();

    if (!percentage) {
      return NextResponse.json(
        { error: "Body fat percentage is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("body_fat")
      .insert({
        user_id: userId,
        percentage,
        recorded_at: recorded_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating body fat entry:", error);
      return NextResponse.json(
        { error: "Failed to create body fat entry" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Body fat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
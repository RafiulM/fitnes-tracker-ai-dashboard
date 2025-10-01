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
    const planType = searchParams.get("type");

    let query = supabase
      .from("plans")
      .select("*")
      .eq("user_id", userId)
      .order("generated_at", { ascending: false });

    if (planType) {
      query = query.eq("plan_type", planType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching plans:", error);
      return NextResponse.json(
        { error: "Failed to fetch plans" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Plans API error:", error);
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
    const { plan_type, content } = await req.json();

    if (!plan_type || !content) {
      return NextResponse.json(
        { error: "Plan type and content are required" },
        { status: 400 }
      );
    }

    if (!["workout", "diet"].includes(plan_type)) {
      return NextResponse.json(
        { error: "Plan type must be 'workout' or 'diet'" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("plans")
      .insert({
        user_id: userId,
        plan_type,
        content,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating plan:", error);
      return NextResponse.json(
        { error: "Failed to create plan" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Plans API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
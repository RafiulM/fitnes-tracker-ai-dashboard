import { createSupabaseServerClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { planType } = await req.json();

    if (!["workout", "diet"].includes(planType)) {
      return NextResponse.json(
        { error: "Plan type must be 'workout' or 'diet'" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Fetch user's recent data for context
    const [weights, bodyFat, workouts, meals] = await Promise.all([
      supabase.from("weights").select("*").eq("user_id", userId).order("recorded_at", { ascending: false }).limit(5),
      supabase.from("body_fat").select("*").eq("user_id", userId).order("recorded_at", { ascending: false }).limit(5),
      supabase.from("workouts").select("*").eq("user_id", userId).order("performed_at", { ascending: false }).limit(10),
      supabase.from("meals").select("*").eq("user_id", userId).order("eaten_at", { ascending: false }).limit(10)
    ]);

    const userData = {
      weights: weights.data || [],
      bodyFat: bodyFat.data || [],
      workouts: workouts.data || [],
      meals: meals.data || []
    };

    // Generate plan based on type
    const plan = await generatePlan(planType, userData);

    if (!plan) {
      return NextResponse.json(
        { error: "Failed to generate plan" },
        { status: 500 }
      );
    }

    // Save plan to database
    const { data: savedPlan, error: saveError } = await supabase
      .from("plans")
      .insert({
        user_id: userId,
        plan_type: planType,
        content: plan,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving plan:", saveError);
      return NextResponse.json(
        { error: "Failed to save plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      plan: savedPlan,
      content: plan
    });

  } catch (error) {
    console.error("Plan generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function generatePlan(planType: string, userData: {
  weights: Array<{ weight: number; unit: string }>;
  bodyFat: Array<{ percentage: number }>;
  workouts: Array<{ type: string; sets?: number; reps?: number; load?: number }>;
  meals: Array<{ description: string; calories?: number }>;
}) {
  const currentWeight = userData.weights[0]?.weight;
  const targetWeight = null; // No profile table for target weight
  const currentBodyFat = userData.bodyFat[0]?.percentage;
  const preferredUnits = userData.weights[0]?.unit || 'lbs';
  const dietaryPreferences = null; // No profile table for dietary preferences

  let prompt = "";

  if (planType === "workout") {
    prompt = `Generate a personalized workout plan based on the following user data:

Current stats:
- Weight: ${currentWeight} ${preferredUnits}
- Body fat: ${currentBodyFat}%
- Target weight: ${targetWeight} ${preferredUnits}

Recent workouts:
${userData.workouts.map((w) => `- ${w.type}: ${w.sets} sets × ${w.reps} reps${w.load ? ` at ${w.load} ${preferredUnits}` : ''}`).join('\n')}

Please create a 7-day workout plan that includes:
1. Specific exercises for each day
2. Sets, reps, and recommended weights
3. Rest days
4. Progression guidance
5. Warm-up and cool-down recommendations

Format the response as JSON with this structure:
{
  "title": "7-Day Workout Plan",
  "description": "Brief overview of the plan",
  "days": [
    {
      "day": "Monday",
      "focus": "Chest & Triceps",
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 4,
          "reps": 8-10,
          "weight": "Recommended weight",
          "notes": "Keep form strict"
        }
      ]
    }
  ],
  "notes": ["Additional tips and guidance"]
}`;
  } else if (planType === "diet") {
    prompt = `Generate a personalized diet plan based on the following user data:

Current stats:
- Weight: ${currentWeight} ${preferredUnits}
- Body fat: ${currentBodyFat}%
- Target weight: ${targetWeight} ${preferredUnits}
- Dietary preferences: ${dietaryPreferences || 'None specified'}

Recent meals:
${userData.meals.map((m) => `- ${m.description}${m.calories ? ` (${m.calories} calories)` : ''}`).join('\n')}

Please create a 7-day diet plan that includes:
1. Daily meal plans (breakfast, lunch, dinner, snacks)
2. Calorie targets for each day
3. Macronutrient breakdown
4. Meal prep suggestions
5. Healthy meal options

Format the response as JSON with this structure:
{
  "title": "7-Day Nutrition Plan",
  "description": "Brief overview of the nutrition approach",
  "dailyCalories": 2000,
  "macros": {
    "protein": "150g",
    "carbs": "200g",
    "fats": "65g"
  },
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "type": "Breakfast",
          "foods": ["Oatmeal with berries", "Greek yogurt"],
          "calories": 400,
          "notes": "High protein start"
        }
      ],
      "totalCalories": 2000
    }
  ],
  "tips": ["Nutrition advice and tips"]
}`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional fitness and nutrition coach. Generate detailed, personalized plans based on user data. Always respond with valid JSON.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (content) {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Error parsing plan JSON:', parseError);
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error generating plan:', error);
    return null;
  }
}
import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { GeneratedPlan, StructuredChatPayload } from "@/types/fitness";

const chatRequestSchema = z.object({
  message: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .default([]),
});

const isoDateTime = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Invalid datetime",
  });

const structuredOutputSchema = z.object({
  entries: z
    .array(
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("weight"),
          weight: z.number().positive(),
          unit: z.enum(["lbs", "kg"]).default("lbs"),
          recorded_at: isoDateTime,
        }),
        z.object({
          type: z.literal("body_fat"),
          percentage: z.number().positive().max(100),
          recorded_at: isoDateTime,
        }),
        z.object({
          type: z.literal("workout"),
          activity: z.string().min(1),
          sets: z.number().int().positive().optional(),
          reps: z.number().int().positive().optional(),
          load: z.number().positive().optional(),
          distance: z.number().positive().optional(),
          duration_minutes: z.number().positive().optional(),
          intensity: z.string().optional(),
          performed_at: isoDateTime,
        }),
        z.object({
          type: z.literal("meal"),
          description: z.string().min(1),
          calories: z.number().positive().optional(),
          protein_g: z.number().positive().optional(),
          carbs_g: z.number().positive().optional(),
          fats_g: z.number().positive().optional(),
          eaten_at: isoDateTime,
        }),
      ]),
    )
    .default([]),
  plan_request: z
    .object({
      plan_type: z.enum(["workout", "diet"]),
      focus: z.string().optional(),
      duration_weeks: z.number().int().positive().optional(),
    })
    .optional(),
  clarification_needed: z.boolean().default(false),
  clarification_message: z.string().optional(),
  acknowledgements: z.array(z.string()).default([]),
});

const planSchema = z.object({
  plan_type: z.enum(["workout", "diet"]),
  title: z.string(),
  focus: z.string(),
  summary: z.string(),
  schedule: z
    .array(
      z.object({
        day: z.string(),
        headline: z.string(),
        details: z.string(),
      }),
    )
    .min(3),
  key_points: z.array(z.string()).min(1),
  tips: z.array(z.string()).min(1),
});

async function generatePlanResponse(
  planRequest: NonNullable<StructuredChatPayload["plan_request"]>,
  userName?: string | null,
) {
  const today = new Date().toISOString().split("T")[0];

  const planResult = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: planSchema,
    messages: [
      {
        role: "system",
        content:
          `You are an AI fitness coach creating concise, motivating plans that are safe for a healthy adult. Keep intensity descriptors moderate unless the user explicitly trains advanced. Today's date is ${today}.`,
      },
      {
        role: "user",
        content: `Create a ${planRequest.plan_type} plan${
          planRequest.focus ? ` focused on ${planRequest.focus}` : ""
        } lasting ${planRequest.duration_weeks ?? 1} weeks for ${
          userName ?? "the user"
        }. Deliver a structured response with schedule entries per day.`,
      },
    ],
  });

  const plan = planResult.object;

  const rendered = await generateText({
    model: openai("gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content:
          "Summarize the provided fitness plan conversationally in under 180 words. Include a short headline, and invite the user to confirm or ask for changes.",
      },
      {
        role: "user",
        content: JSON.stringify(plan),
      },
    ],
  });

  return {
    plan: plan as GeneratedPlan,
    response: rendered.text,
  };
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      {
        error:
          "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.",
      },
      { status: 500 },
    );
  }

  try {
    const parsedBody = chatRequestSchema.parse(await req.json());
    const supabase = await createSupabaseServerClient();

  const extraction = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: structuredOutputSchema,
    messages: [
      {
        role: "system",
        content:
          `You are an elite fitness tracking assistant. Today's date is ${new Date().toISOString().split("T")[0]}. Extract structured metrics from a user's message. Use ISO 8601 timestamps. Assume missing timestamps mean 'now'. Do not invent impossible values. Recognize requests for workout or diet plans. If you cannot find concrete numbers, set clarification_needed true and explain why.`,
      },
        ...parsedBody.history,
        {
          role: "user",
          content: parsedBody.message,
        },
      ],
    });

    const payload = extraction.object as StructuredChatPayload;

    const savedEntries: {
      weights: number;
      bodyFat: number;
      workouts: number;
      meals: number;
    } = { weights: 0, bodyFat: 0, workouts: 0, meals: 0 };

    if (!payload.clarification_needed && payload.entries.length > 0) {
      await Promise.all(
        payload.entries.map(async (entry) => {
          switch (entry.type) {
            case "weight": {
              const { error } = await supabase.from("weights").insert({
                user_id: userId,
                weight: entry.weight,
                unit: entry.unit,
                recorded_at: new Date(entry.recorded_at).toISOString(),
              });
              if (error) throw error;
              savedEntries.weights += 1;
              break;
            }
            case "body_fat": {
              const { error } = await supabase.from("body_fat").insert({
                user_id: userId,
                percentage: entry.percentage,
                recorded_at: new Date(entry.recorded_at).toISOString(),
              });
              if (error) throw error;
              savedEntries.bodyFat += 1;
              break;
            }
            case "workout": {
              const { error } = await supabase.from("workouts").insert({
                user_id: userId,
                activity: entry.activity,
                sets: entry.sets ?? null,
                reps: entry.reps ?? null,
                load: entry.load ?? null,
                distance: entry.distance ?? null,
                duration_minutes: entry.duration_minutes ?? null,
                intensity: entry.intensity ?? null,
                performed_at: new Date(entry.performed_at).toISOString(),
              });
              if (error) throw error;
              savedEntries.workouts += 1;
              break;
            }
            case "meal": {
              const { error } = await supabase.from("meals").insert({
                user_id: userId,
                description: entry.description,
                calories: entry.calories ?? null,
                protein_g: entry.protein_g ?? null,
                carbs_g: entry.carbs_g ?? null,
                fats_g: entry.fats_g ?? null,
                eaten_at: new Date(entry.eaten_at).toISOString(),
              });
              if (error) throw error;
              savedEntries.meals += 1;
              break;
            }
          }
        }),
      );
    }

    let planResponse: Awaited<ReturnType<typeof generatePlanResponse>> | null = null;
    let persistedPlan: {
      id: string;
      plan_type: "workout" | "diet";
      title: string;
      focus: string | null;
      summary: string | null;
      content: unknown;
      generated_at: string;
      created_at: string;
      updated_at: string;
    } | null = null;

    if (!payload.clarification_needed && payload.plan_request) {
      planResponse = await generatePlanResponse(payload.plan_request);
      const { data, error } = await supabase
        .from("plans")
        .insert({
          user_id: userId,
          plan_type: planResponse.plan.plan_type,
          title: planResponse.plan.title,
          focus: planResponse.plan.focus,
          summary: planResponse.plan.summary,
          content: planResponse.plan,
        })
        .select("*")
        .maybeSingle();
      if (error) throw error;
      persistedPlan = data;
    }

    let assistantMessage = "";

    if (payload.clarification_needed) {
      assistantMessage =
        payload.clarification_message ??
        "I couldn’t confidently log that. Could you share the specific numbers or details?";
    } else {
      if (payload.acknowledgements.length > 0) {
        assistantMessage += payload.acknowledgements.join(" \n");
      }
      const savedSummary: string[] = [];
      if (savedEntries.weights) {
        savedSummary.push(`Logged ${savedEntries.weights} weight entry`);
      }
      if (savedEntries.bodyFat) {
        savedSummary.push(`Updated ${savedEntries.bodyFat} body fat reading`);
      }
      if (savedEntries.workouts) {
        savedSummary.push(`Captured ${savedEntries.workouts} workout`);
      }
      if (savedEntries.meals) {
        savedSummary.push(`Recorded ${savedEntries.meals} meal`);
      }
      if (savedSummary.length) {
        assistantMessage += `${assistantMessage ? "\n\n" : ""}${savedSummary.join(", ")}.`;
      }
      if (planResponse) {
        assistantMessage += `${assistantMessage ? "\n\n" : ""}${planResponse.response}`;
      }
      if (!assistantMessage) {
        assistantMessage = "All set! Let me know when you have new stats or need a plan.";
      }
    }

    return Response.json(
      {
        message: assistantMessage,
        stored: savedEntries,
        clarification: payload.clarification_needed,
        plan: persistedPlan,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process chat request. Please try again shortly.",
      },
      { status: 500 },
    );
  }
}

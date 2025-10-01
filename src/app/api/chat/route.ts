import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";

// Types for extracted fitness data
interface WeightEntry {
  weight: number;
  unit: 'lbs' | 'kg';
  recorded_at: string;
}

interface BodyFatEntry {
  percentage: number;
  recorded_at: string;
}

interface WorkoutEntry {
  type: string;
  sets?: number;
  reps?: number;
  load?: number;
  performed_at: string;
}

interface MealEntry {
  description: string;
  calories?: number;
  eaten_at: string;
}

interface ExtractedData {
  weights?: WeightEntry[];
  bodyFat?: BodyFatEntry[];
  workouts?: WorkoutEntry[];
  meals?: MealEntry[];
}

const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
};

const SYSTEM_PROMPT = `You are a fitness tracking assistant. When users describe their fitness activities, extract the specific data points and structure them as JSON.

Today's date is ${getCurrentDate()}. When users don't specify a time for their fitness activities, assume they happened today at a reasonable time:
- For morning measurements (weight, body fat): use 08:00 local time
- For workouts: use the current time or a reasonable workout time
- For meals: use the current time or appropriate meal time (breakfast: 08:00, lunch: 12:00, dinner: 18:00)

For weights: Look for weight measurements with units (lbs/kg)
For body fat: Look for body fat percentages
For workouts: Look for exercise type, sets, reps, and weight/load
For meals: Look for food descriptions and try to estimate calories if mentioned

Always respond with a JSON object containing any extracted data. If no data can be extracted, return an empty object.

Example response format:
{
  "weights": [{"weight": 180, "unit": "lbs", "recorded_at": "2024-01-01T08:00:00Z"}],
  "bodyFat": [{"percentage": 15.5, "recorded_at": "2024-01-01T08:00:00Z"}],
  "workouts": [{"type": "squats", "sets": 4, "reps": 10, "load": 135, "performed_at": "2024-01-01T10:00:00Z"}],
  "meals": [{"description": "grilled chicken salad", "calories": 350, "eaten_at": "2024-01-01T12:00:00Z"}]

If the user is asking for a workout or diet plan, respond with a helpful conversational message instead of JSON.`;

async function extractFitnessData(message: string): Promise<ExtractedData | null> {
  try {
    console.log('Extracting fitness data from message:', message);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    console.log('OpenAI raw response:', content);

    if (content) {
      try {
        // Strip markdown code blocks if present
        let cleanContent = content.trim();
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const parsed = JSON.parse(cleanContent);
        console.log('Parsed fitness data:', parsed);
        return parsed;
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError, 'Content was:', content);
        return null;
      }
    }
    console.log('No content in OpenAI response');
    return null;
  } catch (error) {
    console.error('Error extracting fitness data:', error);
    return null;
  }
}

async function saveFitnessData(userId: string, extractedData: ExtractedData) {
  console.log('Saving fitness data for user:', userId, 'Data:', extractedData);

  const supabase = await createSupabaseServerClient();

  try {
    if (extractedData.weights && extractedData.weights.length > 0) {
      console.log('Saving weights:', extractedData.weights);
      for (const weight of extractedData.weights) {
        const weightData = {
          user_id: userId,
          weight: weight.weight,
          unit: weight.unit,
          recorded_at: weight.recorded_at || new Date().toISOString(),
        };
        console.log('Inserting weight:', weightData);

        const { data, error } = await supabase.from('weights').insert(weightData).select();
        if (error) {
          console.error('Error saving weight:', error);
        } else {
          console.log('Weight saved successfully:', data);
        }
      }
    }

    if (extractedData.bodyFat && extractedData.bodyFat.length > 0) {
      console.log('Saving body fat:', extractedData.bodyFat);
      for (const bodyFat of extractedData.bodyFat) {
        const bodyFatData = {
          user_id: userId,
          percentage: bodyFat.percentage,
          recorded_at: bodyFat.recorded_at || new Date().toISOString(),
        };
        console.log('Inserting body fat:', bodyFatData);

        const { data, error } = await supabase.from('body_fat').insert(bodyFatData).select();
        if (error) {
          console.error('Error saving body fat:', error);
        } else {
          console.log('Body fat saved successfully:', data);
        }
      }
    }

    if (extractedData.workouts && extractedData.workouts.length > 0) {
      console.log('Saving workouts:', extractedData.workouts);
      for (const workout of extractedData.workouts) {
        const workoutData = {
          user_id: userId,
          type: workout.type,
          sets: workout.sets,
          reps: workout.reps,
          load: workout.load,
          performed_at: workout.performed_at || new Date().toISOString(),
        };
        console.log('Inserting workout:', workoutData);

        const { data, error } = await supabase.from('workouts').insert(workoutData).select();
        if (error) {
          console.error('Error saving workout:', error);
        } else {
          console.log('Workout saved successfully:', data);
        }
      }
    }

    if (extractedData.meals && extractedData.meals.length > 0) {
      console.log('Saving meals:', extractedData.meals);
      for (const meal of extractedData.meals) {
        const mealData = {
          user_id: userId,
          description: meal.description,
          calories: meal.calories,
          eaten_at: meal.eaten_at || new Date().toISOString(),
        };
        console.log('Inserting meal:', mealData);

        const { data, error } = await supabase.from('meals').insert(mealData).select();
        if (error) {
          console.error('Error saving meal:', error);
        } else {
          console.log('Meal saved successfully:', data);
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error in saveFitnessData:', error);
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || '';

    console.log('Processing chat message:', lastMessage);

    // Try to extract fitness data from the message
    const extractedData = await extractFitnessData(lastMessage);

    console.log('Extracted data result:', extractedData);

    if (extractedData && (Object.keys(extractedData).length > 0)) {
      console.log('Valid data extracted, saving to database');
      // Save extracted data to database
      await saveFitnessData(userId, extractedData);

      // Create confirmation messages
      const confirmations = [];
      if (extractedData.weights?.length) {
        confirmations.push(`Logged ${extractedData.weights.length} weight measurement(s)`);
      }
      if (extractedData.bodyFat?.length) {
        confirmations.push(`Logged ${extractedData.bodyFat.length} body fat measurement(s)`);
      }
      if (extractedData.workouts?.length) {
        confirmations.push(`Logged ${extractedData.workouts.length} workout(s)`);
      }
      if (extractedData.meals?.length) {
        confirmations.push(`Logged ${extractedData.meals.length} meal(s)`);
      }

      const confirmationMessage = confirmations.length > 0
        ? `Great! I've ${confirmations.join(' and ')}. Anything else you'd like to log?`
        : "I didn't catch any fitness data in that message. Could you try again with specific details?";

      console.log('Confirmation message:', confirmationMessage);

      const result = streamText({
        model: openai("gpt-4o"),
        messages: [
          ...messages.slice(0, -1),
          { role: 'user', content: lastMessage },
          { role: 'assistant', content: confirmationMessage }
        ],
      });

      return result.toDataStreamResponse();
    }

    console.log('No fitness data extracted, proceeding with normal chat');
    // If no data extracted, proceed with normal chat
    const result = streamText({
      model: openai("gpt-4o"),
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error:
          "Failed to process chat request. Please check your API configuration.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

import { subDays } from "date-fns";
import DashboardClient from "@/components/dashboard/dashboard-client";
import { createSupabaseServerClient } from "@/lib/supabase";
import type {
  BodyFatEntry,
  MealEntry,
  PlanEntry,
  WeightEntry,
  WorkoutEntry,
} from "@/types/fitness";

const DEFAULT_RANGE_DAYS = 90;

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const end = new Date();
  const startIso = subDays(end, DEFAULT_RANGE_DAYS).toISOString();

  const [weightsRes, bodyFatRes, workoutsRes, mealsRes, plansRes] = await Promise.all([
    supabase
      .from("weights")
      .select("id, weight, unit, recorded_at, created_at, updated_at")
      .gte("recorded_at", startIso)
      .order("recorded_at", { ascending: false }),
    supabase
      .from("body_fat")
      .select("id, percentage, recorded_at, created_at, updated_at")
      .gte("recorded_at", startIso)
      .order("recorded_at", { ascending: false }),
    supabase
      .from("workouts")
      .select(
        "id, activity, sets, reps, load, distance, duration_minutes, intensity, performed_at, created_at, updated_at",
      )
      .gte("performed_at", startIso)
      .order("performed_at", { ascending: false }),
    supabase
      .from("meals")
      .select("id, description, calories, protein_g, carbs_g, fats_g, eaten_at, created_at, updated_at")
      .gte("eaten_at", startIso)
      .order("eaten_at", { ascending: false }),
    supabase
      .from("plans")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(5),
  ]);

  const initialData = {
    weights: (weightsRes.data ?? []) as WeightEntry[],
    bodyFat: (bodyFatRes.data ?? []) as BodyFatEntry[],
    workouts: (workoutsRes.data ?? []) as WorkoutEntry[],
    meals: (mealsRes.data ?? []) as MealEntry[],
    plans: (plansRes.data ?? []) as PlanEntry[],
  } satisfies {
    weights: WeightEntry[];
    bodyFat: BodyFatEntry[];
    workouts: WorkoutEntry[];
    meals: MealEntry[];
    plans: PlanEntry[];
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <DashboardClient initialData={initialData} defaultRangeDays={DEFAULT_RANGE_DAYS} />
    </section>
  );
}

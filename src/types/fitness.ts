export type WeightEntry = {
  id: string;
  user_id: string;
  weight: number;
  unit: 'lbs' | 'kg';
  recorded_at: string;
  created_at: string;
  updated_at: string;
};

export type BodyFatEntry = {
  id: string;
  user_id: string;
  percentage: number;
  recorded_at: string;
  created_at: string;
  updated_at: string;
};

export type WorkoutEntry = {
  id: string;
  user_id: string;
  activity: string;
  sets: number | null;
  reps: number | null;
  load: number | null;
  distance: number | null;
  duration_minutes: number | null;
  intensity: string | null;
  performed_at: string;
  created_at: string;
  updated_at: string;
};

export type MealEntry = {
  id: string;
  user_id: string;
  description: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fats_g: number | null;
  eaten_at: string;
  created_at: string;
  updated_at: string;
};

export type PlanEntry = {
  id: string;
  user_id: string;
  plan_type: 'workout' | 'diet';
  title: string;
  focus: string | null;
  summary: string | null;
  content: unknown;
  generated_at: string;
  created_at: string;
  updated_at: string;
};

export type ProfileSettings = {
  id: string;
  user_id: string;
  target_weight: number | null;
  weight_unit: 'lbs' | 'kg';
  dietary_preference: string | null;
  theme_preference: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
};

export type DateRange = {
  start?: string;
  end?: string;
};

export type StructuredChatPayload = {
  entries: Array<
    | {
        type: 'weight';
        recorded_at: string;
        weight: number;
        unit: 'lbs' | 'kg';
      }
    | {
        type: 'body_fat';
        recorded_at: string;
        percentage: number;
      }
    | {
        type: 'workout';
        performed_at: string;
        activity: string;
        sets?: number;
        reps?: number;
        load?: number;
        distance?: number;
        duration_minutes?: number;
        intensity?: string;
      }
    | {
        type: 'meal';
        eaten_at: string;
        description: string;
        calories?: number;
        protein_g?: number;
        carbs_g?: number;
        fats_g?: number;
      }
  >;
  plan_request?: {
    plan_type: 'workout' | 'diet';
    focus?: string;
    duration_weeks?: number;
  };
  clarification_needed?: boolean;
  clarification_message?: string;
  acknowledgements: string[];
};

export type GeneratedPlan = {
  plan_type: 'workout' | 'diet';
  title: string;
  focus: string;
  summary: string;
  schedule: Array<{
    day: string;
    headline: string;
    details: string;
  }>;
  key_points: string[];
  tips: string[];
};

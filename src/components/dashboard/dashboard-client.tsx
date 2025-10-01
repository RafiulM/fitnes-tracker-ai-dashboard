"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { subDays, format } from "date-fns";
import { z } from "zod";
import {
  Activity,
  CalendarRange,
  ChartLine,
  Flame,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  BodyFatEntry,
  MealEntry,
  PlanEntry,
  WeightEntry,
  WorkoutEntry,
} from "@/types/fitness";

const rangeOptions = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "1 year", value: 365 },
];

const apiResponseSchema = z.object({ data: z.array(z.any()) });

type DashboardData = {
  weights: WeightEntry[];
  bodyFat: BodyFatEntry[];
  workouts: WorkoutEntry[];
  meals: MealEntry[];
  plans: PlanEntry[];
};

type Props = {
  initialData: DashboardData;
  defaultRangeDays: number;
};

function formatDateLabel(dateIso: string) {
  return format(new Date(dateIso), "MMM d");
}

function downsample<T>(entries: T[], maxPoints = 80) {
  if (entries.length <= maxPoints) return entries;
  const stride = Math.ceil(entries.length / maxPoints);
  return entries.filter((_, index) => index % stride === 0);
}

function calculateWeightChange(weights: WeightEntry[]) {
  if (weights.length < 2) return null;
  const sorted = [...weights].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const delta = last.weight - first.weight;
  const percent = (delta / first.weight) * 100;
  return {
    delta,
    percent,
    unit: last.unit,
  };
}

function calculateCaloriesPerDay(meals: MealEntry[]) {
  if (!meals.length) return null;
  const totals = new Map<string, number>();
  meals.forEach((meal) => {
    const dateKey = new Date(meal.eaten_at).toISOString().slice(0, 10);
    totals.set(dateKey, (totals.get(dateKey) ?? 0) + (meal.calories ?? 0));
  });
  const days = totals.size || 1;
  const totalCals = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);
  return totalCals / days;
}

function aggregateWorkoutVolume(workouts: WorkoutEntry[]) {
  const byDate = new Map<string, number>();
  workouts.forEach((workout) => {
    const dateKey = new Date(workout.performed_at).toISOString().slice(0, 10);
    let volume = 0;
    if (workout.sets && workout.reps && workout.load) {
      volume = workout.sets * workout.reps * workout.load;
    } else if (workout.duration_minutes) {
      volume = workout.duration_minutes * 10;
    } else if (workout.distance) {
      volume = workout.distance * 100;
    } else {
      volume = 100;
    }
    byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + volume);
  });

  return Array.from(byDate.entries())
    .map(([date, volume]) => ({
      date,
      volume,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export default function DashboardClient({ initialData, defaultRangeDays }: Props) {
  const [selectedRange, setSelectedRange] = useState(defaultRangeDays);
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedRange === defaultRangeDays) return;

    const fetchRangeData = async () => {
      try {
        setIsLoading(true);
        const end = new Date();
        const start = subDays(end, selectedRange).toISOString();
        const endIso = end.toISOString();

        const [weightsRes, bodyFatRes, workoutsRes, mealsRes, plansRes] = await Promise.all([
          fetch(`/api/weights?start=${encodeURIComponent(start)}&end=${encodeURIComponent(endIso)}`),
          fetch(`/api/body-fat?start=${encodeURIComponent(start)}&end=${encodeURIComponent(endIso)}`),
          fetch(`/api/workouts?start=${encodeURIComponent(start)}&end=${encodeURIComponent(endIso)}`),
          fetch(`/api/meals?start=${encodeURIComponent(start)}&end=${encodeURIComponent(endIso)}`),
          fetch(`/api/plans?limit=5`),
        ]);

        if (!weightsRes.ok || !bodyFatRes.ok || !workoutsRes.ok || !mealsRes.ok || !plansRes.ok) {
          throw new Error("Unable to fetch dashboard data.");
        }

        const parsedWeights = apiResponseSchema.parse(await weightsRes.json());
        const parsedBodyFat = apiResponseSchema.parse(await bodyFatRes.json());
        const parsedWorkouts = apiResponseSchema.parse(await workoutsRes.json());
        const parsedMeals = apiResponseSchema.parse(await mealsRes.json());
        const parsedPlans = apiResponseSchema.parse(await plansRes.json());

        setData({
          weights: parsedWeights.data as WeightEntry[],
          bodyFat: parsedBodyFat.data as BodyFatEntry[],
          workouts: parsedWorkouts.data as WorkoutEntry[],
          meals: parsedMeals.data as MealEntry[],
          plans: parsedPlans.data as PlanEntry[],
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRangeData();
  }, [selectedRange, defaultRangeDays]);

  const latestWeight = data.weights[0];
  const weightChange = useMemo(() => calculateWeightChange(data.weights), [data.weights]);
  const workoutsPerWeek = useMemo(() => {
    if (!data.workouts.length) return null;
    const days = selectedRange;
    const weeks = days / 7;
    return data.workouts.length / weeks;
  }, [data.workouts.length, selectedRange]);
  const avgCalories = useMemo(() => calculateCaloriesPerDay(data.meals), [data.meals]);

  const weightData = useMemo(() => {
    const ascending = [...data.weights].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    );
    return downsample(
      ascending.map((entry) => ({
        date: entry.recorded_at,
        weight: entry.weight,
        unit: entry.unit,
      })),
    );
  }, [data.weights]);

  const bodyFatSeries = useMemo(() => {
    const ascending = [...data.bodyFat].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
    );
    return downsample(
      ascending.map((entry) => ({
        date: entry.recorded_at,
        percentage: entry.percentage,
      })),
    );
  }, [data.bodyFat]);

  const workoutVolumeSeries = useMemo(
    () => downsample(aggregateWorkoutVolume(data.workouts)),
    [data.workouts],
  );

  const latestPlan = data.plans[0];

  return (
    <div className="relative space-y-8">
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-end bg-background/60 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Refreshing data…
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Insight Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Explore how your metrics evolve and where to focus next. Filter by timeframe to zoom in on short-term or
            long-term progress.
          </p>
        </div>
        <Select value={String(selectedRange)} onValueChange={(value) => setSelectedRange(Number(value))}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {rangeOptions.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current weight</CardTitle>
            <ChartLine className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {latestWeight ? (
              <div className="text-2xl font-semibold">
                {latestWeight.weight.toFixed(1)} {latestWeight.unit}
              </div>
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
            <p className="text-xs text-muted-foreground">
              Updated {latestWeight ? format(new Date(latestWeight.recorded_at), "MMM d, yyyy") : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weight change</CardTitle>
            <RefreshCcw className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {weightChange ? (
              <div className="text-2xl font-semibold">
                {weightChange.delta > 0 ? "+" : ""}
                {weightChange.delta.toFixed(1)} {weightChange.unit}
              </div>
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
            <p className="text-xs text-muted-foreground">
              {weightChange
                ? `${weightChange.percent > 0 ? "+" : ""}${weightChange.percent.toFixed(1)}% over selected range`
                : "Add at least two weigh-ins"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workouts per week</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {workoutsPerWeek ? (
              <div className="text-2xl font-semibold">{workoutsPerWeek.toFixed(1)}</div>
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
            <p className="text-xs text-muted-foreground">
              {data.workouts.length ? `${data.workouts.length} sessions logged` : "Log workouts via chat"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg daily calories</CardTitle>
            <Flame className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {avgCalories ? (
              <div className="text-2xl font-semibold">{Math.round(avgCalories).toLocaleString()} kcal</div>
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
            <p className="text-xs text-muted-foreground">
              {data.meals.length ? `${data.meals.length} meals logged in range` : "Add meals to unlock trends"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/80 bg-card/90">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Weight trend</CardTitle>
            <Badge variant="secondary" className="flex items-center gap-1 text-[11px]">
              <ChartLine className="h-3 w-3" />
              {weightData.length} pts
            </Badge>
          </CardHeader>
          <CardContent className="pt-2">
            {weightData.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      dataKey="weight"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      width={48}
                    />
                    <Tooltip
                      labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                      formatter={(value: number) => [`${value.toFixed(1)} ${weightData[0]?.unit ?? "lbs"}`, "Weight"]}
                    />
                    <Line type="monotone" dataKey="weight" stroke="#dc2626" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Skeleton className="h-64 w-full" />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/90">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Body fat progress</CardTitle>
            <Badge variant="secondary" className="text-[11px]">
              {bodyFatSeries.length} measurements
            </Badge>
          </CardHeader>
          <CardContent className="pt-2">
            {bodyFatSeries.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bodyFatSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} width={48} />
                    <Tooltip
                      labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, "Body fat"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="percentage"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Skeleton className="h-64 w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="border-border/80 bg-card/90">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Workout volume</CardTitle>
            <Badge variant="secondary" className="text-[11px]">
              Total {data.workouts.length} sessions
            </Badge>
          </CardHeader>
          <CardContent className="pt-2">
            {workoutVolumeSeries.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workoutVolumeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDateLabel}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} width={48} />
                    <Tooltip
                      labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
                      formatter={(value: number) => [Math.round(value).toLocaleString(), "Training volume"]}
                    />
                    <Bar dataKey="volume" fill="#bb2525" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Skeleton className="h-64 w-full" />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/90">
          <CardHeader>
            <CardTitle className="text-base">Latest plan</CardTitle>
            <p className="text-xs text-muted-foreground">
              Regenerate plans from chat whenever you need a reset.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestPlan ? (
              <>
                <Badge variant="outline" className="capitalize">
                  {latestPlan.plan_type}
                </Badge>
                <p className="text-sm font-semibold text-foreground">{latestPlan.title}</p>
                <p className="text-sm text-muted-foreground">
                  {latestPlan.summary ?? "Personalized guidance saved from chat."}
                </p>
                <p className="text-xs text-muted-foreground">
                  Generated {format(new Date(latestPlan.generated_at ?? latestPlan.created_at), "PPP")}
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-52" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 bg-card/90">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Meal log</CardTitle>
            <p className="text-sm text-muted-foreground">Track calories and macros over the selected period.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarRange className="h-4 w-4" />
            {rangeOptions.find((option) => option.value === selectedRange)?.label}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Meal</TableHead>
                  <TableHead className="text-right">Calories</TableHead>
                  <TableHead className="text-right">Protein</TableHead>
                  <TableHead className="text-right">Carbs</TableHead>
                  <TableHead className="text-right">Fat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.meals.length ? (
                  data.meals.slice(0, 12).map((meal) => (
                    <TableRow key={meal.id}>
                      <TableCell>{format(new Date(meal.eaten_at), "MMM d")}</TableCell>
                      <TableCell className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                        {meal.description}
                      </TableCell>
                      <TableCell className="text-right">
                        {meal.calories ? meal.calories.toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {meal.protein_g ? `${meal.protein_g} g` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {meal.carbs_g ? `${meal.carbs_g} g` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {meal.fats_g ? `${meal.fats_g} g` : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No meals recorded yet. Log meals in chat to see trends here.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

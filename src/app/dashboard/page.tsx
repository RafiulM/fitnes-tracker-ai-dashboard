"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell, TrendingDown, TrendingUp, Activity, Plus, Download } from "lucide-react";
import Link from "next/link";

// Types for dashboard data
interface WeightEntry {
  id: number;
  weight: number;
  unit: string;
  recorded_at: string;
}

interface WorkoutEntry {
  id: number;
  type: string;
  sets?: number;
  reps?: number;
  load?: number;
  performed_at: string;
}

interface MealEntry {
  id: number;
  description: string;
  calories?: number;
  eaten_at: string;
}

interface BodyFatEntry {
  id: number;
  percentage: number;
  recorded_at: string;
}

export default function Dashboard() {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [bodyFat, setBodyFat] = useState<BodyFatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      const startDateStr = startDate.toISOString();

      const endDate = new Date().toISOString();
      const [weightsRes, workoutsRes, mealsRes, bodyFatRes] = await Promise.all([
        fetch(`/api/weights?startDate=${startDateStr}&endDate=${endDate}`),
        fetch(`/api/workouts?startDate=${startDateStr}&endDate=${endDate}`),
        fetch(`/api/meals?startDate=${startDateStr}&endDate=${endDate}`),
        fetch(`/api/body-fat?startDate=${startDateStr}&endDate=${endDate}`)
      ]);

      const weightsData = weightsRes.ok ? await weightsRes.json() : [];
      const workoutsData = workoutsRes.ok ? await workoutsRes.json() : [];
      const mealsData = mealsRes.ok ? await mealsRes.json() : [];
      const bodyFatData = bodyFatRes.ok ? await bodyFatRes.json() : [];

      setWeights(weightsData);
      setWorkouts(workoutsData);
      setMeals(mealsData);
      setBodyFat(bodyFatData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const currentWeight = weights[0]?.weight || 0;
  const previousWeight = weights[1]?.weight || currentWeight;
  const weightChange = currentWeight - previousWeight;
  const currentBodyFat = bodyFat[0]?.percentage || 0;
  const previousBodyFat = bodyFat[1]?.percentage || currentBodyFat;
  const bodyFatChange = currentBodyFat - previousBodyFat;

  // Calculate workout volume
  const workoutVolume = workouts.reduce((total, workout) => {
    if (workout.sets && workout.reps && workout.load) {
      return total + (workout.sets * workout.reps * workout.load);
    }
    return total;
  }, 0);

  // Calculate total calories
  const totalCalories = meals.reduce((total, meal) => total + (meal.calories || 0), 0);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <Dumbbell className="h-6 w-6 text-red-600" />
                <h1 className="text-xl font-bold">FitTrack AI</h1>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium hover:text-red-700"
              >
                Chat
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Dashboard
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Button className="bg-red-600 hover:bg-red-700" asChild>
                <Link href="/?tab=chat">
                  <Plus className="w-4 h-4 mr-1" />
                  Log Data
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Fitness Dashboard</h2>
          <p className="text-muted-foreground">
            Track your progress and visualize your fitness journey
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-4 mb-6">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Current Weight</span>
              <TrendingDown className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {currentWeight} {weights[0]?.unit || 'lbs'}
            </div>
            {weightChange !== 0 && (
              <Badge variant={weightChange > 0 ? "destructive" : "default"} className="text-xs">
                {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)} {weights[0]?.unit || 'lbs'}
              </Badge>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Body Fat</span>
              <Activity className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {currentBodyFat.toFixed(1)}%
            </div>
            {bodyFatChange !== 0 && (
              <Badge variant={bodyFatChange > 0 ? "destructive" : "default"} className="text-xs">
                {bodyFatChange > 0 ? "+" : ""}{bodyFatChange.toFixed(1)}%
              </Badge>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Workout Volume</span>
              <Dumbbell className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {workoutVolume.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {workouts.length} workouts
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Total Calories</span>
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {totalCalories.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {meals.length} meals logged
            </p>
          </Card>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weight Trend Chart */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-lg font-semibold mb-4">Weight Trend</h3>
            {weights.length > 0 ? (
              <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">Chart visualization will be implemented here</p>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/20">
                <div className="text-center">
                  <TrendingDown className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No weight data yet</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href="/?tab=chat">Log Weight</Link>
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Calendar */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Activity Calendar</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </Card>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Recent Workouts */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Workouts</h3>
            {workouts.length > 0 ? (
              <div className="space-y-3">
                {workouts.slice(0, 5).map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div>
                      <p className="font-medium">{workout.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {workout.sets && workout.reps && `${workout.sets}×${workout.reps}`}
                        {workout.load && ` @ ${workout.load} lbs`}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(workout.performed_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="w-8 h-8 mx-auto mb-2" />
                <p>No workouts logged yet</p>
              </div>
            )}
          </Card>

          {/* Recent Meals */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Meals</h3>
            {meals.length > 0 ? (
              <div className="space-y-3">
                {meals.slice(0, 5).map((meal) => (
                  <div key={meal.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div>
                      <p className="font-medium">{meal.description}</p>
                      {meal.calories && (
                        <p className="text-sm text-muted-foreground">{meal.calories} calories</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(meal.eaten_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2" />
                <p>No meals logged yet</p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
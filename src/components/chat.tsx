"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Send, Sparkles, Timer, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { PlanEntry } from "@/types/fitness";

const chatResponseSchema = z.object({
  message: z.string(),
  stored: z.object({
    weights: z.number().int().nonnegative(),
    bodyFat: z.number().int().nonnegative(),
    workouts: z.number().int().nonnegative(),
    meals: z.number().int().nonnegative(),
  }),
  clarification: z.boolean(),
  plan: z
    .object({
      id: z.string().optional(),
      plan_type: z.enum(["workout", "diet"]),
      title: z.string(),
      focus: z.string().nullable(),
      summary: z.string().nullable(),
      content: z.unknown(),
      generated_at: z.string().optional(),
    })
    .nullable(),
});

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

type QuickPrompt = {
  label: string;
  prompt: string;
  icon?: React.ReactNode;
};

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    label: "Log Weight",
    prompt: "I weighed 182.4 lbs this morning at 7am.",
  },
  {
    label: "Track Workout",
    prompt: "Logged a push day: 4x10 bench press at 155 lbs, 3x12 incline dumbbell press at 45 lbs.",
  },
  {
    label: "Meal Entry",
    prompt: "Lunch was grilled chicken with quinoa and veggies, around 620 calories.",
  },
];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      aria-live="polite"
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-border text-foreground"
        }`}
      >
        {message.content.split("\n").map((line) => (
          <p key={line} className="whitespace-pre-wrap leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function LatestPlanCard({ plan }: { plan: PlanEntry }) {
  const content = plan.content as {
    schedule?: Array<{ day: string; headline: string; details: string }>;
    key_points?: string[];
    tips?: string[];
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {plan.plan_type === "workout" ? "Workout Plan" : "Nutrition Plan"}
          </CardTitle>
          <Badge variant="secondary" className="uppercase tracking-wide">
            {plan.plan_type}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {plan.summary || "Tailored guidance based on your latest stats."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {content.schedule && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              Schedule Highlights
            </h3>
            <div className="space-y-3">
              {content.schedule.slice(0, 4).map((item) => (
                <div key={`${item.day}-${item.headline}`} className="rounded-md bg-white/40 p-3 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    {item.day}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{item.headline}</p>
                  <p className="text-xs text-muted-foreground">{item.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {content.key_points && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              Key Points
            </h3>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {content.key_points.slice(0, 4).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Chat() {
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Hi! I’m your FitPulse coach. Share today’s weight, workout, meals, or ask for a new plan and I’ll handle the logging.",
      createdAt: Date.now(),
    },
  ]);
  const [latestPlan, setLatestPlan] = useState<PlanEntry | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLatestPlan = async () => {
      try {
        const res = await fetch("/api/plans?limit=1", {
          method: "GET",
        });
        if (!res.ok) return;
        const payload = await res.json();
        if (payload.data && payload.data.length > 0) {
          setLatestPlan(payload.data[0] as PlanEntry);
        }
      } catch (error) {
        console.error("Failed to fetch plans", error);
      }
    };

    fetchLatestPlan();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const chatHistory = useMemo(
    () =>
      messages.map(({ role, content }) => ({
        role,
        content,
      })),
    [messages],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isSubmitting) return;
    await submitMessage(input.trim());
  };

  const submitMessage = async (content: string) => {
    setIsSubmitting(true);
    setInput("");
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history: chatHistory.slice(-10),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to reach the coach. Please try again.");
      }

      const payload = chatResponseSchema.parse(await res.json());

      if (payload.plan) {
        setLatestPlan(payload.plan as PlanEntry);
      }

      if (!payload.clarification) {
        const savedCount = [
          payload.stored.weights,
          payload.stored.bodyFat,
          payload.stored.workouts,
          payload.stored.meals,
        ].reduce((sum, value) => sum + value, 0);
        if (savedCount > 0) {
          toast.success(`Logged ${savedCount} new entr${savedCount === 1 ? "y" : "ies"}.`);
        }
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: payload.message,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          error instanceof Error
            ? `${error.message} If the issue persists, verify your API keys and Supabase connection.`
            : "Something went wrong. Please try again in a moment.",
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const handleGeneratePlan = async (planType: "workout" | "diet") => {
    if (isSubmitting) return;
    await submitMessage(
      `I need a fresh ${planType} plan tailored to my recent stats. Focus on ${
        planType === "workout" ? "balanced strength and conditioning" : "high-protein meals around 2,100 calories"
      }.`,
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="flex flex-col border-border/80 bg-card/90">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-4 w-4 text-primary" />
            Conversation
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Log stats or request coaching insight in natural language. Responses land in under two seconds when
            keys are configured.
          </p>
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-1 flex-col gap-4">
          <ScrollArea ref={scrollRef} className="h-[420px]">
            <div className="space-y-4 pr-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          </ScrollArea>

          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <Button
                key={prompt.label}
                type="button"
                variant="secondary"
                className="border-primary/30 bg-primary/5 text-xs text-primary hover:bg-primary/10"
                onClick={() => handleQuickPrompt(prompt.prompt)}
              >
                {prompt.icon}
                {prompt.label}
              </Button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Tell me what you accomplished or what you need."
              className="flex-1"
              disabled={isSubmitting}
              aria-label="Chat message"
            />
            <Button type="submit" disabled={isSubmitting || input.trim().length === 0}>
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-border/80 bg-card/90">
          <CardHeader>
            <CardTitle className="text-base">Generate a plan</CardTitle>
            <p className="text-sm text-muted-foreground">
              Use recent stats to spin up a structured routine or meal strategy instantly.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              variant="outline"
              className="justify-between border-primary/40"
              disabled={isSubmitting}
              onClick={() => handleGeneratePlan("workout")}
            >
              <span className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary" />
                Workout plan
              </span>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              className="justify-between border-primary/40"
              disabled={isSubmitting}
              onClick={() => handleGeneratePlan("diet")}
            >
              <span className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-primary" />
                Nutrition plan
              </span>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CardContent>
        </Card>

        {latestPlan && <LatestPlanCard plan={latestPlan} />}
      </div>
    </div>
  );
}

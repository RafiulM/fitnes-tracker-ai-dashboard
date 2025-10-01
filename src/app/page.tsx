import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, LineChart, MessageCircle, UtensilsCrossed } from "lucide-react";

const featureHighlights = [
  {
    title: "Chat-First Logging",
    description:
      "Log weight, body fat, workouts, and meals simply by talking to your personal AI coach.",
    icon: MessageCircle,
  },
  {
    title: "Insightful Dashboard",
    description:
      "Track weight trends, body composition, training volume, and nutrition with interactive visuals.",
    icon: LineChart,
  },
  {
    title: "Personalized Plans",
    description:
      "Generate fresh workout or diet plans tailored to your latest stats whenever you need inspiration.",
    icon: UtensilsCrossed,
  },
];

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/chat");
  }

  return (
    <main className="relative min-h-[100vh] overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(220,38,38,0.15),_transparent_55%)]" />

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-20 sm:px-6 lg:px-8">
        <header className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            Fitness Tracking Reimagined
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Chat with your coach. See your progress. Stay accountable.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            FitPulse AI combines a conversational fitness tracker with a data-rich dashboard so you can log stats effortlessly and make smarter decisions fast.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/sign-up">
                Create your account
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/sign-in">Log in</Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {featureHighlights.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="border-primary/10 bg-card/90 shadow-sm shadow-primary/5">
              <CardContent className="space-y-4 p-6">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="grid gap-8 rounded-3xl border border-primary/15 bg-card/80 p-8 shadow-lg shadow-primary/10 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">
              Built for consistency, guided by intelligence
            </h2>
            <p className="text-muted-foreground">
              Every conversation enriches your personal dataset. Supabase keeps it secure, the dashboard turns it into insight, and our AI coach keeps you moving toward your goals with actionable nudges.
            </p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Activity className="h-5 w-5 text-primary" />
              <span>Encrypted storage, row-level privacy, and fast feedback.</span>
            </div>
          </div>
          <div className="space-y-3 rounded-2xl bg-secondary/60 p-6 text-sm text-secondary-foreground">
            <h3 className="text-lg font-medium text-foreground">What to expect</h3>
            <ul className="space-y-3">
              <li>
                <span className="font-semibold text-foreground">1. </span>
                Chat naturally about today&apos;s workout, meals, or body metrics—no forms necessary.
              </li>
              <li>
                <span className="font-semibold text-foreground">2. </span>
                Our AI parses every detail and stores it securely in Supabase with instant confirmation.
              </li>
              <li>
                <span className="font-semibold text-foreground">3. </span>
                Visit the dashboard for trends, or ask for a fresh plan tailored to your latest stats.
              </li>
            </ul>
          </div>
        </section>
      </section>
    </main>
  );
}

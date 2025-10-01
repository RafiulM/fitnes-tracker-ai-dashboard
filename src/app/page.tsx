"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Chat from "@/components/chat";
import { Button } from "@/components/ui/button";
import {
  Dumbbell,
  TrendingUp,
  Activity,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export default function Home() {

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-red-600" />
              <h1 className="text-xl font-bold">FitTrack AI</h1>
            </div>

            <div className="flex items-center gap-4">
              <SignedIn>
                <nav className="hidden md:flex items-center gap-6">
                  <Link
                    href="/"
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Chat
                  </Link>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium hover:text-red-700"
                  >
                    Dashboard
                  </Link>
                </nav>
              </SignedIn>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <SignedOut>
                  <SignInButton>
                    <Button className="bg-red-600 hover:bg-red-700">
                      Sign In
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <SignedOut>
          {/* Landing Page */}
          <div className="text-center py-16">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-100 rounded-full dark:bg-red-900/20">
                <Dumbbell className="h-12 w-12 text-red-600" />
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4">
              Your AI Fitness Companion
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Track your fitness journey with natural language. Simply chat about your workouts, meals, and measurements.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-4 dark:bg-blue-900/20">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Chat-Based Logging</h3>
                <p className="text-sm text-muted-foreground">
                  &quot;I did 4x10 squats at 135 lbs&quot; - it&apos;s that simple
                </p>
              </div>

              <div className="text-center">
                <div className="p-3 bg-green-100 rounded-full w-12 h-12 mx-auto mb-4 dark:bg-green-900/20">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Visual Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Charts and insights about your fitness journey
                </p>
              </div>

              <div className="text-center">
                <div className="p-3 bg-purple-100 rounded-full w-12 h-12 mx-auto mb-4 dark:bg-purple-900/20">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">AI-Generated Plans</h3>
                <p className="text-sm text-muted-foreground">
                  Personalized workout and diet plans on demand
                </p>
              </div>
            </div>

  
            <SignInButton>
              <Button size="lg" className="bg-red-600 hover:bg-red-700">
                Get Started
              </Button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {/* Chat Interface */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
              <p className="text-muted-foreground">
                Tell me about your workout, meal, or measurements in natural language.
              </p>
            </div>
            <Chat />
          </div>
        </SignedIn>
      </main>
    </div>
  );
}

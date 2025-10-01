"use client";

import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Bot, User, Dumbbell, TrendingUp, Apple } from "lucide-react";

const QUICK_PROMPTS = [
  "I weighed 180 lbs this morning",
  "Did 4x10 squats at 135 lbs",
  "Had grilled chicken salad for lunch (350 calories)",
  "I'm 28% body fat",
  "Create a workout plan for me",
  "Generate a diet plan",
];

export default function Chat() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    error,
    isLoading: chatLoading,
  } = useChat({
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });


  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Fitness Tracker Chat</h2>
        <p className="text-muted-foreground text-sm">
          Log workouts, meals, and measurements in natural language
        </p>
      </div>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-red-700 dark:text-red-300 text-sm">
              {error.message ||
                "An error occurred while processing your request."}
            </span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Messages */}
        <div className="lg:col-span-3">
          <div className="space-y-4 mb-4 min-h-[400px] max-h-[600px] overflow-y-auto bg-card rounded-lg border p-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">
                  Start tracking your fitness journey
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Tell me about your workouts, meals, or measurements. I&apos;ll automatically log them for you!
                </p>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Try these examples:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {QUICK_PROMPTS.slice(0, 3).map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                          if (input) {
                            input.value = prompt;
                            input.focus();
                          }
                        }}
                        className="text-xs bg-secondary hover:bg-secondary/80 px-3 py-1 rounded-full"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] ${m.role === "user" ? "order-2" : "order-1"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {m.role === "user" ? (
                        <User className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Bot className="w-4 h-4 text-green-600" />
                      )}
                      <span className="font-semibold text-sm">
                        {m.role === "user" ? "You" : "FitTrack AI"}
                      </span>
                    </div>
                    <div className={`rounded-lg p-3 ${
                      m.role === "user"
                        ? "bg-blue-600 text-white ml-6"
                        : "bg-muted text-foreground"
                    }`}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {m.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%]">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-sm">FitTrack AI</span>
                  </div>
                  <div className="bg-muted rounded-lg p-3 ml-6">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={input}
              placeholder="Tell me about your workout, meal, or measurements..."
              onChange={handleInputChange}
              className="flex-1"
              disabled={chatLoading}
            />
            <Button
              type="submit"
              disabled={chatLoading || !input.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {chatLoading ? "Sending..." : "Send"}
            </Button>
          </form>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="font-semibold mb-3 text-sm">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs h-8"
                onClick={() => {
                  const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (input) {
                    input.value = "Create a personalized workout plan for me";
                    input.focus();
                  }
                }}
              >
                <Dumbbell className="w-3 h-3 mr-2" />
                Generate Workout Plan
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs h-8"
                onClick={() => {
                  const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (input) {
                    input.value = "Create a personalized diet plan for me";
                    input.focus();
                  }
                }}
              >
                <Apple className="w-3 h-3 mr-2" />
                Generate Diet Plan
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs h-8"
                onClick={() => {
                  const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (input) {
                    input.value = "Show me my progress summary";
                    input.focus();
                  }
                }}
              >
                <TrendingUp className="w-3 h-3 mr-2" />
                View Progress
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold mb-2 text-xs">What you can log:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Weight & body fat</li>
                <li>• Workouts (sets, reps, weight)</li>
                <li>• Meals & calories</li>
                <li>• Cardio activities</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

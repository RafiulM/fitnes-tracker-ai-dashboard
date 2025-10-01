import Chat from "@/components/chat";

export default function ChatPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">
          Conversational Logging
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Fitness Assistant Chat</h1>
        <p className="max-w-3xl text-muted-foreground">
          Capture body stats, workouts, and meals in natural language. The AI coach parses details, saves them
          to Supabase, and keeps everything aligned with your dashboard insights.
        </p>
      </header>
      <Chat />
    </section>
  );
}

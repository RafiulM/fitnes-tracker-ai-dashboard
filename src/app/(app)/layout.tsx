import type { ReactNode } from "react";
import AppHeader from "@/components/navigation/app-header";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="container mx-auto px-4 pb-12 pt-6 md:pt-8">
        {children}
      </main>
    </div>
  );
}

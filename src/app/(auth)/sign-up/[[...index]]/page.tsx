"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background px-4 py-12">
      <SignUp
        appearance={{
          elements: {
            card: "shadow-xl border border-primary/10",
            headerTitle: "text-2xl font-semibold text-foreground",
            headerSubtitle: "text-sm text-muted-foreground",
            formFieldLabel: "text-sm font-medium text-foreground",
            footer: "hidden",
          },
        }}
        afterSignInUrl="/chat"
        afterSignUpUrl="/chat"
      />
    </div>
  );
}

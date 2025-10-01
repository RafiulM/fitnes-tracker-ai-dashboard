"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/chat", label: "Chat" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
      {navLinks.map(({ href, label }) => {
        const isActive =
          pathname === href ||
          (pathname?.startsWith(href) && href !== "/");

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "text-sm font-medium transition-colors", 
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle className="text-lg font-semibold text-foreground">
                  FitPulse AI
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <NavLinks onNavigate={() => setIsOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/chat" className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-foreground">
              FitPulse
            </span>
            <span className="rounded-full bg-primary/10 px-2 text-xs font-medium text-primary">
              AI Coach
            </span>
          </Link>

          <div className="hidden md:block">
            <NavLinks />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle />
          <SignedIn>
            <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}

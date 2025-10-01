"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useTheme } from "next-themes";
import { Loader2, Moon, RefreshCcw, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { ProfileSettings } from "@/types/fitness";

const profileSchema = z.object({
  target_weight: z.number().positive().max(1000).nullable(),
  weight_unit: z.enum(["lbs", "kg"]),
  dietary_preference: z.string().max(120).nullable(),
  theme_preference: z.enum(["light", "dark", "system"]),
});

type FormState = ProfileSettings | null;

export default function ProfileSettingsForm() {
  const [profile, setProfile] = useState<FormState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Unable to load profile");
        const payload = await res.json();
        setProfile(payload.data as ProfileSettings);
        if (payload.data?.theme_preference) {
          setTheme(payload.data.theme_preference);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [setTheme]);

  const updateProfile = async (changes: Partial<ProfileSettings>) => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const payload = profileSchema.partial().parse({
        target_weight: changes.target_weight ?? profile.target_weight,
        weight_unit: changes.weight_unit ?? profile.weight_unit,
        dietary_preference:
          changes.dietary_preference === undefined ? profile.dietary_preference : changes.dietary_preference,
        theme_preference: changes.theme_preference ?? (profile.theme_preference as "light" | "dark" | "system"),
      });

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      const { data } = await res.json();
      setProfile(data as ProfileSettings);
      setLastSavedAt(new Date());
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const unit = profile?.weight_unit ?? "lbs";

  const targetWeightDisplay = useMemo(() => {
    if (!profile?.target_weight) return "";
    return profile.target_weight.toString();
  }, [profile?.target_weight]);

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="sr-only">Loading profile settings</span>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <Card className="border-border/80 bg-card/90">
        <CardHeader>
          <CardTitle className="text-base">Goals & Measurements</CardTitle>
          <CardDescription>
            Keep your targets up to date so the dashboard and plans stay aligned with what you are chasing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="target-weight">Target weight</Label>
            <div className="flex items-center gap-3">
              <Input
                id="target-weight"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="50"
                max="1000"
                className="max-w-[200px]"
                defaultValue={targetWeightDisplay}
                onBlur={(event) => {
              const value = event.target.value.trim();
              const parsed = value ? Number(value) : null;
              if (parsed === profile.target_weight) return;
              updateProfile({ target_weight: parsed });
              }}
            />
              <Badge variant="outline" className="uppercase">
                {unit}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              This helps highlight progress gaps in your analytics and plan recommendations.
            </p>
          </div>

          <div className="grid gap-3">
            <Label>Preferred unit</Label>
            <RadioGroup
              defaultValue={unit}
              onValueChange={(value) => {
                if (value === profile.weight_unit) return;
                updateProfile({ weight_unit: value as "lbs" | "kg" });
              }}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2">
                <RadioGroupItem value="lbs" id="unit-lbs" />
                <Label htmlFor="unit-lbs" className="cursor-pointer text-sm">
                  Pounds (lbs)
                </Label>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2">
                <RadioGroupItem value="kg" id="unit-kg" />
                <Label htmlFor="unit-kg" className="cursor-pointer text-sm">
                  Kilograms (kg)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dietary-preference">Dietary notes</Label>
            <Textarea
              id="dietary-preference"
              defaultValue={profile.dietary_preference ?? ""}
              placeholder="High protein, avoid shellfish, prefer Mediterranean flavors..."
              rows={4}
              onBlur={(event) => {
                const value = event.target.value.trim();
                if (value === (profile.dietary_preference ?? "")) return;
                updateProfile({ dietary_preference: value || null });
              }}
            />
            <p className="text-xs text-muted-foreground">
              We reference this when crafting meal plans or nutrition coaching.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/90">
        <CardHeader>
          <CardTitle className="text-base">Theme & Personalization</CardTitle>
          <CardDescription>
            Match the interface to your environment and save your preferred look across devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
            <div>
              <p className="font-medium">Dark mode</p>
              <p className="text-sm text-muted-foreground">
                Toggle between light and dark, or follow your system preference.
              </p>
            </div>
            <Switch
              checked={resolvedTheme === "dark"}
              onCheckedChange={(checked) => {
                const preference = checked ? "dark" : "light";
                setTheme(preference);
                updateProfile({ theme_preference: preference });
              }}
            />
          </div>

          <div className="rounded-lg border border-border/60 p-4">
            <p className="font-medium">Theme source</p>
            <p className="text-sm text-muted-foreground">
              Follow your OS automatically or lock the app to a specific appearance.
            </p>
            <div className="mt-4 grid gap-2">
              {["system", "light", "dark"].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={profile.theme_preference === value ? "default" : "outline"}
                  className="justify-between"
                  onClick={() => {
                    if (profile.theme_preference === value) return;
                    setTheme(value);
                    updateProfile({ theme_preference: value as "light" | "dark" | "system" });
                  }}
                >
                  <span className="capitalize">{value}</span>
                  {value === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : value === "light" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" />
                  )}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-border/60 p-4 text-xs text-muted-foreground">
            {isSaving ? "Saving changes..." : lastSavedAt ? `Last saved ${lastSavedAt.toLocaleTimeString()}` : "All changes auto-save."}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

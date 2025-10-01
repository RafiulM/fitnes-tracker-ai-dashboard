import ProfileSettingsForm from "@/components/profile/profile-settings-form";

export default function ProfilePage() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Personal Settings</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Profile & Goals</h1>
        <p className="max-w-2xl text-muted-foreground">
          Adjust your targets, measurement units, dietary preferences, and theme so every insight and recommendation
          stays personalized.
        </p>
      </header>
      <ProfileSettingsForm />
    </section>
  );
}

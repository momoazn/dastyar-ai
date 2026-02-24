import { createFileRoute } from "@tanstack/react-router";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { ProfileSection } from "@/components/settings/profile-section";
import { SecuritySection } from "@/components/settings/security-section";
import { SettingsHeader } from "@/components/settings/settings-header";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/texts";

export const Route = createFileRoute("/settings")({
  component: SettingsComponent,
});

function SettingsComponent() {
  return (
    <ProtectedLayout>
      <div
        className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-8 pt-2 md:px-6 lg:pt-4"
        dir="rtl"
      >
        <SettingsHeader
          description={fa.settings.profile.description}
          title={fa.settings.title}
        />

        <div className="space-y-5">
          <ProfileSection />
          <AppearanceSection />
          <SecuritySection />
        </div>
      </div>
    </ProtectedLayout>
  );
}

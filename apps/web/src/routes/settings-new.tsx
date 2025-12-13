import { createFileRoute } from "@tanstack/react-router";
import { ProfileSection } from "@/components/settings/profile-section";
import { QuickSettings } from "@/components/settings/quick-settings";
import { SecuritySection } from "@/components/settings/security-section";
import { SettingsHeader } from "@/components/settings/settings-header";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/persian-texts";

export const Route = createFileRoute("/settings-new")({
  component: NewSettingsComponent,
});

function NewSettingsComponent() {
  return (
    <ProtectedLayout>
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 md:px-6">
        <SettingsHeader
          description={fa.settings.profile.description}
          title={fa.settings.title}
        />

        <div className="space-y-4" dir="rtl">
          <ProfileSection />
          <SecuritySection />
          <QuickSettings />
        </div>
      </div>
    </ProtectedLayout>
  );
}

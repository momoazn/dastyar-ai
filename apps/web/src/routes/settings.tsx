import { createFileRoute } from "@tanstack/react-router";
import { ToolScaffold } from "@/components/scaffold/tool-scaffold";
import { AppInfoSection } from "@/components/settings/app-info-section";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { ProfileSection } from "@/components/settings/profile-section";
import { SecuritySection } from "@/components/settings/security-section";
import { ToolPageHeader } from "@/components/tool-page/tool-page";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/texts";

export const Route = createFileRoute("/settings")({
  component: SettingsComponent,
});

function SettingsComponent() {
  return (
    <ProtectedLayout>
      <ToolScaffold
        content={
          <div className="mx-auto w-full max-w-4xl space-y-5">
            <ToolPageHeader
              description={fa.settings.description}
              title={fa.settings.title}
            />
            <div className="space-y-4">
              <ProfileSection />
              <AppearanceSection />
              <AppInfoSection />
              <SecuritySection />
            </div>
          </div>
        }
      />
    </ProtectedLayout>
  );
}

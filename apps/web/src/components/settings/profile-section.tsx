import { User } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { fa } from "@/lib/texts";
import { SettingsItem } from "./settings-item";
import { SettingsSection } from "./settings-section";

export function ProfileSection() {
  const { data: user } = useUser();

  return (
    <SettingsSection
      description={fa.settings.profile.description}
      icon={<User className="h-4 w-4" />}
      title={fa.settings.profile.title}
    >
      <div className="space-y-3">
        <SettingsItem
          description={fa.settings.account.currentUsername}
          label={fa.settings.account.username}
        >
          <span className="rounded-md bg-muted px-2.5 py-1 text-sm">
            {user?.username}
          </span>
        </SettingsItem>
      </div>
    </SettingsSection>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fa } from "@/lib/texts";
import { orpc } from "@/utils/orpc";
import { SettingsItem } from "./settings-item";
import { SettingsSection } from "./settings-section";

export function AppInfoSection() {
  const { data: buildInfo } = useQuery(
    orpc.appConfig.getBuildInfo.queryOptions()
  );

  const version = buildInfo?.version ?? fa.settings.appInfo.unknown;
  const releaseLabel =
    buildInfo?.release || import.meta.env.PROD
      ? fa.settings.appInfo.release
      : fa.settings.appInfo.development;

  return (
    <SettingsSection
      description={fa.settings.appInfo.description}
      icon={<Info className="h-4 w-4" />}
      title={fa.settings.appInfo.title}
    >
      <div className="space-y-4">
        <SettingsItem label={fa.settings.appInfo.versionLabel}>
          <Badge dir="ltr" variant="secondary">
            v{version}
          </Badge>
        </SettingsItem>

        <SettingsItem label={fa.settings.appInfo.releaseLabel}>
          <Badge variant="outline">{releaseLabel}</Badge>
        </SettingsItem>
      </div>
    </SettingsSection>
  );
}

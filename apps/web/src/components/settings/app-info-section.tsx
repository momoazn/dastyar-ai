import { useQuery } from "@tanstack/react-query";
import { Info, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fa } from "@/lib/texts";
import { orpc } from "@/utils/orpc";
import { SettingsItem } from "./settings-item";
import { SettingsSection } from "./settings-section";

type RuntimeHealth = {
  status: string;
  whisper: {
    available: boolean;
    status: number;
  };
};

const fetchRuntimeHealth = async (): Promise<RuntimeHealth> => {
  const response = await fetch("/health", {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }

  return (await response.json()) as RuntimeHealth;
};

const getAvailabilityLabel = (
  isAvailable: boolean | undefined,
  isLoading: boolean
): string => {
  if (isLoading) {
    return fa.settings.appInfo.checking;
  }
  return isAvailable
    ? fa.settings.appInfo.available
    : fa.settings.appInfo.unavailable;
};

export function AppInfoSection() {
  const { data: buildInfo } = useQuery(
    orpc.appConfig.getBuildInfo.queryOptions()
  );
  const {
    data: runtimeHealth,
    isLoading: isRuntimeHealthLoading,
    isFetching: isRuntimeHealthFetching,
    refetch: refetchRuntimeHealth,
  } = useQuery({
    queryKey: ["runtime-health"],
    queryFn: fetchRuntimeHealth,
    refetchInterval: 30_000,
    meta: { suppressErrorToast: true },
  });

  const version = buildInfo?.version ?? fa.settings.appInfo.unknown;
  const releaseLabel =
    buildInfo?.release || import.meta.env.PROD
      ? fa.settings.appInfo.release
      : fa.settings.appInfo.development;
  const builtAt = buildInfo?.builtAt
    ? new Date(buildInfo.builtAt).toLocaleString("fa-IR")
    : fa.settings.appInfo.unknown;
  const isServerAvailable = runtimeHealth?.status === "ok";
  const isWhisperAvailable = runtimeHealth?.whisper.available;

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

        <SettingsItem label={fa.settings.appInfo.builtAtLabel}>
          <Badge variant="outline">{builtAt}</Badge>
        </SettingsItem>

        <SettingsItem label={fa.settings.appInfo.serverStatusLabel}>
          <Badge variant={isServerAvailable ? "default" : "secondary"}>
            {getAvailabilityLabel(isServerAvailable, isRuntimeHealthLoading)}
          </Badge>
        </SettingsItem>

        <SettingsItem label={fa.settings.appInfo.whisperStatusLabel}>
          <div className="flex items-center gap-2">
            <Badge variant={isWhisperAvailable ? "default" : "secondary"}>
              {getAvailabilityLabel(isWhisperAvailable, isRuntimeHealthLoading)}
            </Badge>
            {runtimeHealth &&
              !isWhisperAvailable &&
              runtimeHealth.whisper.status > 0 && (
                <span className="text-muted-foreground text-xs">
                  HTTP {runtimeHealth.whisper.status}
                </span>
              )}
            <Button
              className="gap-2"
              disabled={isRuntimeHealthFetching}
              onClick={() => refetchRuntimeHealth()}
              size="sm"
              type="button"
              variant="outline"
            >
              <RefreshCcw
                className={
                  isRuntimeHealthFetching ? "size-4 animate-spin" : "size-4"
                }
              />
              {fa.settings.appInfo.refreshStatus}
            </Button>
          </div>
        </SettingsItem>
      </div>
    </SettingsSection>
  );
}

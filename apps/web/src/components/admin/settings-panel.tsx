import { useMutation, useQuery } from "@tanstack/react-query";
import { Bot, FolderCog, LayoutPanelLeft, Shield } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsItem } from "@/components/settings/settings-item";
import { SettingsSection } from "@/components/settings/settings-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/error-utils";
import { fa } from "@/lib/texts";
import type { SystemSettingKey, SystemSettingsMap } from "@/types/settings";
import { orpc, queryClient } from "@/utils/orpc";

const buildSettingsMap = (
  source: Array<{ key: string; value: unknown }> | undefined
): SystemSettingsMap => {
  const map: SystemSettingsMap = {};
  if (!source) {
    return map;
  }
  for (const setting of source) {
    map[setting.key] = setting.value as SystemSettingsMap[string];
  }
  return map;
};

type SidebarFeatureToggleKey = Extract<
  SystemSettingKey,
  | "enable_chat"
  | "enable_image_generation"
  | "enable_code_execution"
  | "enable_translation"
  | "enable_summary"
  | "enable_transcription"
>;

const sidebarFeatureToggles: Array<{
  key: SidebarFeatureToggleKey;
  label: string;
}> = [
  {
    key: "enable_chat",
    label: fa.admin.settings.sidebarFeatures.enableChat,
  },
  {
    key: "enable_image_generation",
    label: fa.admin.settings.sidebarFeatures.enableImageGeneration,
  },
  {
    key: "enable_code_execution",
    label: fa.admin.settings.sidebarFeatures.enableCodeAssistant,
  },
  {
    key: "enable_translation",
    label: fa.admin.settings.sidebarFeatures.enableTranslation,
  },
  {
    key: "enable_summary",
    label: fa.admin.settings.sidebarFeatures.enableSummarize,
  },
  {
    key: "enable_transcription",
    label: fa.admin.settings.sidebarFeatures.enableTranscribe,
  },
];

export function SettingsPanel() {
  const [settings, setSettings] = useState<SystemSettingsMap>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch all settings
  const { data: allSettings, isLoading: isLoadingSettings } = useQuery(
    orpc.admin.getAllSettings.queryOptions()
  );

  // Initialize settings when data loads
  useEffect(() => {
    if (allSettings) {
      setSettings(buildSettingsMap(allSettings));
      setHasChanges(false);
    }
  }, [allSettings]);

  // Upsert settings mutation
  const upsertMutation = useMutation(
    orpc.admin.upsertSetting.mutationOptions({
      onError: (error) => {
        const errorMessage = getErrorMessage(
          error,
          fa.admin.settings.messages.error
        );
        toast.error(errorMessage);
      },
    })
  );

  const handleUpsertSettings = useCallback(
    async (updates: SystemSettingsMap) => {
      // Execute all mutations in parallel for better performance
      await Promise.all(
        Object.entries(updates).map(([key, value]) =>
          upsertMutation.mutateAsync({
            key,
            value,
          })
        )
      );
      await queryClient.invalidateQueries({
        queryKey: orpc.admin.getAllSettings.queryKey(),
      });
      toast.success(fa.admin.settings.messages.saved);
      setHasChanges(false);
    },
    [upsertMutation]
  );

  const handleSettingChange = (
    key: string,
    value: SystemSettingsMap[string]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = useCallback(async () => {
    try {
      await handleUpsertSettings(settings);
    } catch {
      // Error already handled by mutation onError
    }
  }, [handleUpsertSettings, settings]);

  const handleCancel = useCallback(() => {
    // Reload settings from server
    if (allSettings) {
      setSettings(buildSettingsMap(allSettings));
      setHasChanges(false);
    }
  }, [allSettings]);

  if (isLoadingSettings) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="text-center text-muted-foreground">
          {fa.admin.settings.messages.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" dir="rtl">
      <SettingsSection
        description="زمان انقضا و الزامات امنیتی حساب‌ها را مدیریت کنید"
        icon={<Shield className="h-4 w-4" />}
        title={fa.admin.settings.security.title}
      >
        <div className="space-y-3">
          <SettingsItem label={fa.admin.settings.security.tokenExpiration}>
            <Input
              aria-label={fa.admin.settings.security.tokenExpiration}
              className="w-full text-right sm:w-32"
              dir="rtl"
              id="tokenExpiration"
              onChange={(e) =>
                handleSettingChange(
                  "token_expiration_hours",
                  Number.parseInt(e.target.value, 10)
                )
              }
              type="number"
              value={(settings.token_expiration_hours as number) || 24}
            />
          </SettingsItem>
          <SettingsItem label={fa.admin.settings.security.sessionTimeout}>
            <Input
              aria-label={fa.admin.settings.security.sessionTimeout}
              className="w-full text-right sm:w-32"
              dir="rtl"
              id="sessionTimeout"
              onChange={(e) =>
                handleSettingChange(
                  "session_timeout_minutes",
                  Number.parseInt(e.target.value, 10)
                )
              }
              type="number"
              value={(settings.session_timeout_minutes as number) || 30}
            />
          </SettingsItem>
          <SettingsItem label={fa.admin.settings.security.passwordMinLength}>
            <Input
              aria-label={fa.admin.settings.security.passwordMinLength}
              className="w-full text-right sm:w-32"
              dir="rtl"
              id="passwordMinLength"
              onChange={(e) =>
                handleSettingChange(
                  "password_min_length",
                  Number.parseInt(e.target.value, 10)
                )
              }
              type="number"
              value={(settings.password_min_length as number) || 6}
            />
          </SettingsItem>
        </div>
      </SettingsSection>

      <SettingsSection
        description="سقف حجم و فرمت‌های مجاز برای فایل‌های بارگذاری‌شده"
        icon={<FolderCog className="h-4 w-4" />}
        title={fa.admin.settings.fileManagement.title}
      >
        <div className="space-y-3">
          <SettingsItem label={fa.admin.settings.fileManagement.maxFileSize}>
            <Input
              aria-label={fa.admin.settings.fileManagement.maxFileSize}
              className="w-full text-right sm:w-36"
              dir="rtl"
              id="maxFileSize"
              onChange={(e) =>
                handleSettingChange(
                  "max_file_size_mb",
                  Number.parseInt(e.target.value, 10)
                )
              }
              type="number"
              value={(settings.max_file_size_mb as number) || 50}
            />
          </SettingsItem>
          <SettingsItem label={fa.admin.settings.fileManagement.allowedTypes}>
            <Textarea
              aria-label={fa.admin.settings.fileManagement.allowedTypes}
              className="min-h-20 w-full text-right text-xs sm:w-[28rem]"
              dir="rtl"
              id="allowedTypes"
              onChange={(e) =>
                handleSettingChange(
                  "allowed_file_types",
                  e.target.value.split(",").map((t) => t.trim())
                )
              }
              placeholder="pdf, docx, xlsx, csv, txt, md, html, eml, rtf, yaml, toml"
              value={
                Array.isArray(settings.allowed_file_types)
                  ? (settings.allowed_file_types as string[]).join(", ")
                  : ""
              }
            />
          </SettingsItem>
        </div>
      </SettingsSection>

      <SettingsSection
        description="تنظیمات زمان انتظار پاسخ مدل‌ها"
        icon={<Bot className="h-4 w-4" />}
        title={fa.admin.settings.aiModels.title}
      >
        <div className="space-y-3">
          <SettingsItem label={fa.admin.settings.aiModels.responseTimeout}>
            <Input
              aria-label={fa.admin.settings.aiModels.responseTimeout}
              className="w-full text-right sm:w-36"
              dir="rtl"
              id="responseTimeout"
              onChange={(e) =>
                handleSettingChange(
                  "model_response_timeout_seconds",
                  Number.parseInt(e.target.value, 10)
                )
              }
              type="number"
              value={(settings.model_response_timeout_seconds as number) || 300}
            />
          </SettingsItem>
        </div>
      </SettingsSection>

      <SettingsSection
        description="ماژول‌های قابل مشاهده در نوار کناری را فعال یا غیرفعال کنید"
        icon={<LayoutPanelLeft className="h-4 w-4" />}
        title={fa.admin.settings.sidebarFeatures.title}
      >
        <div className="space-y-3">
          {sidebarFeatureToggles.map(({ key, label }) => (
            <SettingsItem key={key} label={label}>
              <Switch
                aria-label={label}
                checked={(settings[key] as boolean) ?? true}
                onCheckedChange={(checked) => handleSettingChange(key, checked)}
              />
            </SettingsItem>
          ))}
        </div>
      </SettingsSection>

      {hasChanges && (
        <div className="rounded-xl border border-yellow-300/60 bg-yellow-50/70 p-4 dark:border-yellow-700/50 dark:bg-yellow-950/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-right">
              <Badge variant="secondary">
                {fa.admin.settings.unsavedChanges.badge}
              </Badge>
              <span className="text-muted-foreground text-sm">
                {fa.admin.settings.unsavedChanges.message}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card/90 p-4">
        <div className="flex flex-row-reverse justify-start gap-3">
          <Button
            disabled={!hasChanges || upsertMutation.isPending}
            onClick={handleCancel}
            variant="outline"
          >
            {fa.admin.settings.actions.cancel}
          </Button>
          <Button
            disabled={!hasChanges || upsertMutation.isPending}
            onClick={handleSave}
          >
            {upsertMutation.isPending
              ? fa.admin.settings.saving
              : fa.admin.settings.actions.save}
          </Button>
        </div>
      </div>
    </div>
  );
}

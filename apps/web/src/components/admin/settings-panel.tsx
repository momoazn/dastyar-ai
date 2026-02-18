import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
      <Card className="p-6">
        <div className="text-center text-gray-500">
          {fa.admin.settings.messages.loading}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Security Settings */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-lg">
          {fa.admin.settings.security.title}
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block font-medium text-sm"
                htmlFor="tokenExpiration"
              >
                {fa.admin.settings.security.tokenExpiration}
              </label>
              <Input
                className="mt-1"
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
            </div>
            <div>
              <label
                className="block font-medium text-sm"
                htmlFor="sessionTimeout"
              >
                {fa.admin.settings.security.sessionTimeout}
              </label>
              <Input
                className="mt-1"
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
            </div>
            <div>
              <label
                className="block font-medium text-sm"
                htmlFor="passwordMinLength"
              >
                {fa.admin.settings.security.passwordMinLength}
              </label>
              <Input
                className="mt-1"
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
            </div>
          </div>
        </div>
      </Card>

      {/* File Management Settings */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-lg">
          {fa.admin.settings.fileManagement.title}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block font-medium text-sm" htmlFor="maxFileSize">
              {fa.admin.settings.fileManagement.maxFileSize}
            </label>
            <Input
              className="mt-1"
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
          </div>
          <div>
            <label className="block font-medium text-sm" htmlFor="allowedTypes">
              {fa.admin.settings.fileManagement.allowedTypes}
            </label>
            <Textarea
              className="mt-1 text-xs"
              id="allowedTypes"
              onChange={(e) =>
                handleSettingChange(
                  "allowed_file_types",
                  e.target.value.split(",").map((t) => t.trim())
                )
              }
              placeholder="pdf, docx, xlsx, csv, txt, md, html, eml, rtf, yaml, toml (comma-separated)"
              value={
                Array.isArray(settings.allowed_file_types)
                  ? (settings.allowed_file_types as string[]).join(", ")
                  : ""
              }
            />
          </div>
        </div>
      </Card>

      {/* AI Models Settings */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-lg">
          {fa.admin.settings.aiModels.title}
        </h3>
        <div className="space-y-4">
          <div>
            <label
              className="block font-medium text-sm"
              htmlFor="responseTimeout"
            >
              {fa.admin.settings.aiModels.responseTimeout}
            </label>
            <Input
              className="mt-1"
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
          </div>
        </div>
      </Card>

      {/* Sidebar Features */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-lg">
          {fa.admin.settings.sidebarFeatures.title}
        </h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {sidebarFeatureToggles.map(({ key, label }) => (
            <label className="flex items-center gap-2" key={key}>
              <input
                checked={(settings[key] as boolean) ?? true}
                onChange={(e) => handleSettingChange(key, e.target.checked)}
                type="checkbox"
              />
              <span className="font-medium text-sm">{label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Status Badge */}
      {hasChanges && (
        <Card className="border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {fa.admin.settings.unsavedChanges.badge}
              </Badge>
              <span className="text-gray-600 text-sm">
                {fa.admin.settings.unsavedChanges.message}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
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
  );
}

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
import type { SystemSettingsMap } from "@/types/settings";
import { orpc, queryClient } from "@/utils/orpc";

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
      const settingsMap: SystemSettingsMap = {};
      for (const setting of allSettings) {
        settingsMap[setting.key] = setting.value as SystemSettingsMap[string];
      }
      setSettings(settingsMap);
      setHasChanges(false);
    }
  }, [allSettings]);

  // Upsert settings mutation
  const upsertMutation = useMutation(
    orpc.admin.upsertSetting.mutationOptions({
      onSuccess: () => {
        // Invalidate settings query to refetch latest values
        queryClient.invalidateQueries({
          queryKey: orpc.admin.getAllSettings.queryKey(),
        });
        toast.success(fa.admin.settings.messages.saved);
        setHasChanges(false);
      },
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
      const settingsMap: SystemSettingsMap = {};
      for (const setting of allSettings) {
        settingsMap[setting.key] = setting.value as SystemSettingsMap[string];
      }
      setSettings(settingsMap);
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
      {/* General Settings */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-lg">
          {fa.admin.settings.general.title}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block font-medium text-sm" htmlFor="appName">
              {fa.admin.settings.general.appName}
            </label>
            <Input
              className="mt-1"
              id="appName"
              onChange={(e) => handleSettingChange("app_name", e.target.value)}
              value={(settings.app_name as string) || ""}
            />
          </div>
          <div>
            <label
              className="block font-medium text-sm"
              htmlFor="appDescription"
            >
              {fa.admin.settings.general.appDescription}
            </label>
            <Textarea
              className="mt-1"
              id="appDescription"
              onChange={(e) =>
                handleSettingChange("app_description", e.target.value)
              }
              value={(settings.app_description as string) || ""}
            />
          </div>
        </div>
      </Card>

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
              placeholder="pdf, txt, docx (comma-separated)"
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
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                checked={settings.enable_transcription as boolean}
                onChange={(e) =>
                  handleSettingChange("enable_transcription", e.target.checked)
                }
                type="checkbox"
              />
              <span className="font-medium text-sm">
                {fa.admin.settings.aiModels.enableTranscription}
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                checked={settings.enable_translation as boolean}
                onChange={(e) =>
                  handleSettingChange("enable_translation", e.target.checked)
                }
                type="checkbox"
              />
              <span className="font-medium text-sm">
                {fa.admin.settings.aiModels.enableTranslation}
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                checked={settings.enable_code_execution as boolean}
                onChange={(e) =>
                  handleSettingChange("enable_code_execution", e.target.checked)
                }
                type="checkbox"
              />
              <span className="font-medium text-sm">
                {fa.admin.settings.aiModels.enableCodeExecution}
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                checked={settings.enable_image_generation as boolean}
                onChange={(e) =>
                  handleSettingChange(
                    "enable_image_generation",
                    e.target.checked
                  )
                }
                type="checkbox"
              />
              <span className="font-medium text-sm">
                {fa.admin.settings.aiModels.enableImageGeneration}
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Rate Limiting Settings */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-lg">
          {fa.admin.settings.rateLimit.title}
        </h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              checked={settings.rate_limit_enabled as boolean}
              onChange={(e) =>
                handleSettingChange("rate_limit_enabled", e.target.checked)
              }
              type="checkbox"
            />
            <span className="font-medium text-sm">
              {fa.admin.settings.rateLimit.enabled}
            </span>
          </label>
          {(settings.rate_limit_enabled as boolean) && (
            <div>
              <label
                className="block font-medium text-sm"
                htmlFor="requestsPerMinute"
              >
                {fa.admin.settings.rateLimit.requestsPerMinute}
              </label>
              <Input
                className="mt-1"
                id="requestsPerMinute"
                onChange={(e) =>
                  handleSettingChange(
                    "rate_limit_requests_per_minute",
                    Number.parseInt(e.target.value, 10)
                  )
                }
                type="number"
                value={
                  (settings.rate_limit_requests_per_minute as number) || 100
                }
              />
            </div>
          )}
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

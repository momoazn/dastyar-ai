import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { toast } from "sonner";
import { fa } from "@/lib/persian-texts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { SelectSystemSetting } from "@/types/database";

interface SettingValue {
  [key: string]: string | number | boolean | string[];
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch all settings
  const { data: allSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const result = await orpc.admin.getAllSettings.query();
      return result;
    },
  });

  // Initialize settings when data loads
  useEffect(() => {
    if (allSettings) {
      const settingsMap: Record<string, unknown> = {};
      allSettings.forEach((setting: SelectSystemSetting) => {
        settingsMap[setting.key] = setting.value;
      });
      setSettings(settingsMap);
    }
  }, [allSettings]);

  // Upsert settings mutation
  const upsertMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(updates)) {
        await orpc.admin.upsertSetting.mutate({
          key,
          value,
        });
      }
    },
    onSuccess: () => {
      toast.success(fa.admin.settings.messages.saved);
      setHasChanges(false);
    },
    onError: () => {
      toast.error(fa.admin.settings.messages.error);
    },
  });

  const handleSettingChange = (key: string, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await upsertMutation.mutateAsync(settings);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reload settings from server
    if (allSettings) {
      const settingsMap: Record<string, unknown> = {};
      allSettings.forEach((setting: SelectSystemSetting) => {
        settingsMap[setting.key] = setting.value;
      });
      setSettings(settingsMap);
      setHasChanges(false);
    }
  };

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
    <div className="space-y-6">
      {/* General Settings */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">
          {fa.admin.settings.general.title}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">
              {fa.admin.settings.general.appName}
            </label>
            <Input
              value={(settings.app_name as string) || ""}
              onChange={(e) => handleSettingChange("app_name", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              {fa.admin.settings.general.appDescription}
            </label>
            <Textarea
              value={(settings.app_description as string) || ""}
              onChange={(e) =>
                handleSettingChange("app_description", e.target.value)
              }
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">
          {fa.admin.settings.security.title}
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">
                {fa.admin.settings.security.tokenExpiration}
              </label>
              <Input
                type="number"
                value={(settings.token_expiration_hours as number) || 24}
                onChange={(e) =>
                  handleSettingChange("token_expiration_hours", parseInt(e.target.value))
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                {fa.admin.settings.security.sessionTimeout}
              </label>
              <Input
                type="number"
                value={(settings.session_timeout_minutes as number) || 30}
                onChange={(e) =>
                  handleSettingChange("session_timeout_minutes", parseInt(e.target.value))
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                {fa.admin.settings.security.passwordMinLength}
              </label>
              <Input
                type="number"
                value={(settings.password_min_length as number) || 6}
                onChange={(e) =>
                  handleSettingChange("password_min_length", parseInt(e.target.value))
                }
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* File Management Settings */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">
          {fa.admin.settings.fileManagement.title}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">
              {fa.admin.settings.fileManagement.maxFileSize}
            </label>
            <Input
              type="number"
              value={(settings.max_file_size_mb as number) || 50}
              onChange={(e) =>
                handleSettingChange("max_file_size_mb", parseInt(e.target.value))
              }
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              {fa.admin.settings.fileManagement.allowedTypes}
            </label>
            <Textarea
              value={
                Array.isArray(settings.allowed_file_types)
                  ? (settings.allowed_file_types as string[]).join(", ")
                  : ""
              }
              onChange={(e) =>
                handleSettingChange(
                  "allowed_file_types",
                  e.target.value.split(",").map((t) => t.trim())
                )
              }
              className="mt-1 text-xs"
              placeholder="pdf, txt, docx (comma-separated)"
            />
          </div>
        </div>
      </Card>

      {/* AI Models Settings */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">
          {fa.admin.settings.aiModels.title}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">
              {fa.admin.settings.aiModels.responseTimeout}
            </label>
            <Input
              type="number"
              value={(settings.model_response_timeout_seconds as number) || 300}
              onChange={(e) =>
                handleSettingChange("model_response_timeout_seconds", parseInt(e.target.value))
              }
              className="mt-1"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(settings.enable_transcription as boolean) || false}
                onChange={(e) =>
                  handleSettingChange("enable_transcription", e.target.checked)
                }
              />
              <span className="text-sm font-medium">
                {fa.admin.settings.aiModels.enableTranscription}
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(settings.enable_translation as boolean) || false}
                onChange={(e) =>
                  handleSettingChange("enable_translation", e.target.checked)
                }
              />
              <span className="text-sm font-medium">
                {fa.admin.settings.aiModels.enableTranslation}
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(settings.enable_code_execution as boolean) || false}
                onChange={(e) =>
                  handleSettingChange("enable_code_execution", e.target.checked)
                }
              />
              <span className="text-sm font-medium">
                {fa.admin.settings.aiModels.enableCodeExecution}
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(settings.enable_image_generation as boolean) || false}
                onChange={(e) =>
                  handleSettingChange("enable_image_generation", e.target.checked)
                }
              />
              <span className="text-sm font-medium">
                {fa.admin.settings.aiModels.enableImageGeneration}
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Rate Limiting Settings */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">
          {fa.admin.settings.rateLimit.title}
        </h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={(settings.rate_limit_enabled as boolean) || false}
              onChange={(e) =>
                handleSettingChange("rate_limit_enabled", e.target.checked)
              }
            />
            <span className="text-sm font-medium">
              {fa.admin.settings.rateLimit.enabled}
            </span>
          </label>
          {(settings.rate_limit_enabled as boolean) && (
            <div>
              <label className="block text-sm font-medium">
                {fa.admin.settings.rateLimit.requestsPerMinute}
              </label>
              <Input
                type="number"
                value={(settings.rate_limit_requests_per_minute as number) || 100}
                onChange={(e) =>
                  handleSettingChange(
                    "rate_limit_requests_per_minute",
                    parseInt(e.target.value)
                  )
                }
                className="mt-1"
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
              <Badge variant="secondary">تغییرات ذخیره‌نشده</Badge>
              <span className="text-sm text-gray-600">
                شما تغییراتی انجام داده‌اید که هنوز ذخیره نشده‌اند
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={!hasChanges || loading}
        >
          {fa.admin.settings.actions.cancel}
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || loading}
          loading={loading}
        >
          {fa.admin.settings.actions.save}
        </Button>
      </div>
    </div>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { createLanguageOptions } from "@/lib/enum-mappings";
import { fa } from "@/lib/persian-texts";
import { orpc } from "@/utils/orpc";
import { SettingsItem } from "./settings-item";
import { SettingsSection } from "./settings-section";

const quickSettingsSchema = z.object({
  defaultModelId: z.number().nullable().optional(),
  defaultLanguage: z
    .enum(["fa", "en", "ar", "fr", "de", "es"])
    .nullable()
    .optional(),
  voiceLanguage: z.enum(["fa", "en"]).nullable().optional(),
});

type QuickSettingsFormValues = z.infer<typeof quickSettingsSchema>;

export function QuickSettings() {
  const modelsQuery = useQuery({
    ...orpc.models.list.queryOptions({
      input: { isEnabled: true, sync: true },
    }),
  });

  const preferencesQuery = useQuery({
    ...orpc.settings.getPreferences.queryOptions(),
  });

  const form = useForm<QuickSettingsFormValues>({
    resolver: zodResolver(quickSettingsSchema),
    defaultValues: {
      defaultModelId: null,
      defaultLanguage: "fa",
      voiceLanguage: "fa",
    },
  });

  // Initialize form with current preferences
  useEffect(() => {
    if (preferencesQuery.data) {
      form.reset({
        defaultModelId:
          preferencesQuery.data.codeModelId ||
          preferencesQuery.data.translationModelId ||
          preferencesQuery.data.summarizeModelId,
        defaultLanguage:
          preferencesQuery.data.translationSourceLanguage || "fa",
        voiceLanguage: preferencesQuery.data.transcribeLanguage || "fa",
      });
    }
  }, [preferencesQuery.data, form]);

  const updatePreferencesMutation = useMutation(
    orpc.settings.updatePreferences.mutationOptions({
      onSuccess: () => {
        toast.success(fa.settings.preferences.saved);
        preferencesQuery.refetch();
      },
      onError: (error: Error) => {
        toast.error(fa.settings.preferences.saveError, {
          description: error.message,
        });
      },
    })
  );

  const onSubmit = (values: QuickSettingsFormValues) => {
    // Update all relevant preference fields with the single model
    updatePreferencesMutation.mutate({
      codeModelId: values.defaultModelId,
      translationModelId: values.defaultModelId,
      summarizeModelId: values.defaultModelId,
      translationSourceLanguage: values.defaultLanguage,
      transcribeLanguage: values.voiceLanguage,
      // Keep existing values for other fields
      codeMode: preferencesQuery.data?.codeMode,
      codeLanguage: preferencesQuery.data?.codeLanguage,
      translationTargetLanguage:
        preferencesQuery.data?.translationTargetLanguage,
      translationTone: preferencesQuery.data?.translationTone,
      summarizeMode: preferencesQuery.data?.summarizeMode,
      summarizeTone: preferencesQuery.data?.summarizeTone,
      transcribeModel: preferencesQuery.data?.transcribeModel,
    });
  };

  const models = modelsQuery.data || [];
  const languageOptions = createLanguageOptions();

  if (preferencesQuery.isLoading) {
    return (
      <div className="p-4 text-right">
        <p className="text-muted-foreground">{fa.general.loading}...</p>
      </div>
    );
  }

  return (
    <SettingsSection
      description={fa.settings.quickSettings.description}
      icon={<Settings className="h-4 w-4" />}
      title={fa.settings.quickSettings.title}
    >
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <SettingsItem
            description={fa.settings.quickSettings.defaultModelDescription}
            label={fa.settings.quickSettings.defaultModel}
          >
            <FormField
              control={form.control}
              name="defaultModelId"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value ? Number(value) : null)
                    }
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="w-64 text-right" dir="rtl">
                        <SelectValue placeholder={fa.general.selectModel} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent dir="rtl">
                      {models.map((model) => (
                        <SelectItem
                          className="text-right"
                          key={model.id}
                          value={model.id.toString()}
                        >
                          {model.identifier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />
          </SettingsItem>

          <SettingsItem
            description={fa.settings.quickSettings.defaultLanguageDescription}
            label={fa.settings.quickSettings.defaultLanguage}
          >
            <FormField
              control={form.control}
              name="defaultLanguage"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="w-32 text-right" dir="rtl">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent dir="rtl">
                      {languageOptions.map((option) => (
                        <SelectItem
                          className="text-right"
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />
          </SettingsItem>

          <SettingsItem
            description={fa.settings.quickSettings.voiceLanguageDescription}
            label={fa.settings.quickSettings.voiceLanguage}
          >
            <FormField
              control={form.control}
              name="voiceLanguage"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="w-32 text-right" dir="rtl">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent dir="rtl">
                      {languageOptions.map((option) => (
                        <SelectItem
                          className="text-right"
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />
          </SettingsItem>

          <div className="flex justify-end pt-4">
            <Button
              disabled={updatePreferencesMutation.isPending}
              type="submit"
            >
              {updatePreferencesMutation.isPending
                ? fa.general.loading
                : fa.settings.preferences.save}
            </Button>
          </div>
        </form>
      </Form>
    </SettingsSection>
  );
}

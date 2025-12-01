import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button, Form } from "@/components/ui";
import { fa } from "@/lib/persian-texts";
import { orpc } from "@/utils/orpc";
import { CodePreferences } from "./preferences-sections/code-preferences";
import { SummaryPreferences } from "./preferences-sections/summary-preferences";
import { TranscribePreferences } from "./preferences-sections/transcribe-preferences";
import { TranslationPreferences } from "./preferences-sections/translation-preferences";

const preferencesSchema = z.object({
  codeModelId: z.number().nullable().optional(),
  codeMode: z
    .enum(["explain", "refactor", "debug", "optimize", "document", "test"])
    .nullable()
    .optional(),
  codeLanguage: z
    .enum([
      "javascript",
      "typescript",
      "python",
      "java",
      "c",
      "cpp",
      "csharp",
      "go",
      "rust",
      "php",
      "ruby",
      "swift",
      "kotlin",
      "dart",
      "sql",
      "html",
      "css",
      "other",
    ])
    .nullable()
    .optional(),
  translationModelId: z.number().nullable().optional(),
  translationSourceLanguage: z
    .enum(["en", "fa", "ar", "fr", "de", "es"])
    .nullable()
    .optional(),
  translationTargetLanguage: z
    .enum(["en", "fa", "ar", "fr", "de", "es"])
    .nullable()
    .optional(),
  translationTone: z
    .enum([
      "formal",
      "informal",
      "business",
      "academic",
      "technical",
      "creative",
      "friendly",
      "professional",
    ])
    .nullable()
    .optional(),
  summarizeModelId: z.number().nullable().optional(),
  summarizeMode: z
    .enum(["concise", "standard", "detailed"])
    .nullable()
    .optional(),
  summarizeTone: z
    .enum([
      "formal",
      "informal",
      "business",
      "academic",
      "technical",
      "creative",
      "friendly",
      "professional",
    ])
    .nullable()
    .optional(),
  transcribeModel: z.string().nullable().optional(),
  transcribeLanguage: z.enum(["fa", "en"]).nullable().optional(),
});

type PreferencesFormValues = z.infer<typeof preferencesSchema>;

export function PreferencesSettings() {
  const preferencesQuery = useQuery({
    ...orpc.settings.getPreferences.queryOptions(),
  });

  const modelsQuery = useQuery({
    ...orpc.models.list.queryOptions({
      input: { isEnabled: true, sync: true },
    }),
  });

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      codeModelId: null,
      codeMode: null,
      codeLanguage: null,
      translationModelId: null,
      translationSourceLanguage: null,
      translationTargetLanguage: null,
      translationTone: null,
      summarizeModelId: null,
      summarizeMode: null,
      summarizeTone: null,
      transcribeModel: null,
      transcribeLanguage: null,
    },
  });

  useEffect(() => {
    if (preferencesQuery.data) {
      form.reset({
        codeModelId: preferencesQuery.data.codeModelId,
        codeMode: preferencesQuery.data.codeMode,
        codeLanguage: preferencesQuery.data.codeLanguage,
        translationModelId: preferencesQuery.data.translationModelId,
        translationSourceLanguage:
          preferencesQuery.data.translationSourceLanguage,
        translationTargetLanguage:
          preferencesQuery.data.translationTargetLanguage,
        translationTone: preferencesQuery.data.translationTone,
        summarizeModelId: preferencesQuery.data.summarizeModelId,
        summarizeMode: preferencesQuery.data.summarizeMode,
        summarizeTone: preferencesQuery.data.summarizeTone,
        transcribeModel: preferencesQuery.data.transcribeModel,
        transcribeLanguage: preferencesQuery.data.transcribeLanguage,
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

  const onSubmit = (values: PreferencesFormValues) => {
    updatePreferencesMutation.mutate(values);
  };

  const resetToServer = () => {
    if (preferencesQuery.data) {
      form.reset({
        codeModelId: preferencesQuery.data.codeModelId,
        codeMode: preferencesQuery.data.codeMode,
        codeLanguage: preferencesQuery.data.codeLanguage,
        translationModelId: preferencesQuery.data.translationModelId,
        translationSourceLanguage:
          preferencesQuery.data.translationSourceLanguage,
        translationTargetLanguage:
          preferencesQuery.data.translationTargetLanguage,
        translationTone: preferencesQuery.data.translationTone,
        summarizeModelId: preferencesQuery.data.summarizeModelId,
        summarizeMode: preferencesQuery.data.summarizeMode,
        summarizeTone: preferencesQuery.data.summarizeTone,
        transcribeModel: preferencesQuery.data.transcribeModel,
        transcribeLanguage: preferencesQuery.data.transcribeLanguage,
      });
    }
  };

  const models = modelsQuery.data || [];

  if (preferencesQuery.isLoading) {
    return (
      <div className="p-6 text-right">
        <p className="text-muted-foreground">{fa.general.loading}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <CodePreferences models={models} />
          <TranslationPreferences models={models} />
          <SummaryPreferences models={models} />
          <TranscribePreferences />

          {/* Sticky Action Bar */}
          <div className="-mx-6 -mb-6 sticky bottom-0 z-10 border-t bg-background/80 px-6 py-4 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="flex items-center justify-between gap-2">
              <Button
                disabled={updatePreferencesMutation.isPending}
                onClick={resetToServer}
                type="button"
                variant="ghost"
              >
                {fa.settings.preferences.reset}
              </Button>
              <Button
                disabled={updatePreferencesMutation.isPending}
                type="submit"
              >
                {updatePreferencesMutation.isPending
                  ? fa.general.loading
                  : fa.settings.preferences.save}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

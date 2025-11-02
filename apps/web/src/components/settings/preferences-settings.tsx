import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BookOpenText, Code2, Languages, Mic2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  createCodeModeOptions,
  createLanguageOptions,
  createProgrammingLanguageOptions,
  createSummaryModeOptions,
  createToneOptions,
  createTranscribeEngineOptions,
  createTranscribeLanguageOptions,
} from "@/lib/enum-mappings";
import { fa } from "@/lib/persian-texts";
import { orpc } from "@/utils/orpc";

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
  transcribeEngine: z.enum(["whisperx", "whisper"]).nullable().optional(),
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
      transcribeEngine: null,
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
        transcribeEngine: preferencesQuery.data.transcribeEngine,
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
        transcribeEngine: preferencesQuery.data.transcribeEngine,
        transcribeLanguage: preferencesQuery.data.transcribeLanguage,
      });
    }
  };

  const codeModeOptions = createCodeModeOptions();
  const languageOptions = createLanguageOptions();
  const programmingLanguageOptions = createProgrammingLanguageOptions();
  const toneOptions = createToneOptions();
  const summaryModeOptions = createSummaryModeOptions();
  const transcribeEngineOptions = createTranscribeEngineOptions();
  const transcribeLanguageOptions = createTranscribeLanguageOptions();

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
          {/* Code Assistant Section */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="inline-flex items-center gap-2 text-right font-semibold text-lg">
              <Code2
                aria-hidden="true"
                className="h-4 w-4 text-muted-foreground"
              />
              {fa.settings.preferences.code}
            </h3>

            <FormField
              control={form.control}
              name="codeModelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">
                    {fa.settings.preferences.codeModel}
                  </FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value ? Number(value) : null)
                    }
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="text-right" dir="rtl">
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

            <FormField
              control={form.control}
              name="codeMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">
                    {fa.settings.preferences.codeMode}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="text-right" dir="rtl">
                        <SelectValue placeholder="انتخاب حالت" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent dir="rtl">
                      {codeModeOptions.map((option) => (
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

            <FormField
              control={form.control}
              name="codeLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">
                    {fa.settings.preferences.codeLanguage}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="text-right" dir="rtl">
                        <SelectValue placeholder="انتخاب زبان" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent dir="rtl">
                      {programmingLanguageOptions.map((option) => (
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
          </div>

          {/* Translation Section */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="inline-flex items-center gap-2 text-right font-semibold text-lg">
              <Languages
                aria-hidden="true"
                className="h-4 w-4 text-muted-foreground"
              />
              {fa.settings.preferences.translation}
            </h3>

            <FormField
              control={form.control}
              name="translationModelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">
                    {fa.settings.preferences.translationModel}
                  </FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value ? Number(value) : null)
                    }
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="text-right" dir="rtl">
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

            <FormField
              control={form.control}
              name="translationSourceLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">
                    {fa.settings.preferences.translationSourceLanguage}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="text-right" dir="rtl">
                        <SelectValue placeholder="انتخاب زبان" />
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

            <FormField
              control={form.control}
              name="translationTargetLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">
                    {fa.settings.preferences.translationTargetLanguage}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="text-right" dir="rtl">
                        <SelectValue placeholder="انتخاب زبان" />
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

            <FormField
              control={form.control}
              name="translationTone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">
                    {fa.settings.preferences.translationTone}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="text-right" dir="rtl">
                        <SelectValue placeholder="انتخاب لحن" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent dir="rtl">
                      {toneOptions.map((option) => (
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
          </div>

          {/* Summarize Section */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="inline-flex items-center gap-2 text-right font-semibold text-lg">
              <BookOpenText
                aria-hidden="true"
                className="h-4 w-4 text-muted-foreground"
              />
              {fa.settings.preferences.summarize}
            </h3>

            <FormField
              control={form.control}
              name="summarizeModelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">
                    {fa.settings.preferences.summarizeModel}
                  </FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value ? Number(value) : null)
                    }
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="text-right" dir="rtl">
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

            <FormField
              control={form.control}
              name="summarizeMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">
                    {fa.settings.preferences.summarizeMode}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="text-right" dir="rtl">
                        <SelectValue placeholder="انتخاب حالت" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent dir="rtl">
                      {summaryModeOptions.map((option) => (
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

            <FormField
              control={form.control}
              name="summarizeTone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">
                    {fa.settings.preferences.summarizeTone}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="text-right" dir="rtl">
                        <SelectValue placeholder="انتخاب لحن" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent dir="rtl">
                      {toneOptions.map((option) => (
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
          </div>

          {/* Transcribe Section */}
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="inline-flex items-center gap-2 text-right font-semibold text-lg">
              <Mic2
                aria-hidden="true"
                className="h-4 w-4 text-muted-foreground"
              />
              {fa.settings.preferences.transcribe}
            </h3>

            <FormField
              control={form.control}
              name="transcribeModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">
                    {fa.settings.preferences.transcribeModel}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="text-right"
                      dir="rtl"
                      placeholder="base, small, medium, large..."
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription className="text-right text-xs">
                    نام مدل Whisper (مثال: base, small, medium, large)
                  </FormDescription>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transcribeEngine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">
                    {fa.settings.preferences.transcribeEngine}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="text-right" dir="rtl">
                        <SelectValue placeholder="انتخاب موتور" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent dir="rtl">
                      {transcribeEngineOptions.map((option) => (
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

            <FormField
              control={form.control}
              name="transcribeLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">
                    {fa.settings.preferences.transcribeLanguage}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="text-right" dir="rtl">
                        <SelectValue placeholder="انتخاب زبان" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent dir="rtl">
                      {transcribeLanguageOptions.map((option) => (
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
          </div>

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

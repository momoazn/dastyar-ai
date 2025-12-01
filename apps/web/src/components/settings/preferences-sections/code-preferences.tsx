import { Code2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  createCodeModeOptions,
  createProgrammingLanguageOptions,
} from "@/lib/enum-mappings";
import { fa } from "@/lib/persian-texts";
import type { SelectLlmModel } from "@/types/database";

const codeModeOptions = createCodeModeOptions();
const programmingLanguageOptions = createProgrammingLanguageOptions();

type CodePreferencesProps = {
  models: SelectLlmModel[];
};

export function CodePreferences({ models }: CodePreferencesProps) {
  const form = useFormContext();

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="inline-flex items-center gap-2 text-right font-semibold text-lg">
        <Code2 aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
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
            <Select onValueChange={field.onChange} value={field.value || ""}>
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
            <Select onValueChange={field.onChange} value={field.value || ""}>
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
  );
}

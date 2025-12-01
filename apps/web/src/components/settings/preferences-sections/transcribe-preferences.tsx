import { Mic2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
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
import { createTranscribeLanguageOptions } from "@/lib/enum-mappings";
import { fa } from "@/lib/persian-texts";

const transcribeLanguageOptions = createTranscribeLanguageOptions();

export function TranscribePreferences() {
  const form = useFormContext();

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="inline-flex items-center gap-2 text-right font-semibold text-lg">
        <Mic2 aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
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
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-right text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                dir="rtl"
                onChange={(e) => field.onChange(e.target.value || null)}
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
        name="transcribeLanguage"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right">
              {fa.settings.preferences.transcribeLanguage}
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
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
  );
}

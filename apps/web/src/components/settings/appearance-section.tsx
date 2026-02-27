import { Monitor } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { fa } from "@/lib/texts";
import { SettingsItem } from "./settings-item";
import { SettingsSection } from "./settings-section";

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const selectedTheme =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system";

  return (
    <SettingsSection
      description={fa.settings.appearance.description}
      icon={<Monitor className="h-4 w-4" />}
      title={fa.settings.appearance.title}
    >
      <div className="space-y-4">
        <SettingsItem
          description={fa.settings.appearance.themeDescription}
          label={fa.settings.appearance.theme}
        >
          <Select onValueChange={setTheme} value={selectedTheme}>
            <SelectTrigger
              className="w-36 justify-between text-right"
              dir="rtl"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="light">
                {fa.settings.appearance.light}
              </SelectItem>
              <SelectItem value="dark">
                {fa.settings.appearance.dark}
              </SelectItem>
              <SelectItem value="system">
                {fa.settings.appearance.system}
              </SelectItem>
            </SelectContent>
          </Select>
        </SettingsItem>
      </div>
    </SettingsSection>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Shield, SlidersHorizontal, User } from "lucide-react";
import { ModelsTable } from "@/components/admin/models-table";
import { UsersTable } from "@/components/admin/users-table";
import { AccountSettings } from "@/components/settings/account-settings";
import { PreferencesSettings } from "@/components/settings/preferences-settings";
import { Card } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import ProtectedLayout from "@/layouts/protected";
import { fa } from "@/lib/persian-texts";

export const Route = createFileRoute("/settings")({
  component: SettingsComponent,
  validateSearch: (search: { tab?: string }) => ({
    tab:
      typeof search.tab === "string" &&
      ["account", "preferences", "admin"].includes(search.tab)
        ? (search.tab as "account" | "preferences" | "admin")
        : "account",
  }),
});

function SettingsComponent() {
  const { data: user } = useUser();
  const isAdmin = user?.role === "admin";
  const navigate = Route.useNavigate();
  const { tab } = Route.useSearch();
  const currentTab = !isAdmin && tab === "admin" ? "account" : tab;

  const getDescription = () => {
    switch (currentTab) {
      case "account":
        return (
          fa.settings.account.description ||
          "تنظیمات حساب کاربری خود را مدیریت کنید"
        );
      case "preferences":
        return fa.settings.preferences.description;
      case "admin":
        return "مدیریت کاربران و مدل‌های سیستم";
      default:
        return "";
    }
  };

  return (
    <ProtectedLayout>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 md:px-6">
        <div className="text-right" dir="rtl">
          <h1 className="font-bold text-2xl">{fa.settings.title}</h1>
          <p className="text-muted-foreground text-sm">{getDescription()}</p>
        </div>
        <Card className="p-6">
          <Tabs
            className="w-full"
            onValueChange={(value) =>
              navigate({
                replace: true,
                search: (prev: {
                  tab: "account" | "preferences" | "admin";
                }) => ({
                  ...prev,
                  tab:
                    value === "admin" && !isAdmin
                      ? "account"
                      : (value as "account" | "preferences" | "admin"),
                }),
              })
            }
            value={currentTab}
          >
            <TabsList
              className={`sticky top-0 z-20 grid w-full bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 ${
                isAdmin ? "grid-cols-3" : "grid-cols-2"
              }`}
              dir="rtl"
            >
              <TabsTrigger
                className="inline-flex items-center justify-center gap-2 text-right"
                value="account"
              >
                <User aria-hidden="true" className="h-4 w-4" />
                {fa.settings.tabs.account}
              </TabsTrigger>
              <TabsTrigger
                className="inline-flex items-center justify-center gap-2 text-right"
                value="preferences"
              >
                <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
                {fa.settings.tabs.preferences}
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger
                  className="inline-flex items-center justify-center gap-2 text-right"
                  value="admin"
                >
                  <Shield aria-hidden="true" className="h-4 w-4" />
                  {fa.settings.tabs.admin}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent className="mt-6" value="account">
              <AccountSettings />
            </TabsContent>

            <TabsContent className="mt-6" value="preferences">
              <PreferencesSettings />
            </TabsContent>

            {isAdmin && (
              <TabsContent className="mt-6" value="admin">
                <div className="space-y-6">
                  <UsersTable />
                  <ModelsTable />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </Card>
      </div>
    </ProtectedLayout>
  );
}

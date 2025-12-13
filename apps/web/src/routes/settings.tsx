import { createFileRoute } from "@tanstack/react-router";
import { Bot, Shield, SlidersHorizontal, User, Users } from "lucide-react";
import { ModelsTable } from "@/components/admin/models-table";
import { SettingsPanel } from "@/components/admin/settings-panel";
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
      ["account", "preferences", "users", "models", "system"].includes(
        search.tab
      )
        ? (search.tab as
            | "account"
            | "preferences"
            | "users"
            | "models"
            | "system")
        : "account",
  }),
});

function SettingsComponent() {
  const { data: user } = useUser();
  const isAdmin = user?.role === "admin";
  const navigate = Route.useNavigate();
  const { tab } = Route.useSearch();
  const currentTab =
    !isAdmin && ["users", "models", "system"].includes(tab) ? "account" : tab;

  const getDescription = () => {
    switch (currentTab) {
      case "account":
        return (
          fa.settings.account.description ||
          "تنظیمات حساب کاربری خود را مدیریت کنید"
        );
      case "preferences":
        return fa.settings.preferences.description;
      case "users":
        return fa.admin.users.title;
      case "models":
        return fa.admin.models.title;
      case "system":
        return fa.admin.settings.subtitle || "مدیریت تنظیمات و پیکربندی برنامه";
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
                  tab:
                    | "account"
                    | "preferences"
                    | "users"
                    | "models"
                    | "system";
                }) => ({
                  ...prev,
                  tab: value as
                    | "account"
                    | "preferences"
                    | "users"
                    | "models"
                    | "system",
                }),
              })
            }
            value={currentTab}
          >
            <TabsList
              className={`sticky top-0 z-20 grid w-full bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 ${
                isAdmin ? "grid-cols-5" : "grid-cols-2"
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
                <>
                  <TabsTrigger
                    className="inline-flex items-center justify-center gap-2 text-right"
                    value="users"
                  >
                    <Users aria-hidden="true" className="h-4 w-4" />
                    {fa.settings.tabs.users}
                  </TabsTrigger>
                  <TabsTrigger
                    className="inline-flex items-center justify-center gap-2 text-right"
                    value="models"
                  >
                    <Bot aria-hidden="true" className="h-4 w-4" />
                    {fa.settings.tabs.models}
                  </TabsTrigger>
                  <TabsTrigger
                    className="inline-flex items-center justify-center gap-2 text-right"
                    value="system"
                  >
                    <Shield aria-hidden="true" className="h-4 w-4" />
                    {fa.settings.tabs.system}
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent className="mt-6" value="account">
              <AccountSettings />
            </TabsContent>

            <TabsContent className="mt-6" value="preferences">
              <PreferencesSettings />
            </TabsContent>

            {isAdmin && (
              <>
                <TabsContent className="mt-6" value="users">
                  <UsersTable />
                </TabsContent>

                <TabsContent className="mt-6" value="models">
                  <ModelsTable />
                </TabsContent>

                <TabsContent className="mt-6" value="system">
                  <SettingsPanel />
                </TabsContent>
              </>
            )}
          </Tabs>
        </Card>
      </div>
    </ProtectedLayout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { ModelsTable } from "@/components/admin/models-table";
import { OllamaServersTable } from "@/components/admin/ollama-servers-table";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { UsersTable } from "@/components/admin/users-table";
import { UserProfile } from "@/components/user-profile";
import AdminLayout from "@/layouts/admin";
import { fa } from "@/lib/texts";

export const Route = createFileRoute("/admin")({
  component: AdminRouteComponent,
});

function AdminRouteComponent() {
  return (
    <AdminLayout>
      <div className="space-y-8" dir="rtl">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <UsersTable />
            <ModelsTable />
            <OllamaServersTable />
          </div>
          <div className="space-y-6">
            <UserProfile />
            <div className="rounded-lg border bg-card p-6 text-right">
              <h2 className="font-semibold text-lg">
                {fa.admin.settings.title}
              </h2>
              <p className="text-muted-foreground text-sm">
                {fa.admin.settings.subtitle}
              </p>
            </div>
          </div>
        </section>

        <section>
          <SettingsPanel />
        </section>
      </div>
    </AdminLayout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { ModelsTable } from "@/components/admin/models-table";
import { OllamaServersTable } from "@/components/admin/ollama-servers-table";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { UsersTable } from "@/components/admin/users-table";
import AdminLayout from "@/layouts/admin";

export const Route = createFileRoute("/admin")({
  component: AdminRouteComponent,
});

function AdminRouteComponent() {
  return (
    <AdminLayout>
      <div className="space-y-8" dir="rtl">
        <section className="grid gap-6 lg:grid-cols-1">
          <UsersTable />
          <ModelsTable />
          <OllamaServersTable />
        </section>

        <section>
          <SettingsPanel />
        </section>
      </div>
    </AdminLayout>
  );
}

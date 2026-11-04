import { createFileRoute } from "@tanstack/react-router";
import { AdminGuard } from "@/components/admin/admin-guard";
import { ModelsTable } from "@/components/admin/models-table";
import { OllamaServersTable } from "@/components/admin/ollama-servers-table";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { UsersTable } from "@/components/admin/users-table";
import { ToolScaffold } from "@/components/scaffold/tool-scaffold";
import { ToolPageHeader } from "@/components/tool-page/tool-page";
import { fa } from "@/lib/texts";

export const Route = createFileRoute("/admin")({
  component: AdminRouteComponent,
});

function AdminRouteComponent() {
  return (
    <AdminGuard>
      <ToolScaffold
        content={
          <div className="mx-auto w-full min-w-0 max-w-6xl space-y-6">
            <ToolPageHeader
              description={fa.admin.subtitle}
              title={fa.admin.title}
            />
            <UsersTable />
            <ModelsTable />
            <OllamaServersTable />
            <SettingsPanel />
          </div>
        }
      />
    </AdminGuard>
  );
}

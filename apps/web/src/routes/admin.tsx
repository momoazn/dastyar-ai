import { createFileRoute } from "@tanstack/react-router";
import { ModelsTable } from "@/components/admin/models-table";
import { UsersTable } from "@/components/admin/users-table";
import { Card } from "@/components/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "@/layouts/admin";
import { fa } from "@/lib/persian-texts";

export const Route = createFileRoute("/admin")({
  component: AdminComponent,
});

function AdminComponent() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <Card className="p-6">
          <Tabs className="w-full" defaultValue="users">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger className="text-right" value="users">
                {fa.admin.users.title}
              </TabsTrigger>
              <TabsTrigger className="text-right" value="models">
                {fa.admin.models.title}
              </TabsTrigger>
            </TabsList>

            <TabsContent className="mt-6" value="users">
              <UsersTable />
            </TabsContent>

            <TabsContent className="mt-6" value="models">
              <ModelsTable />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </AdminLayout>
  );
}

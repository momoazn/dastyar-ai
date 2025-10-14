import { createFileRoute, Outlet } from "@tanstack/react-router";
import ProtectedLayout from "@/layouts/protected";

export const Route = createFileRoute("/image")({
  component: () => (
    <ProtectedLayout>
      <Outlet />
    </ProtectedLayout>
  ),
});

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminAuthProvider } from "@/features/admin/AdminAuth";

export const Route = createFileRoute("/admin")({
  component: () => (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  ),
  head: () => ({ meta: [{ title: "Admin · Majito Cake" }, { name: "robots", content: "noindex" }] }),
});
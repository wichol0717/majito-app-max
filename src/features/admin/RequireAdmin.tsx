import { Navigate } from "@tanstack/react-router";
import { useAdminAuth } from "./AdminAuth";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { password } = useAdminAuth();
  if (!password) return <Navigate to="/admin" />;
  return <>{children}</>;
}
import { createFileRoute, Outlet } from "@tanstack/react-router";

// ELIMINAMOS todo rastro de useEffect/useState aquí. 
// El layout debe ser rápido y directo.
export const Route = createFileRoute("/admin")({
  component: () => <Outlet />,
});
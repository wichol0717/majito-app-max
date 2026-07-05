import { Link } from "@tanstack/react-router";
import { Package, Users, Settings2, PartyPopper } from "lucide-react";
import { AdminShell } from "./AdminShell";

export function AdminDashboard() {
  return (
    <AdminShell title="Panel de administración">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card to="/admin/inventario" icon={<Package/>} title="Inventario" desc="Productos, stock y precios"/>
        <Card to="/admin/paquetes" icon={<PartyPopper/>} title="Paquetes eventos" desc="Repostería · Snacks fríos"/>
        <Card to="/admin/clientes" icon={<Users/>} title="Clientes" desc="CRM · recurrentes · promos"/>
        <Card to="/admin/configuracion" icon={<Settings2/>} title="Configuración" desc="WhatsApp · datos bancarios"/>
      </div>
    </AdminShell>
  );
}
function Card({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to as any} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-mocha/10 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-2 text-shocking">{icon}<span className="text-sm font-bold">{title}</span></div>
      <p className="mt-2 text-xs text-mocha">{desc}</p>
    </Link>
  );
}
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Package, Users, Settings2, PartyPopper, Truck, BarChart3 } from "lucide-react";
import { useAdminAuth } from "./AdminAuth";

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { setPassword } = useAdminAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-crema">
      <header className="border-b border-mocha/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/admin" className="text-lg font-bold text-shocking">Majito Admin</Link>
          <nav className="flex flex-wrap items-center gap-2 text-xs">
            <Link to="/admin/inventario" className="flex items-center gap-1 rounded-full px-3 py-1.5 hover:bg-sunset"><Package className="h-3.5 w-3.5"/>Inventario</Link>
            <Link to="/admin/pedidos" className="flex items-center gap-1 rounded-full px-3 py-1.5 hover:bg-sunset"><Truck className="h-3.5 w-3.5"/>Pedidos</Link>
            <Link to="/admin/paquetes" className="flex items-center gap-1 rounded-full px-3 py-1.5 hover:bg-sunset"><PartyPopper className="h-3.5 w-3.5"/>Paquetes</Link>
            <Link to="/admin/clientes" className="flex items-center gap-1 rounded-full px-3 py-1.5 hover:bg-sunset"><Users className="h-3.5 w-3.5"/>Clientes</Link>
            <Link to="/admin/reportes" className="flex items-center gap-1 rounded-full px-3 py-1.5 hover:bg-sunset"><BarChart3 className="h-3.5 w-3.5"/>Reportes</Link>
            <Link to="/admin/configuracion" className="flex items-center gap-1 rounded-full px-3 py-1.5 hover:bg-sunset"><Settings2 className="h-3.5 w-3.5"/>Configuración</Link>
            <button
              onClick={() => { setPassword(null); nav({ to: "/" }); }}
              className="flex items-center gap-1 rounded-full bg-shocking/10 px-3 py-1.5 text-shocking hover:bg-shocking/20"
            ><LogOut className="h-3.5 w-3.5"/>Salir</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-bold text-mocha">{title}</h1>
        {children}
      </main>
    </div>
  );
}
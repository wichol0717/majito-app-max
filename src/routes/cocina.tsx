// [Módulo: routes] -> [Archivo: cocina.tsx] -> [Acción: CREAR]
// KDS: monitor de producción "One-Thumb" para Majito.

import { createFileRoute, Link } from "@tanstack/react-router";
import { KitchenBoard } from "@/features/kitchen-kds/KitchenBoard";

export const Route = createFileRoute("/cocina")({
  component: CocinaPage,
  head: () => ({
    meta: [{ title: "Cocina KDS · Majito Cake" }],
  }),
});

function CocinaPage() {
  return (
    <main className="min-h-screen bg-crema pb-12">
      <header className="border-b border-mocha/20 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-sm font-medium text-mocha hover:text-shocking">
            ← Salir
          </Link>
          <h1 className="text-2xl font-bold text-shocking">Cocina Majito · KDS</h1>
          <span className="text-xs uppercase tracking-widest text-mocha">Kanban maestro</span>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 pt-8">
        <KitchenBoard />
      </div>
    </main>
  );
}
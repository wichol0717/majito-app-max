// [Módulo: components] -> [Archivo: PuertaShell.tsx] -> [Acción: CREAR]
// Cascarón visual reutilizable para las 4 puertas del cliente.

import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface Props {
  letra: "A" | "B" | "C" | "D";
  titulo: string;
  subtitulo: string;
  children: ReactNode;
}

export function PuertaShell({ letra, titulo, subtitulo, children }: Props) {
  return (
    <main className="min-h-screen bg-crema pb-16">
      <header className="border-b border-mocha/20 bg-sunset/50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-sm font-medium text-mocha hover:text-shocking">
            ← Majito Cake
          </Link>
          <span className="rounded-full bg-shocking/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-shocking">
            Ruta {letra}
          </span>
        </div>
        <div className="mx-auto max-w-4xl px-6 pb-8 pt-4">
          <h1 className="text-4xl font-bold text-shocking md:text-5xl">{titulo}</h1>
          <p className="mt-2 text-foreground/70">{subtitulo}</p>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 pt-8">{children}</div>
    </main>
  );
}
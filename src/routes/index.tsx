// [Módulo: routes] -> [Archivo: index.tsx] -> [Acción: REEMPLAZAR]
// Home Majito Cake — Las 4 Puertas (Mostrador / Personalizados / Eventos / Regalos).

import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

const puertas = [
  {
    to: "/mostrador",
    letra: "A",
    titulo: "Mostrador",
    sub: "Galletas y pasteles de línea",
    desc: "Elige, paga y llévatelo hoy mismo.",
    color: "bg-shocking text-white",
  },
  {
    to: "/personalizados",
    letra: "B",
    titulo: "Personalizados",
    sub: "El pastel de tus sueños",
    desc: "Sube tu foto de referencia y aparta con el 50%.",
    color: "bg-sweet-pink text-foreground",
  },
  {
    to: "/eventos",
    letra: "C",
    titulo: "El Carrito",
    sub: "En tu evento",
    desc: "Aparta tu fecha en el calendario, un evento por día.",
    color: "bg-mocha text-white",
  },
  {
    to: "/regalos",
    letra: "D",
    titulo: "Regalos",
    sub: "Detalles especiales",
    desc: "Catálogo listo para sorprender.",
    color: "bg-sunset text-foreground",
  },
] as const;

function Home() {
  return (
    <main className="min-h-screen bg-crema">
      <header className="mx-auto max-w-6xl px-6 pt-12 pb-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-mocha">Tuxpan, Veracruz</p>
        <h1 className="mt-3 text-5xl font-bold text-shocking md:text-7xl">
          Majito Cake
        </h1>
        <p className="mt-2 text-xl italic text-foreground/70">It's Max</p>
        <p className="mx-auto mt-6 max-w-xl text-base text-foreground/80">
          Repostería artesanal con cuatro caminos. Elige el tuyo.
        </p>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-6 pb-16 sm:grid-cols-2">
        {puertas.map((p) => (
          <Link
            key={p.to}
            to={p.to}
            className={`group flex min-h-[220px] flex-col justify-between rounded-3xl p-8 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg ${p.color}`}
          >
            <div className="flex items-start justify-between">
              <span className="text-6xl font-bold opacity-30">{p.letra}</span>
              <span className="rounded-full bg-white/25 px-3 py-1 text-xs uppercase tracking-widest backdrop-blur">
                Ruta {p.letra}
              </span>
            </div>
            <div>
              <h2 className="text-3xl font-bold">{p.titulo}</h2>
              <p className="mt-1 text-sm opacity-90">{p.sub}</p>
              <p className="mt-3 text-base opacity-95">{p.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      <footer className="border-t border-mocha/20 bg-sunset/40 py-6 text-center text-xs text-foreground/70">
        <p>Cero comisiones bancarias · Efectivo · SPEI · CoDi</p>
        <p className="mt-1">
          <Link to="/cocina" className="underline decoration-shocking underline-offset-4">
            Entrar a la cocina (KDS)
          </Link>
        </p>
      </footer>
    </main>
  );
}

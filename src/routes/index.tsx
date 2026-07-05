// [Módulo: routes] -> [Archivo: index.tsx] -> [Acción: REEMPLAZAR]
// Home Majito Cake — Las 4 Puertas (Mostrador / Personalizados / Eventos / Regalos).

import { createFileRoute, Link } from "@tanstack/react-router";
import manosPostre from "@/assets/manos-postre.jpg";
import tituloMajito from "@/assets/titulo_majito.svg.asset.json";
import { CounterStore } from "@/features/counter-store/CounterStore";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="min-h-screen bg-crema">
      <header className="mx-auto max-w-6xl px-6 pt-12 pb-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-mocha">Tuxpan, Veracruz</p>
        <h1 className="mt-3 flex justify-center">
          <img
            src={tituloMajito.url}
            alt="Majito Cake"
            width={908}
            height={381}
            className="h-auto w-full max-w-2xl"
          />
        </h1>
        <p className="mt-2 text-xl italic text-foreground/70">It's Max</p>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-6 pb-12 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <h2 className="text-3xl font-bold text-shocking md:text-4xl">{"\n"}</h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground/85">
            Detrás de Majito Cake hay un sueño que nació en el corazón de Tuxpan,
            Veracruz. Guiados por la frescura y la innovación de una joven promesa
            de la gastronomía, convertimos del arte de la repostería en{" "}
            una experiencia de amor y emociones a través nuestras creaciones.{" "}
          </p>
        </div>
        <div className="order-1 overflow-hidden rounded-3xl shadow-lg md:order-2">
          <img
            src={manosPostre}
            alt="Manos de repostera decorando un postre artesanal en Majito Cake"
            width={1536}
            height={1024}
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-3xl font-bold text-shocking md:text-4xl">Nuestros productos</h2>
          <Link to="/mostrador" className="text-sm font-semibold text-mocha underline decoration-shocking underline-offset-4">
            Ver mostrador completo →
          </Link>
        </div>
        <CounterStore />
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

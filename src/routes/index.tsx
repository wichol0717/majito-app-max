import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import manosPostre from "@/assets/manos-postre.jpg";
import { CounterStore } from "@/features/counter-store/CounterStore";
import { InstallPrompt } from "@/components/InstallPrompt";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="min-h-screen bg-crema">
      <header className="mx-auto max-w-6xl px-6 pt-12 pb-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-mocha">{"\n"}</p>
        <h1 className="mt-3 flex justify-center">
          <img
            src="/titulo_majito.svg"
            alt="Majito Cake"
            width={908}
            height={381}
            className="h-auto w-full max-w-2xl"
          />
        </h1>
        <p className="mt-2 text-xl italic text-foreground/70">{"\n"}</p>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-6 pb-12 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <h2 className="text-3xl font-bold text-shocking md:text-4xl">{"\n"}</h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground/85 text-justify hyphens-auto">
            Detrás de Majito hay un sueño que nació en el corazón de Tuxpan,
            Veracruz. Guiados por la frescura y la innovación de una joven promesa
            de la gastronomía, convertimos del arte de la repostería en una
            experiencia de amor y emociones a través nuestras creaciones.
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

      <section className="mx-auto max-w-6xl px-6 pb-12 flex justify-center">
        <OrderTracker />
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
        <p className="mt-1">
          <Link to="/admin" className="underline decoration-shocking underline-offset-4">
            Admin / Configuración
          </Link>
        </p>
      </footer>
      <InstallPrompt />
    </main>
  );
}

function OrderTracker() {
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const userInput = reference.trim().toUpperCase();
    if (!userInput) {
      setError("Por favor ingresa una referencia.");
      return;
    }

    setLoading(true);

    const { data: allData, error: fetchError } = await supabase
      .from("counter_orders")
      .select("*");

    console.log("Error de conexión:", fetchError);
    console.log("Registros totales en counter_orders:", allData);

    const { data: counterData } = await supabase
      .from("counter_orders")
      .select("id")
      .ilike("payment_reference", userInput)
      .maybeSingle();

    if (counterData?.id) {
      window.location.href = `/pedido/${counterData.id}`;
      return;
    }

    const { data: giftData } = await supabase
      .from("gift_orders")
      .select("id")
      .ilike("payment_reference", userInput)
      .maybeSingle();

    if (giftData?.id) {
      window.location.href = `/regalo/${giftData.id}`;
      return;
    }

    setLoading(false);
    setError("No se encontró el pedido. Revisa la consola (F12).");
  }

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow ring-1 ring-mocha/10 text-center">
      <h2 className="text-xl font-bold text-shocking mb-2">¿Dónde está mi pedido? 🍰</h2>
      <p className="text-xs text-mocha mb-4">Ingresa la referencia de tu compra para ver tu semáforo.</p>
      <form onSubmit={handleSearch} className="space-y-3">
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Ej: MAJITO-EWGK"
          className="w-full rounded-lg border border-mocha/20 px-4 py-3 text-center text-base font-mono uppercase outline-none focus:border-shocking"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-full bg-shocking py-3 text-sm font-bold text-white disabled:opacity-60 active:scale-[0.98]"
        >
          {loading ? "Buscando..." : "Buscar Pedido"}
        </button>
      </form>
    </div>
  );
}
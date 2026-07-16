import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import manosPostre from "@/assets/manos-postre.jpg";
import { CounterStore } from "@/features/counter-store/CounterStore";
import { InstallPrompt } from "@/components/InstallPrompt";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState("");

  const handleAccess = () => {
    if (password === "majito2005") {
      setIsModalOpen(false);
      setPassword("");
      navigate({ to: "/admin/inventario" });
    } else {
      alert("Contraseña incorrecta");
    }
  };

  return (
    <main className="min-h-screen bg-crema">
      {/* --- MODAL DE ACCESO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-crema p-8 shadow-2xl border-2 border-mocha/20">
            <h3 className="text-2xl font-bold text-shocking mb-4 text-center">Acceso Privado</h3>
            <p className="text-sm text-mocha/80 mb-6 text-center">Ingresa la clave para continuar</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-mocha/30 bg-white p-3 mb-6 focus:outline-none focus:ring-2 focus:ring-shocking"
              placeholder="Contraseña"
              onKeyDown={(e) => e.key === "Enter" && handleAccess()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-xl bg-gray-100 py-3 font-semibold text-gray-600 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleAccess}
                className="flex-1 rounded-xl bg-shocking py-3 font-semibold text-white hover:opacity-90"
              >
                Acceder
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="mx-auto max-w-6xl px-6 pt-12 pb-8 text-center">
        <h1 className="mt-3 flex justify-center">
          <img
            src="/titulo_majito.png"
            alt="Majito Cake"
            width={908}
            height={381}
            className="h-auto w-full max-w-2xl"
          />
        </h1>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-6 pb-6 md:grid-cols-2">
        <div className="order-2 md:order-1">
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

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-6 flex flex-col items-center justify-center gap-4">
          <h2 className="text-3xl font-serif italic font-bold text-shocking md:text-4xl">Nuestros productos</h2>
          <Link
            to="/rastreo"
            className="flex items-center gap-2 text-xl font-bold text-orange-600 underline decoration-orange-600 underline-offset-4 hover:text-orange-700 transition-colors"
          >
            <img src="/rastreo.png" alt="Icono" className="w-8 h-8 object-contain" />
            Busca tu pedido
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
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="underline decoration-shocking underline-offset-4 text-xs"
          >
            Admin / Configuración
          </button>
        </p>
      </footer>
      <InstallPrompt />
    </main>
  );
}
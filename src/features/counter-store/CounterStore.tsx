// [Módulo: features/counter-store] -> [Archivo: CounterStore.tsx] -> [Acción: CREAR]
// Ruta A: Catálogo de mostrador con stock vivo (esqueleto v1).

import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, Cake, PartyPopper } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/api/supabase";
import { CartProvider, type Product, useCart } from "./CartContext";
import { ProductCard } from "./ProductCard";
import { GiftModal } from "./GiftModal";
import { CartPanel } from "./CartPanel";

const CATEGORY_ICONS: Record<string, string> = {
  Galletas: "/galletas.svg",
  Cupcakes: "/cupcakes.svg",
  Pasteles: "/pasteles.svg",
  Brownies: "/brownies.svg",
};

const CARRITO_EVENTOS_ICON = "/carrito_eventos.png";

// Categorías fijas del mostrador — siempre visibles como iconos,
// aunque todavía no haya productos cargados en esa categoría.
const CATEGORIAS_FIJAS = ["Galletas", "Cupcakes", "Pasteles", "Brownies"];
const CATEGORIA_INICIAL = "Galletas";

function CounterStoreInner() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState<string>(CATEGORIA_INICIAL);
  const [giftProduct, setGiftProduct] = useState<Product | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const { totalItems } = useCart();

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("activo", "SI")
      .order("categoria")
      .then(({ data, error }) => {
        if (error) {
          setError("Oye Majito, no pudimos leer el catálogo (" + error.message + ").");
        } else {
          setProducts(data ?? []);
        }
        setLoading(false);
      });
  }, []);

  const categorias = useMemo(() => {
    const set = new Set<string>(CATEGORIAS_FIJAS);
    products.forEach((p) => {
      const cat = p.categoria?.toLowerCase();
      // Velas se maneja como upsell (regalo/complemento), no como pestaña.
      if (
        p.categoria &&
        cat !== "paquetes" &&
        cat !== "promociones" &&
        cat !== "velas"
      ) {
        set.add(p.categoria);
      }
    });
    const extras = Array.from(set)
      .filter((c) => !CATEGORIAS_FIJAS.includes(c))
      .sort();
    return [...CATEGORIAS_FIJAS, ...extras];
  }, [products]);

  useEffect(() => {
    if (categorias.length && !categorias.includes(categoria)) {
      setCategoria(categorias.includes(CATEGORIA_INICIAL) ? CATEGORIA_INICIAL : categorias[0]);
    }
  }, [categorias, categoria]);

  const visibles = products.filter((p) => p.categoria === categoria);

  if (loading) return <p className="text-mocha">Cargando el mostrador…</p>;
  if (error)
    return (
      <div className="rounded-2xl border border-shocking/30 bg-shocking/10 p-5 text-sm text-shocking">
        {error}
      </div>
    );

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
      <div>
        <div className="mb-5 flex flex-wrap gap-2">
          {categorias.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoria(c)}
              aria-label={c}
              title={c}
              className={`inline-flex items-center justify-center rounded-full p-1 transition ${
                categoria === c
                  ? "ring-2 ring-shocking scale-105"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              {CATEGORY_ICONS[c] ? (
                <img src={CATEGORY_ICONS[c]} alt={c} className="h-16 w-16" />
              ) : (
                <span className="px-3 py-2 text-sm font-semibold text-mocha">{c}</span>
              )}
            </button>
          ))}
          <Link
            to="/eventos"
            aria-label="Carrito de eventos"
            title="Carrito de eventos"
            className="inline-flex items-center justify-center rounded-full p-1 opacity-70 transition hover:opacity-100"
          >
            <img src={CARRITO_EVENTOS_ICON} alt="Carrito de eventos" className="h-16 w-16" />
          </Link>
        </div>

        {visibles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-mocha/40 bg-white p-8 text-center text-mocha">
            No hay productos activos en esta categoría.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {visibles.map((p) => (
              <ProductCard key={p.id} product={p} onGiftClick={setGiftProduct} />
            ))}
          </div>
        )}
      </div>

      <div className={`md:sticky md:top-4 md:self-start ${mobileCartOpen ? "block" : "hidden md:block"}`}>
        <CartPanel />
      </div>

      <div className="fixed inset-x-4 bottom-4 z-40 flex items-center gap-2 overflow-hidden rounded-full border border-orange-300/30 bg-[rgba(255,138,42,0.14)] px-3 py-3 shadow-[0_10px_40px_-10px_rgba(255,138,42,0.5)] backdrop-blur-xl md:hidden">
        <span aria-hidden className="pointer-events-none absolute -left-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-orange-400/30 blur-3xl animate-pulse" />
        <span aria-hidden className="pointer-events-none absolute -right-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-orange-500/20 blur-3xl animate-pulse [animation-delay:600ms]" />
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-orange-200/20 to-transparent blur-md" />
        <Link
          to="/personalizados"
          className="relative flex flex-1 items-center justify-center gap-1.5 rounded-full bg-sweet-pink/90 px-3 py-2 text-xs font-bold text-foreground shadow-sm transition hover:-translate-y-0.5"
          aria-label="Pasteles personalizados"
        >
          <Cake className="h-4 w-4" />
          <span className="hidden xs:inline sm:inline">Personalizados</span>
        </Link>
        <Link
          to="/eventos"
          className="relative flex flex-1 items-center justify-center gap-1.5 rounded-full bg-mocha/90 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5"
          aria-label="Carrito de eventos"
        >
          <PartyPopper className="h-4 w-4" />
          <span className="hidden xs:inline sm:inline">Eventos</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileCartOpen((v) => !v)}
          className="relative flex flex-1 items-center justify-center gap-1.5 rounded-full bg-shocking px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Carrito{totalItems > 0 && ` (${totalItems})`}</span>
        </button>
      </div>

      <GiftModal product={giftProduct} onClose={() => setGiftProduct(null)} />
    </div>
  );
}

export function CounterStore() {
  return (
    <CartProvider>
      <CounterStoreInner />
    </CartProvider>
  );
}
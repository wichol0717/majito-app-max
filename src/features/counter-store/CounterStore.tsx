// [Módulo: features/counter-store] -> [Archivo: CounterStore.tsx] -> [Acción: CREAR]
// Ruta A: Catálogo de mostrador con stock vivo (esqueleto v1).

import { useEffect, useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { supabase } from "@/api/supabase";
import { CartProvider, type Product, useCart } from "./CartContext";
import { ProductCard } from "./ProductCard";
import { GiftModal } from "./GiftModal";
import { CartPanel } from "./CartPanel";

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
    const set = new Set<string>();
    products.forEach((p) => p.categoria && set.add(p.categoria));
    return Array.from(set).sort();
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
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                categoria === c
                  ? "bg-shocking text-white shadow"
                  : "bg-white text-mocha ring-1 ring-mocha/20 hover:bg-sunset"
              }`}
            >
              {c}
            </button>
          ))}
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

      <button
        type="button"
        onClick={() => setMobileCartOpen((v) => !v)}
        className="group fixed inset-x-4 bottom-4 z-40 flex items-center justify-center gap-2 overflow-hidden rounded-full border border-orange-300/30 bg-[rgba(255,138,42,0.14)] px-6 py-4 text-sm font-bold text-orange-900 shadow-[0_10px_40px_-10px_rgba(255,138,42,0.5)] backdrop-blur-xl transition hover:bg-[rgba(255,138,42,0.22)] md:hidden"
      >
        <span aria-hidden className="pointer-events-none absolute -left-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-orange-400/30 blur-3xl animate-pulse" />
        <span aria-hidden className="pointer-events-none absolute -right-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-orange-500/20 blur-3xl animate-pulse [animation-delay:600ms]" />
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-orange-200/20 to-transparent blur-md" />
        <ShoppingBag className="h-4 w-4" />
        Carrito {totalItems > 0 && `(${totalItems})`}
      </button>

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
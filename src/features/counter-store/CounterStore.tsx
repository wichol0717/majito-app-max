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
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibles.map((p) => (
              <ProductCard key={p.id} product={p} onGiftClick={setGiftProduct} />
            ))}
          </div>
        )}
      </div>

      <div className={`lg:sticky lg:top-4 lg:self-start ${mobileCartOpen ? "block" : "hidden lg:block"}`}>
        <CartPanel />
      </div>

      <button
        type="button"
        onClick={() => setMobileCartOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-shocking px-5 py-3 text-sm font-bold text-white shadow-2xl lg:hidden"
      >
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
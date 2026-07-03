// [Módulo: features/counter-store] -> [Archivo: CounterStore.tsx] -> [Acción: CREAR]
// Ruta A: Catálogo de mostrador con stock vivo (esqueleto v1).

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/api/supabase";
import type { Database } from "@/api/database.types";

type Product = Database["public"]["Tables"]["products"]["Row"];

export function CounterStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError("Oye Majito, faltan las llaves de Supabase para ver el mostrador.");
      setLoading(false);
      return;
    }
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name")
      .then(({ data, error }) => {
        if (error) {
          setError("Oye Majito, no pudimos leer el catálogo. Intenta de nuevo.");
        } else {
          setProducts(data ?? []);
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-mocha">Cargando el mostrador…</p>;
  if (error)
    return (
      <div className="rounded-2xl border border-shocking/30 bg-shocking/10 p-5 text-sm text-shocking">
        {error}
      </div>
    );

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-mocha/40 bg-white p-8 text-center text-mocha">
        Aún no hay productos en el mostrador. Agrega el primero desde el panel de Supabase.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {products.map((p) => (
        <article
          key={p.id}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-mocha/10"
        >
          <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
          <p className="mt-1 text-2xl font-bold text-shocking">
            ${Number(p.price).toFixed(2)}
          </p>
          <p className="mt-2 text-xs uppercase tracking-widest text-mocha">
            {p.stock_count > 0 ? `${p.stock_count} disponibles` : "Agotado"}
          </p>
        </article>
      ))}
    </div>
  );
}
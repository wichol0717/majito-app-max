// [Módulo: features/counter-store] -> [Archivo: CounterStore.tsx] -> [Acción: CREAR]
// Ruta A: Catálogo de mostrador con stock vivo (esqueleto v1).

import { useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/api/supabase";
import type { Database } from "@/api/database.types";

type Product = Database["public"]["Tables"]["products"]["Row"];

export function CounterStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoria, setCategoria] = useState<string>("Todos");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError("Oye Majito, faltan las llaves de Supabase para ver el mostrador.");
      setLoading(false);
      return;
    }
    supabase
      .from("products")
      .select("*")
      .eq("activo", "SI")
      .order("categoria")
      .then(({ data, error }) => {
        if (error) {
          setError(
            "Oye Majito, no pudimos leer el catálogo (" + error.message + "). Intenta de nuevo.",
          );
        } else {
          setProducts(data ?? []);
        }
        setLoading(false);
      });
  }, []);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.categoria && set.add(p.categoria));
    return ["Todos", ...Array.from(set).sort()];
  }, [products]);

  const visibles = categoria === "Todos" ? products : products.filter((p) => p.categoria === categoria);

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((p) => (
          <article
            key={p.id}
            className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-mocha/10 transition hover:-translate-y-1 hover:shadow-md"
          >
            {p.img ? (
              <img
                src={p.img}
                alt={p.nombre}
                loading="lazy"
                className="h-44 w-full object-cover"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
              />
            ) : (
              <div className="flex h-44 items-center justify-center bg-sunset text-4xl">🍰</div>
            )}
            <div className="flex flex-1 flex-col p-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-mocha">
                {p.categoria ?? "Sin categoría"}
              </span>
              <h3 className="mt-1 text-lg font-semibold text-foreground">{p.nombre}</h3>
              {p.descripcion && (
                <p className="mt-1 line-clamp-2 text-sm text-foreground/70">{p.descripcion}</p>
              )}
              <p className="mt-auto pt-3 text-2xl font-bold text-shocking">
                ${Number(p.precio).toFixed(2)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
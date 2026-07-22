import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AdminShell } from "@/features/admin/AdminShell";

// =========================================================
// INSTANCIA DIRECTA DE SUPABASE
// =========================================================
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://jntrxjvntiwrmjzsxona.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpudHJ4anZudGl3cm1qenN4b25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDA0MDA0MDAsImV4cCI6MjAxNTk3NjQwMH0.placeholder";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =========================================================
// INTERFACES
// =========================================================
interface ProductVariant {
  id: number;
  product_id: number;
  nombre: string;
  precio: number;
  stock: number;
  porciones?: string;
}

interface Product {
  id: number;
  nombre: string;
  categoria?: string;
  precio: number;
  stock: number;
  activo?: string | boolean;
  img?: string;
  variants?: ProductVariant[];
}

export const Route = createFileRoute("/admin/inventario")({
  component: () => <Inventario />,
});

function Inventario() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<string | number | null>(null);

  useEffect(() => {
    cargarInventario();
  }, []);

  async function cargarInventario() {
    setLoading(true);
    try {
      // 1. Obtener productos
      const { data: prods, error: pErr } = await supabase
        .from("products")
        .select("*")
        .order("nombre");

      if (pErr) throw pErr;

      // 2. Obtener variantes
      const { data: vars, error: vErr } = await supabase
        .from("product_variants")
        .select("*");

      if (vErr) throw vErr;

      // 3. Vincular variantes a cada producto
      const unificados = (prods || []).map((p: any) => {
        const misVariantes = (vars || []).filter((v: ProductVariant) => v.product_id === p.id);
        return {
          ...p,
          variants: misVariantes,
        };
      });

      setProducts(unificados);
    } catch (e) {
      console.error("Error al cargar inventario:", e);
    } finally {
      setLoading(false);
    }
  }

  // Alternar vista desplegable de tamaños
  const toggleExpand = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // Manejo de cambios en variantes
  const handleVariantChange = (
    productId: number,
    variantId: number,
    field: "stock" | "precio",
    value: number
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const nuevasVariantes = (p.variants || []).map((v) =>
          v.id === variantId ? { ...v, [field]: value } : v
        );
        return { ...p, variants: nuevasVariantes };
      })
    );
  };

  // Guardar variante en Supabase
  async function guardarVariante(variant: ProductVariant) {
    setSavingId(`var-${variant.id}`);
    const { error } = await supabase
      .from("product_variants")
      .update({ stock: variant.stock, precio: variant.precio })
      .eq("id", variant.id);

    setSavingId(null);
    if (error) {
      alert("Error al actualizar la variante: " + error.message);
    } else {
      alert(`Variante "${variant.nombre}" actualizada.`);
    }
  }

  // Guardar producto simple (sin variantes)
  async function guardarProductoSimple(product: Product) {
    setSavingId(`prod-${product.id}`);
    const { error } = await supabase
      .from("products")
      .update({ stock: product.stock, precio: product.precio })
      .eq("id", product.id);

    setSavingId(null);
    if (error) {
      alert("Error al actualizar el producto: " + error.message);
    } else {
      alert(`Producto "${product.nombre}" actualizado.`);
    }
  }

  return (
    <AdminShell title="Gestión de Inventario">
      <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-mocha/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-shocking">📦 Control de Stock y Precios</h3>
          <button
            onClick={cargarInventario}
            className="rounded-full bg-crema px-3 py-1 text-xs font-bold text-mocha hover:bg-mocha/10"
          >
            🔄 Refrescar
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-mocha">Cargando inventario...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-mocha">
              <thead className="bg-crema/40 text-xs uppercase font-bold text-mocha border-b border-mocha/10">
                <tr>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3 text-center">Variantes / Tamaños</th>
                  <th className="p-3 text-center">Stock Total</th>
                  <th className="p-3 text-right">Precio Base</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mocha/10">
                {products.map((p) => {
                  const tieneVariantes = p.variants && p.variants.length > 0;
                  const stockTotal = tieneVariantes
                    ? p.variants!.reduce((acc, v) => acc + (v.stock || 0), 0)
                    : p.stock || 0;

                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-crema/10 transition">
                        <td className="p-3 font-bold flex items-center gap-2">
                          {p.img && (
                            <img
                              src={p.img}
                              alt={p.nombre}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                          )}
                          <span>{p.nombre}</span>
                        </td>
                        <td className="p-3">
                          <span className="rounded-full bg-mocha/10 px-2 py-0.5 text-[10px] font-semibold">
                            {p.categoria || "General"}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {tieneVariantes ? (
                            <button
                              onClick={() => toggleExpand(p.id)}
                              className="rounded-lg bg-shocking/10 px-2.5 py-1 text-xs font-bold text-shocking hover:bg-shocking/20 transition"
                            >
                              {expandedRow === p.id ? "▲ Ocultar Tamaños" : `▼ Desglosar (${p.variants!.length})`}
                            </button>
                          ) : (
                            <span className="text-mocha/50 italic">Sin variantes</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              stockTotal <= 3 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                            }`}
                          >
                            {stockTotal} un.
                          </span>
                        </td>
                        <td className="p-3 text-right font-semibold">
                          ${p.precio || 0}
                        </td>
                        <td className="p-3 text-center">
                          {!tieneVariantes && (
                            <button
                              onClick={() => guardarProductoSimple(p)}
                              disabled={savingId === `prod-${p.id}`}
                              className="rounded-full bg-shocking px-3 py-1 text-[11px] font-bold text-white hover:opacity-90 disabled:opacity-50"
                            >
                              {savingId === `prod-${p.id}` ? "Guardando..." : "Guardar"}
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* SUB-TABLA DE VARIANTES (TAMAÑOS) */}
                      {tieneVariantes && expandedRow === p.id && (
                        <tr>
                          <td colSpan={6} className="bg-crema/20 p-4 border-l-4 border-shocking">
                            <div className="font-bold text-shocking mb-2 text-xs">
                              📏 Gestión de Stock y Precios por Tamaño para "{p.nombre}"
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {p.variants!.map((v) => (
                                <div
                                  key={v.id}
                                  className="bg-white p-3 rounded-xl shadow-sm border border-mocha/10 space-y-2"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-mocha uppercase text-xs">
                                      {v.nombre}
                                    </span>
                                    <span className="text-[10px] text-mocha/60">
                                      {v.porciones}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] text-mocha/70 font-semibold">
                                        Precio ($)
                                      </label>
                                      <input
                                        type="number"
                                        value={v.precio}
                                        onChange={(e) =>
                                          handleVariantChange(p.id, v.id, "precio", Number(e.target.value))
                                        }
                                        className="w-full rounded border border-mocha/20 px-2 py-1 text-xs font-bold"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-mocha/70 font-semibold">
                                        Stock (un.)
                                      </label>
                                      <input
                                        type="number"
                                        value={v.stock}
                                        onChange={(e) =>
                                          handleVariantChange(p.id, v.id, "stock", Number(e.target.value))
                                        }
                                        className="w-full rounded border border-mocha/20 px-2 py-1 text-xs font-bold"
                                      />
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => guardarVariante(v)}
                                    disabled={savingId === `var-${v.id}`}
                                    className="w-full mt-1 rounded-lg bg-mocha px-2 py-1 text-[10px] font-bold text-white hover:bg-mocha/90 disabled:opacity-50"
                                  >
                                    {savingId === `var-${v.id}` ? "Guardando..." : "Guardar Tamaño"}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
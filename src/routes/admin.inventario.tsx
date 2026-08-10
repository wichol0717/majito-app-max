import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/AdminShell";
import { supabase } from "@/api/supabase";

// =========================================================
// INTERFACES
// =========================================================
interface ProductVariant {
  id?: number;
  product_id: number;
  nombre: string;
  precio: number;
  stock: number;
  porciones?: string;
}

interface Product {
  id: number;
  nombre: string;
  categoria?: string | null;
  precio: number;
  stock: number;
  activo?: string | boolean | null | number;
  img?: string | null;
  variants?: ProductVariant[];
}

// Tamaños estándar predefinidos para los pasteles
const TAMAÑOS_ESTANDAR_PASTELES = [
  { nombre: "Individual", porciones: "Pequeño / 1-2 pers." },
  { nombre: "Mediano", porciones: "6 a 8 personas" },
  { nombre: "Grande", porciones: "15 a 20 personas" },
];

// =========================================================
// FUNCIÓN PARA ORDENAR POR CATEGORÍA
// =========================================================
function obtenerPrioridadCategoria(cat?: string | null): number {
  if (!cat) return 999;
  const c = cat.toLowerCase().trim();

  if (c.startsWith("pastel")) return 0;
  if (c === "galletas" || c === "galleta") return 1;
  if (c === "brownies" || c === "brownie") return 2;
  if (c.includes("caja") && c.includes("galleta")) return 4;
  if (c.includes("caja") && c.includes("brownie")) return 5;
  if (c.includes("caja") && (c.includes("cupcake") || c.includes("cup cake"))) return 6;
  if (c.includes("cup cake") || c.includes("cupcake")) return 3;
  if (c.includes("promocion") || c.includes("promociones")) return 7;
  if (c.includes("vela")) return 8;

  return 999;
}

export const Route = createFileRoute("/admin/inventario")({
  component: () => <Inventario />,
});

function Inventario() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<string | number | null>(null);

  // Estado local temporal para los inputs de los tamaños estándar por producto
  const [variantInputs, setVariantInputs] = useState<Record<string, { precio: number; stock: number }>>({});

  useEffect(() => {
    cargarInventario();
  }, []);

  async function cargarInventario() {
    setLoading(true);
    try {
      const { data: prods, error: pErr } = await supabase.from("products").select("*");
      if (pErr) throw pErr;

      const { data: vars, error: vErr } = await (supabase as any).from("product_variants").select("*");
      if (vErr) throw vErr;

      const variantesLista = (vars || []) as ProductVariant[];

      const unificados = (prods || []).map((p: any) => {
        const misVariantes = variantesLista.filter(
          (v: ProductVariant) => String(v.product_id) === String(p.id)
        );
        return {
          ...p,
          variants: misVariantes,
        };
      });

      unificados.sort((a: Product, b: Product) => {
        const prioA = obtenerPrioridadCategoria(a.categoria);
        const prioB = obtenerPrioridadCategoria(b.categoria);
        if (prioA !== prioB) return prioA - prioB;
        return (a.nombre || "").localeCompare(b.nombre || "");
      });

      setProducts(unificados);

      const initialInputs: Record<string, { precio: number; stock: number }> = {};
      unificados.forEach((p) => {
        TAMAÑOS_ESTANDAR_PASTELES.forEach((est) => {
          const encontrada = p.variants?.find(
            (v: ProductVariant) => v.nombre.toLowerCase() === est.nombre.toLowerCase()
          );
          initialInputs[`${p.id}-${est.nombre}`] = {
            precio: encontrada ? encontrada.precio : 0,
            stock: encontrada ? encontrada.stock : 0,
          };
        });
      });
      setVariantInputs(initialInputs);

    } catch (e) {
      console.error("Error al cargar inventario:", e);
    } finally {
      setLoading(false);
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleProductChange = (productId: number, field: "stock" | "precio", value: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, [field]: value } : p))
    );
  };

  const handleVariantInputChange = (productId: number, nombreTamaño: string, field: "precio" | "stock", value: number) => {
    const key = `${productId}-${nombreTamaño}`;
    setVariantInputs((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { precio: 0, stock: 0 }),
        [field]: value,
      },
    }));
  };

  async function toggleActivo(product: Product) {
    const isCurrentlyActive = product.activo !== false && product.activo !== "false" && product.activo !== 0;
    const nuevoEstado = !isCurrentlyActive;

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, activo: nuevoEstado } : p))
    );

    const { error } = await (supabase as any)
      .from("products")
      .update({ activo: nuevoEstado })
      .eq("id", product.id);

    if (error) {
      alert("Error al cambiar estado: " + error.message);
      cargarInventario();
    }
  }

  async function guardarProductoSimple(product: Product) {
    setSavingId(`prod-${product.id}`);
    const { error } = await supabase
      .from("products")
      .update({ stock: product.stock, precio: product.precio ?? 0 })
      .eq("id", product.id);

    setSavingId(null);
    if (error) {
      alert("Error al actualizar el producto: " + error.message);
    } else {
      alert(`Producto "${product.nombre}" actualizado.`);
    }
  }

  async function guardarVarianteEstandar(product: Product, nombreTamaño: string, porcionesDef: string) {
    const key = `${product.id}-${nombreTamaño}`;
    const datosInput = variantInputs[key] || { precio: 0, stock: 0 };

    if (!datosInput.precio || datosInput.precio <= 0) {
      alert("Por favor ingresa un precio válido mayor a 0.");
      return;
    }

    setSavingId(`var-${product.id}-${nombreTamaño}`);

    const existente = product.variants?.find(
      (v: ProductVariant) => v.nombre.toLowerCase() === nombreTamaño.toLowerCase()
    );

    let errorSupabase = null;

    if (existente && existente.id) {
      const { error } = await (supabase as any)
        .from("product_variants")
        .update({
          precio: datosInput.precio,
          stock: datosInput.stock,
          porciones: porcionesDef,
        })
        .eq("id", existente.id);
      errorSupabase = error;
    } else {
      const { error } = await (supabase as any)
        .from("product_variants")
        .insert([
          {
            product_id: product.id,
            nombre: nombreTamaño,
            precio: datosInput.precio,
            stock: datosInput.stock,
            porciones: porcionesDef,
          },
        ]);
      errorSupabase = error;
    }

    setSavingId(null);

    if (errorSupabase) {
      alert("Error al guardar la variante: " + errorSupabase.message);
    } else {
      alert(`Tamaño "${nombreTamaño}" guardado con éxito para ${product.nombre}.`);
      cargarInventario();
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
            <table className="w-full text-left text-xs text-mocha border-collapse">
              <thead className="bg-crema/40 text-xs uppercase font-bold text-mocha border-b border-mocha/10">
                <tr>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3 text-center">Variantes / Tamaños</th>
                  <th className="p-3 text-center">Stock</th>
                  <th className="p-3 text-right">Precio ($)</th>
                  <th className="p-3 text-center">Estado (On/Off)</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mocha/10">
                {products.map((p) => {
                  const tieneVariantes = p.variants && p.variants.length > 0;
                  const stockTotal = tieneVariantes
                    ? p.variants!.reduce((acc, v) => acc + (v.stock || 0), 0)
                    : p.stock || 0;

                  const estaActivo = p.activo !== false && p.activo !== "false" && p.activo !== 0;
                  const esPastel = p.categoria?.toLowerCase().includes("pastel");

                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-crema/10 transition">
                        <td className="p-3 font-bold flex items-center gap-2">
                          {p.img && (
                            <img src={p.img} alt={p.nombre} className="w-8 h-8 rounded-lg object-cover" />
                          )}
                          <span>{p.nombre}</span>
                        </td>

                        <td className="p-3">
                          <span className="rounded-full bg-mocha/10 px-2 py-0.5 text-[10px] font-semibold">
                            {p.categoria || "General"}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          {tieneVariantes || esPastel ? (
                            <button
                              onClick={() => toggleExpand(p.id)}
                              className="rounded-lg bg-shocking/10 px-2.5 py-1 text-xs font-bold text-shocking hover:bg-shocking/20 transition"
                            >
                              {expandedRow === p.id
                                ? "▲ Ocultar Tamaños"
                                : tieneVariantes
                                ? `▼ Desglosar (${p.variants!.length} tamaños)`
                                : "➕ Configurar Tamaños"}
                            </button>
                          ) : (
                            <span className="text-mocha/50 italic">Sin variantes</span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          {tieneVariantes ? (
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold ${
                                stockTotal <= 3 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"
                              }`}
                            >
                              {stockTotal} un.
                            </span>
                          ) : (
                            <input
                              type="number"
                              value={p.stock ?? 0}
                              onChange={(e) => handleProductChange(p.id, "stock", Number(e.target.value))}
                              className="w-20 rounded border border-mocha/20 px-2 py-1 text-center font-bold text-mocha focus:ring-2 focus:ring-shocking"
                            />
                          )}
                        </td>

                        <td className="p-3 text-right">
                          {tieneVariantes ? (
                            <span className="font-semibold">Variable</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-mocha/60">$</span>
                              <input
                                type="number"
                                value={p.precio ?? 0}
                                onChange={(e) => handleProductChange(p.id, "precio", Number(e.target.value))}
                                className="w-20 rounded border border-mocha/20 px-2 py-1 text-right font-bold text-mocha focus:ring-2 focus:ring-shocking"
                              />
                            </div>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          <button
                            onClick={() => toggleActivo(p)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition shadow-sm ${
                              estaActivo
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                            }`}
                          >
                            {estaActivo ? "🟢 Activo" : "⚪ Inactivo"}
                          </button>
                        </td>

                        <td className="p-3 text-center">
                          {!tieneVariantes && !esPastel && (
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

                      {expandedRow === p.id && esPastel && (
                        <tr>
                          <td colSpan={7} className="bg-crema/20 p-4 border-l-4 border-shocking">
                            <div className="font-bold text-shocking mb-3 text-xs flex items-center justify-between">
                              <span>🎂 Tamaños Oficiales para "{p.nombre}" (Sincronizados con la tienda)</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {TAMAÑOS_ESTANDAR_PASTELES.map((est) => {
                                const inputKey = `${p.id}-${est.nombre}`;
                                const currentVals = variantInputs[inputKey] || { precio: 0, stock: 0 };
                                const isSaving = savingId === `var-${p.id}-${est.nombre}`;

                                return (
                                  <div
                                    key={est.nombre}
                                    className="bg-white p-3 rounded-xl shadow-sm border border-mocha/10 space-y-2"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-mocha uppercase text-xs bg-cream px-2 py-0.5 rounded">
                                        {est.nombre}
                                      </span>
                                      <span className="text-[10px] text-mocha/60 font-medium">
                                        {est.porciones}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-[10px] text-mocha/70 font-semibold">
                                          Precio ($)
                                        </label>
                                        <input
                                          type="number"
                                          placeholder="Ej. 150"
                                          value={currentVals.precio || ""}
                                          onChange={(e) =>
                                            handleVariantInputChange(p.id, est.nombre, "precio", Number(e.target.value))
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
                                          placeholder="0"
                                          value={currentVals.stock ?? ""}
                                          onChange={(e) =>
                                            handleVariantInputChange(p.id, est.nombre, "stock", Number(e.target.value))
                                          }
                                          className="w-full rounded border border-mocha/20 px-2 py-1 text-xs font-bold"
                                        />
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => guardarVarianteEstandar(p, est.nombre, est.porciones)}
                                      disabled={isSaving}
                                      className="w-full mt-1 rounded-lg bg-mocha px-2 py-1.5 text-[11px] font-bold text-white hover:bg-mocha/90 disabled:opacity-50 transition"
                                    >
                                      {isSaving ? "Guardando..." : `Guardar ${est.nombre}`}
                                    </button>
                                  </div>
                                );
                              })}
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
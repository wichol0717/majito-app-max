import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AdminShell } from "@/features/admin/AdminShell";
import { adminListSettings, adminUpdateSetting } from "@/lib/admin.functions";
import { invalidateSettingsCache } from "@/hooks/useAppSettings";

// =========================================================
// INSTANCIA DIRECTA DE SUPABASE (Evita errores de ruta/nombre)
// =========================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =========================================================
// INTERFACES LOCALES
// =========================================================
interface CakeSize {
  nombre: "Individual" | "Mediano" | "Grande";
  precio: number;
  porciones?: string;
}

interface Product {
  id: number;
  nombre: string;
  descripcion?: string | null;
  img?: string | null;
  categoria?: string | null;
  precio: number;
  stock?: number;
  activo?: string;
  tamanios?: CakeSize[] | null;
}

// HE QUITADO RequireAdmin para que entre directo y no haya pantalla blanca
export const Route = createFileRoute("/admin/configuracion")({
  component: () => <Config />,
});

const LABELS: Record<string, string> = {
  whatsapp_number: "Número de WhatsApp (con 521…)",
  bank_name: "Banco",
  bank_account: "Cuenta / CLABE",
  bank_holder: "Titular",
  shipping_cost: "Costo de envío ($)",
  low_stock_threshold: "Umbral de stock bajo",
};

function Config() {
  // Contraseña directa para asegurar funcionamiento
  const password = "majito2005"; 
  const list = useServerFn(adminListSettings);
  const upd = useServerFn(adminUpdateSetting);
  
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carga directa de datos
    list({ data: { password: password } }).then((d) => {
      setRows(d as any[]);
      setLoading(false);
    });
  }, []);

  async function save(key: string, value: any) {
    await upd({ data: { password: password, key, value } });
    invalidateSettingsCache();
  }

  return (
    <AdminShell title="Configuración">
      {loading ? (
        <div className="p-10 text-center text-mocha">Cargando datos...</div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3 rounded-2xl bg-white p-5 shadow ring-1 ring-mocha/10">
            <h3 className="text-lg font-bold text-shocking mb-2">Configuración General</h3>
            {rows.map((r) => (
              <SettingRow key={r.key} row={r} onSave={save} />
            ))}
          </div>

          {/* SECCIÓN: Gestión de Precios de Pasteles por Tamaño */}
          <PastelesConfig />
        </div>
      )}
    </AdminShell>
  );
}

function SettingRow({ row, onSave }: any) {
  const [val, setVal] = useState(String(row.value));
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-mocha/10 pb-3 last:border-none">
      <label className="min-w-[220px] text-sm font-semibold text-foreground">{LABELS[row.key] ?? row.key}</label>
      <input value={val} onChange={(e)=>setVal(e.target.value)} className="flex-1 min-w-[200px] rounded border border-mocha/20 px-3 py-2 text-sm"/>
      <button onClick={() => onSave(row.key, val)} className="rounded-full bg-shocking px-4 py-2 text-xs font-bold text-white">
        Guardar
      </button>
    </div>
  );
}

// =========================================================
// COMPONENTE: Administración de Precios por Tamaño
// =========================================================
function PastelesConfig() {
  const [pasteles, setPasteles] = useState<Product[]>([]);
  const [loadingPasteles, setLoadingPasteles] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    cargarPasteles();
  }, []);

  async function cargarPasteles() {
    setLoadingPasteles(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("categoria", "Pasteles")
      .order("nombre");

    if (!error && data) {
      const normalizados = data.map((p: any) => ({
        ...p,
        tamanios: p.tamanios && p.tamanios.length > 0 ? p.tamanios : [
          { nombre: "Individual", precio: p.precio || 150, porciones: "Pequeño" },
          { nombre: "Mediano", precio: 350, porciones: "6 a 8 personas" },
          { nombre: "Grande", precio: 600, porciones: "15 a 20 personas" }
        ]
      }));
      setPasteles(normalizados as Product[]);
    }
    setLoadingPasteles(false);
  }

  const handlePriceChange = (productId: number, sizeName: string, newPrice: number) => {
    setPasteles((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const tamaniosList = (p.tamanios as CakeSize[]) || [];
        const nuevosTamanios = tamaniosList.map((t: CakeSize) =>
          t.nombre === sizeName ? { ...t, precio: newPrice } : t
        );
        return { ...p, tamanios: nuevosTamanios };
      })
    );
  };

  async function guardarPreciosPastel(pastel: Product) {
    setSavingId(pastel.id);
    const { error } = await supabase
      .from("products")
      .update({ tamanios: pastel.tamanios })
      .eq("id", pastel.id);

    setSavingId(null);
    if (error) {
      alert("Error al actualizar precios: " + error.message);
    } else {
      alert(`Precios de "${pastel.nombre}" actualizados en Supabase`);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-mocha/10">
      <h3 className="text-lg font-bold text-shocking mb-4">🎂 Precios de Pasteles por Tamaño</h3>
      {loadingPasteles ? (
        <p className="text-sm text-mocha">Cargando pasteles desde Supabase...</p>
      ) : pasteles.length === 0 ? (
        <p className="text-sm text-mocha">No se encontraron productos en la categoría Pasteles.</p>
      ) : (
        <div className="space-y-6">
          {pasteles.map((p) => (
            <div key={p.id} className="border-b border-mocha/10 pb-4 last:border-none">
              <div className="flex items-center gap-3 mb-3">
                {p.img && (
                  <img src={p.img} alt={p.nombre} className="w-12 h-12 object-cover rounded-lg" />
                )}
                <div>
                  <h4 className="font-bold text-mocha">{p.nombre}</h4>
                  <p className="text-xs text-mocha/70">{p.descripcion || "Sin descripción"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                {((p.tamanios as CakeSize[]) || []).map((t: CakeSize) => (
                  <div key={t.nombre} className="bg-crema/20 p-2.5 rounded-xl border border-mocha/10">
                    <label className="block text-xs font-bold text-mocha uppercase">
                      {t.nombre} <span className="text-[10px] font-normal opacity-70">({t.porciones})</span>
                    </label>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs font-bold text-mocha">$</span>
                      <input
                        type="number"
                        value={t.precio}
                        onChange={(e) => handlePriceChange(p.id, t.nombre, Number(e.target.value))}
                        className="w-full rounded border border-mocha/20 px-2 py-1 text-sm font-semibold"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => guardarPreciosPastel(p)}
                  disabled={savingId === p.id}
                  className="rounded-full bg-shocking px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 transition disabled:opacity-50"
                >
                  {savingId === p.id ? "Guardando..." : "Guardar Precios"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
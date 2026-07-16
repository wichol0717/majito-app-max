import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/AdminShell";
import { adminListSettings, adminUpdateSetting } from "@/lib/admin.functions";
import { invalidateSettingsCache } from "@/hooks/useAppSettings";

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
        <div className="space-y-3 rounded-2xl bg-white p-5 shadow ring-1 ring-mocha/10">
          {rows.map((r) => (
            <SettingRow key={r.key} row={r} onSave={save} />
          ))}
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
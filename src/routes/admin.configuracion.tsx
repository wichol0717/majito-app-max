import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/AdminShell";
import { RequireAdmin } from "@/features/admin/RequireAdmin";
import { useAdminAuth } from "@/features/admin/AdminAuth";
import { adminListSettings, adminUpdateSetting } from "@/lib/admin.functions";
import { invalidateSettingsCache } from "@/hooks/useAppSettings";

export const Route = createFileRoute("/admin/configuracion")({
  component: () => <RequireAdmin><Config/></RequireAdmin>,
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
  const { password } = useAdminAuth();
  const list = useServerFn(adminListSettings);
  const upd = useServerFn(adminUpdateSetting);
  const [rows, setRows] = useState<any[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { list({ data: { password: password! } }).then((d) => setRows(d as any[])); /* eslint-disable-next-line */ }, []);

  async function save(key: string, value: any) {
    setSaving(key);
    await upd({ data: { password: password!, key, value } });
    invalidateSettingsCache();
    setSaving(null);
    setMsg("Guardado ✓");
    setTimeout(() => setMsg(null), 1500);
  }

  return (
    <AdminShell title="Configuración">
      {msg && <p className="mb-3 rounded bg-green-100 px-3 py-2 text-sm text-green-700">{msg}</p>}
      <div className="space-y-3 rounded-2xl bg-white p-5 shadow ring-1 ring-mocha/10">
        {rows.map((r) => (
          <SettingRow key={r.key} row={r} onSave={save} saving={saving === r.key}/>
        ))}
      </div>
    </AdminShell>
  );
}

function SettingRow({ row, onSave, saving }: any) {
  const [val, setVal] = useState(String(row.value));
  useEffect(() => setVal(String(row.value)), [row.value]);
  const isNumber = typeof row.value === "number";
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-mocha/10 pb-3 last:border-none">
      <label className="min-w-[220px] text-sm font-semibold text-foreground">{LABELS[row.key] ?? row.key}</label>
      <input value={val} onChange={(e)=>setVal(e.target.value)} className="flex-1 min-w-[200px] rounded border border-mocha/20 px-3 py-2 text-sm"/>
      <button disabled={saving} onClick={() => onSave(row.key, isNumber ? Number(val) : val)}
        className="rounded-full bg-shocking px-4 py-2 text-xs font-bold text-white disabled:opacity-40">
        {saving ? "…" : "Guardar"}
      </button>
    </div>
  );
}
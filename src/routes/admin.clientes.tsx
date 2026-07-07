import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { AdminShell } from "@/features/admin/AdminShell";
import { RequireAdmin } from "@/features/admin/RequireAdmin";
import { useAdminAuth } from "@/features/admin/AdminAuth";
import { adminListCustomers } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/clientes")({
  component: () => <RequireAdmin><Clientes/></RequireAdmin>,
});

function Clientes() {
  const { password } = useAdminAuth();
  const list = useServerFn(adminListCustomers);
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [onlyRec, setOnlyRec] = useState(false);
  const [origen, setOrigen] = useState<string>("");
  const [tpl, setTpl] = useState("¡Hola {{nombre}}! Te queremos consentir con una promo especial esta semana en Majito 🎂✨. ¿Te gustaría verla?");

  useEffect(() => { list({ data: { password: password! } }).then((d) => setRows(d as any[])); /* eslint-disable-next-line */ }, []);

  const origenes = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r: any) => set.add(r.origen ?? "directo"));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => rows.filter(r =>
    (!onlyRec || r.total_orders >= 3) &&
    (origen === "" || (r.origen ?? "directo") === origen) &&
    (q === "" || r.whatsapp.includes(q) || (r.name ?? "").toLowerCase().includes(q.toLowerCase()))
  ), [rows, q, onlyRec, origen]);

  function waLink(r: any) {
    const msg = tpl.replace("{{nombre}}", r.name ?? "");
    return `https://wa.me/${r.whatsapp}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <AdminShell title={`Clientes (${rows.length})`}>
      <div className="mb-3 flex flex-wrap gap-2">
        <input placeholder="Buscar por nombre o WhatsApp" value={q} onChange={(e)=>setQ(e.target.value)}
          className="flex-1 min-w-[200px] rounded border border-mocha/20 px-3 py-2 text-sm"/>
        <select value={origen} onChange={(e)=>setOrigen(e.target.value)}
          className="rounded border border-mocha/20 px-3 py-2 text-sm">
          <option value="">Todos los orígenes</option>
          {origenes.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={onlyRec} onChange={(e)=>setOnlyRec(e.target.checked)}/> Solo recurrentes (≥3)</label>
      </div>
      <div className="mb-3 rounded-2xl bg-white p-3 ring-1 ring-mocha/10">
        <label className="text-xs font-semibold text-mocha">Plantilla de promoción (usa {"{{nombre}}"}):</label>
        <textarea value={tpl} onChange={(e)=>setTpl(e.target.value)} className="mt-1 w-full rounded border border-mocha/20 px-3 py-2 text-sm" rows={2}/>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-white shadow ring-1 ring-mocha/10">
        <table className="min-w-full text-sm">
          <thead className="bg-crema text-xs uppercase text-mocha">
            <tr><th className="p-3 text-left">Cliente</th><th className="p-3">WhatsApp</th><th className="p-3">Origen</th><th className="p-3">Pedidos</th><th className="p-3">Gastado</th><th className="p-3">Último</th><th className="p-3">Promo</th></tr>
          </thead>
          <tbody className="divide-y divide-mocha/10">
            {filtered.map((r) => (
              <tr key={r.id} className={r.total_orders >= 3 ? "bg-sunset/30" : ""}>
                <td className="p-2">{r.name ?? "—"}</td>
                <td className="p-2 text-center font-mono text-xs">{r.whatsapp}</td>
                <td className="p-2 text-center text-[11px]">{r.origen ?? "directo"}</td>
                <td className="p-2 text-center font-bold">{r.total_orders}</td>
                <td className="p-2 text-center">${Number(r.total_spent).toFixed(2)}</td>
                <td className="p-2 text-center text-xs">{new Date(r.last_order_at).toLocaleDateString("es-MX")}</td>
                <td className="p-2 text-center">
                  <a href={waLink(r)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-[11px] font-bold text-white"><MessageCircle className="h-3 w-3"/>Enviar</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
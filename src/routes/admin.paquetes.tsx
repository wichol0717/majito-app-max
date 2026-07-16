import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/AdminShell";
import { adminListPackages, adminUpsertPackage } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/paquetes")({
  component: () => <Paquetes />,
});

function Paquetes() {
  const password = "majito2005"; // Contraseña fija integrada
  const [isClient, setIsClient] = useState(false);
  const list = useServerFn(adminListPackages);
  const upd = useServerFn(adminUpsertPackage);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => { setIsClient(true); }, []);

  async function refresh() {
    const d = await list({ data: { password: password } });
    setRows(d as any[]);
  }

  useEffect(() => { 
    if (isClient) refresh(); 
  }, [isClient]);

  async function save(p: any) {
    await upd({ data: { password: password, pkg: p } });
    await refresh();
  }

  if (!isClient) return null;

  return (
    <AdminShell title="Paquetes de eventos">
      <p className="mb-3 text-xs text-mocha">Define precios, descripción y contenido de cada paquete. El de 200+ queda como cotización personalizada.</p>
      <div className="overflow-x-auto rounded-2xl bg-white shadow ring-1 ring-mocha/10">
        <table className="min-w-full text-sm">
          <thead className="bg-crema text-xs uppercase text-mocha">
            <tr><th className="p-3 text-left">Categoría</th><th>Personas</th><th className="text-left">Nombre</th><th>Precio</th><th className="text-left">Descripción</th><th>Cotización</th><th>Activo</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-mocha/10">
            {rows.map((r) => <PkgRow key={r.id} row={r} onSave={save}/>)}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function PkgRow({ row, onSave }: any) {
  const [r, setR] = useState(row);
  useEffect(()=>setR(row),[row]);
  return (
    <tr>
      <td className="p-2">{r.categoria === "reposteria" ? "🧁 Repostería" : "🥪 Snacks fríos"}</td>
      <td className="p-2 text-center">{r.personas === 200 ? "200+" : r.personas}</td>
      <td className="p-2"><input className="w-full rounded border border-mocha/20 px-2 py-1" value={r.nombre} onChange={(e)=>setR({...r,nombre:e.target.value})}/></td>
      <td className="p-2 text-center"><input type="number" className="w-24 rounded border border-mocha/20 px-2 py-1" value={r.precio ?? ""} onChange={(e)=>setR({...r,precio:e.target.value===""?null:Number(e.target.value)})}/></td>
      <td className="p-2"><input className="w-full rounded border border-mocha/20 px-2 py-1" value={r.descripcion ?? ""} onChange={(e)=>setR({...r,descripcion:e.target.value})}/></td>
      <td className="p-2 text-center"><input type="checkbox" checked={r.requiere_cotizacion} onChange={(e)=>setR({...r,requiere_cotizacion:e.target.checked})}/></td>
      <td className="p-2 text-center"><input type="checkbox" checked={r.activo} onChange={(e)=>setR({...r,activo:e.target.checked})}/></td>
      <td className="p-2 text-center"><button onClick={()=>onSave(r)} className="rounded-full bg-shocking px-3 py-1 text-[11px] font-bold text-white">Guardar</button></td>
    </tr>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/AdminShell";
import { RequireAdmin } from "@/features/admin/RequireAdmin";
import { useAdminAuth } from "@/features/admin/AdminAuth";
import { adminListProducts, adminUpsertProduct, adminDeleteProduct } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/inventario")({
  component: () => <RequireAdmin><Inventario/></RequireAdmin>,
});

function Inventario() {
  const { password } = useAdminAuth();
  const list = useServerFn(adminListProducts);
  const upsert = useServerFn(adminUpsertProduct);
  const del = useServerFn(adminDeleteProduct);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const threshold = 3;

  async function refresh() {
    setLoading(true);
    const data = await list({ data: { password: password! } });
    setRows(data as any[]);
    setLoading(false);
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  async function save(p: any) {
    await upsert({ data: { password: password!, product: p } });
    await refresh();
  }
  async function remove(id: number) {
    if (!confirm("¿Eliminar producto?")) return;
    await del({ data: { password: password!, id } });
    await refresh();
  }

  return (
    <AdminShell title="Inventario">
      <div className="mb-4 flex justify-end">
        <button onClick={() => save({ nombre: "Nuevo producto", precio: 0, categoria: "Galletas", activo: "SI", stock: 0 })}
          className="rounded-full bg-shocking px-4 py-2 text-xs font-bold text-white">+ Nuevo producto</button>
      </div>
      {loading ? <p className="text-sm text-mocha">Cargando…</p> : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow ring-1 ring-mocha/10">
          <table className="min-w-full text-sm">
            <thead className="bg-crema text-xs uppercase tracking-wider text-mocha">
              <tr>
                <th className="p-3 text-left">Nombre</th><th className="p-3">Categoría</th>
                <th className="p-3">Precio</th><th className="p-3">Stock</th>
                <th className="p-3">Activo</th><th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mocha/10">
              {rows.map((r) => (
                <Row key={r.id} row={r} onSave={save} onDelete={remove} lowThreshold={threshold}/>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

function Row({ row, onSave, onDelete, lowThreshold }: any) {
  const [r, setR] = useState(row);
  useEffect(() => setR(row), [row]);
  const low = (r.stock ?? 0) <= lowThreshold;
  return (
    <tr className={low ? "bg-red-50" : ""}>
      <td className="p-2"><input className="w-full rounded border border-mocha/20 px-2 py-1" value={r.nombre} onChange={(e)=>setR({...r,nombre:e.target.value})}/></td>
      <td className="p-2"><input className="w-28 rounded border border-mocha/20 px-2 py-1" value={r.categoria ?? ""} onChange={(e)=>setR({...r,categoria:e.target.value})}/></td>
      <td className="p-2"><input type="number" className="w-24 rounded border border-mocha/20 px-2 py-1" value={r.precio} onChange={(e)=>setR({...r,precio:Number(e.target.value)})}/></td>
      <td className="p-2 text-center">
        <input type="number" className="w-20 rounded border border-mocha/20 px-2 py-1" value={r.stock} onChange={(e)=>setR({...r,stock:Number(e.target.value)})}/>
        {low && <span className="ml-1 text-[10px] font-bold text-red-600">BAJO</span>}
      </td>
      <td className="p-2 text-center">
        <select className="rounded border border-mocha/20 px-2 py-1" value={r.activo} onChange={(e)=>setR({...r,activo:e.target.value})}>
          <option value="SI">SI</option><option value="NO">NO</option>
        </select>
      </td>
      <td className="p-2 text-center">
        <button onClick={()=>onSave(r)} className="mr-1 rounded-full bg-shocking px-3 py-1 text-[11px] font-bold text-white">Guardar</button>
        <button onClick={()=>onDelete(r.id)} className="rounded-full bg-red-100 px-3 py-1 text-[11px] font-bold text-red-600">×</button>
      </td>
    </tr>
  );
}
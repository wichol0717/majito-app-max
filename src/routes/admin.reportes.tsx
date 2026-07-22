import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, TrendingUp, ShoppingBag, Users, DollarSign, FileDown } from "lucide-react"; 
import { AdminShell } from "@/features/admin/AdminShell";
import { adminReports } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/reportes")({
  component: ReportesPage,
});

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n || 0);

type Report = Awaited<ReturnType<typeof adminReports>>;

function ReportesPage() {
  const password = "majito2005";
  const [isClient, setIsClient] = useState(false);
  const run = useServerFn(adminReports);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => setIsClient(true), []);

  const exportarAPdf = async (reportData: Report, periodDays: number) => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(244, 114, 182);
      doc.text("Majito Cake", 14, 20);

      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text(`Reporte de Desempeño Comercial (Últimos ${periodDays} días)`, 14, 28);
      
      const fechaHoy = new Date().toLocaleDateString("es-MX");
      doc.text(`Fecha de emisión: ${fechaHoy}`, 14, 34);

      doc.setDrawColor(244, 114, 182);
      doc.setLineWidth(0.5);
      doc.line(14, 38, 196, 38);

      doc.setFontSize(14);
      doc.setTextColor(51, 65, 85);
      doc.text("Métricas Clave", 14, 46);

      autoTable(doc, {
        startY: 50,
        head: [["Métrica", "Valor"]],
        body: [
          ["Ingresos Totales", fmt(reportData.totalIngresos)],
          ["Pedidos Registrados", String(reportData.totalPedidos)],
          ["Ticket Promedio", fmt(reportData.ticketPromedio)],
          ["Clientes Activos", String(reportData.topClientes.length)]
        ],
        headStyles: { fillColor: [244, 114, 182] },
        theme: "striped",
        styles: { font: "helvetica", fontSize: 10 },
      });

      const nextY1 = (doc as any).lastAutoTable.finalY + 10;
      doc.text("Ingresos por Canal", 14, nextY1);

      autoTable(doc, {
        startY: nextY1 + 4,
        head: [["Canal", "Ingresos", "Pedidos"]],
        body: [
          ["Mostrador", fmt(reportData.ingresos.mostrador), String(reportData.pedidos.mostrador)],
          ["Regalos", fmt(reportData.ingresos.regalos), String(reportData.pedidos.regalos)],
          ["Pasteles", fmt(reportData.ingresos.pasteles), String(reportData.pedidos.pasteles)],
          ["Eventos", fmt(reportData.ingresos.eventos), String(reportData.pedidos.eventos)]
        ],
        headStyles: { fillColor: [141, 110, 99] },
        theme: "striped",
        styles: { font: "helvetica", fontSize: 10 },
      });

      const nextY2 = (doc as any).lastAutoTable.finalY + 10;
      doc.text("Top Productos Vendidos", 14, nextY2);

      autoTable(doc, {
        startY: nextY2 + 4,
        head: [["Producto", "Cantidad Vendida", "Ingresos Generados"]],
        body: reportData.topProductos.map((p: any) => [
          p.producto ?? p.nombre,
          String(p.cantidad),
          fmt(p.ingresos)
        ]),
        headStyles: { fillColor: [244, 114, 182] },
        theme: "striped",
        styles: { font: "helvetica", fontSize: 10 },
      });

      doc.save(`Reporte_MajitoCake_${periodDays}dias_${fechaHoy.replace(/\//g, "-")}.pdf`);
    } catch (e) {
      console.error("Error al generar el PDF:", e);
    }
  };

  useEffect(() => {
    if (!password || !isClient) return;
    let cancel = false;
    setLoading(true); setErr(null);
    run({ data: { password, days } })
      .then((r) => { if (!cancel) setData(r as Report); })
      .catch((e) => { if (!cancel) setErr(e?.message ?? "Error"); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [password, days, run, isClient]);

  if (!isClient) return null;

  return (
    <AdminShell title="Reportes">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-mocha">Periodo:</span>
          {[7, 15, 30, 90, 180, 365].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`rounded-full px-3 py-1 text-xs ${days === d ? "bg-shocking text-white" : "bg-white ring-1 ring-mocha/15 text-mocha hover:bg-sunset"}`}>
              {d} días
            </button>
          ))}
        </div>

        {data && (
          <button
            onClick={() => exportarAPdf(data, days)}
            className="flex items-center gap-1.5 rounded-xl bg-shocking px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-opacity-90 transition active:scale-95"
          >
            <FileDown size={14} />
            Exportar PDF
          </button>
        )}
      </div>

      {err && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      {loading && !data && <div className="text-sm text-mocha">Cargando…</div>}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={<DollarSign/>} label="Ingresos totales" value={fmt(data.totalIngresos)}/>
            <Stat icon={<ShoppingBag/>} label="Pedidos" value={String(data.totalPedidos)}/>
            <Stat icon={<TrendingUp/>} label="Ticket promedio" value={fmt(data.ticketPromedio)}/>
            <Stat icon={<Users/>} label="Clientes top" value={String(data.topClientes.length)}/>
          </div>

          <Panel title="Ingresos por canal y productos" icon={<BarChart3/>}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(["mostrador", "regalos", "pasteles", "eventos"] as const).map((canal) => {
                const label = canal.charAt(0).toUpperCase() + canal.slice(1);
                const monto = data.ingresos[canal] || 0;
                const n = data.pedidos[canal] || 0;
                const prods = data.productosPorCanal?.[canal] || [];
                return (
                  <div key={canal} className="rounded-xl bg-crema p-4 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-mocha/70">{label}</p>
                      <p className="text-xl font-bold text-mocha">{fmt(monto)}</p>
                      <p className="text-xs text-mocha/70 mb-3">{n} pedidos</p>
                    </div>
                    <div className="border-t border-mocha/10 pt-2 mt-2">
                      <p className="text-[11px] font-bold text-mocha mb-1">Productos:</p>
                      {prods.length === 0 ? (
                        <p className="text-[10px] text-mocha/60">Sin productos</p>
                      ) : (
                        <ul className="space-y-1 max-h-32 overflow-y-auto text-[11px] text-mocha">
                          {prods.map((p, idx) => (
                            <li key={idx} className="flex justify-between items-center">
                              <span className="truncate pr-1" title={p.nombre}>{p.nombre}</span>
                              <span className="font-semibold whitespace-nowrap">({p.cantidad})</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Ventas por día" icon={<TrendingUp/>}>
            <SalesChart data={data.ventasPorDia}/>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Top productos" icon={<ShoppingBag/>}>
              <Table
                head={["Producto", "Cant.", "Ingresos"]}
                rows={data.topProductos.map((p: any) => [p.producto ?? p.nombre, String(p.cantidad), fmt(p.ingresos)])}
                empty="Sin productos en el periodo"
              />
            </Panel>
            <Panel title="Métodos de pago" icon={<DollarSign/>}>
              <Table
                head={["Método", "Pedidos", "Monto"]}
                rows={data.metodos.map((m) => [m.metodo, String(m.pedidos), fmt(m.monto)])}
                empty="Sin datos"
              />
            </Panel>
          </div>

          <Panel title="Top clientes" icon={<Users/>}>
            <Table
              head={["Cliente", "WhatsApp", "Pedidos", "Total gastado", "Origen", "Producto(s)"]}
              rows={data.topClientes.map((c: any) => [
                c.name ?? "—",
                c.whatsapp ?? "—",
                String(c.total_orders ?? 0),
                fmt(Number(c.total_spent ?? 0)),
                c.origen ?? "—",
                c.producto ?? "—",
              ])}
              empty="Sin clientes registrados"
            />
          </Panel>
        </div>
      )}
    </AdminShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-mocha/10">
      <div className="flex items-center gap-2 text-shocking">{icon}<span className="text-xs font-semibold">{label}</span></div>
      <p className="mt-2 text-2xl font-bold text-mocha">{value}</p>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-mocha/10">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-shocking">{icon}{title}</h2>
      {children}
    </section>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: string[][]; empty: string }) {
  if (!rows.length) return <p className="text-xs text-mocha/70">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-mocha/70">
          <tr>{head.map((h) => <th key={h} className="py-2 pr-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-mocha/10">
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className="py-2 pr-3 text-mocha">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SalesChart({ data }: { data: { fecha: string; monto: number }[] }) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.monto)), [data]);
  if (!data.length) return <p className="text-xs text-mocha/70">Sin ventas en el periodo</p>;
  return (
    <div className="flex items-end gap-1 overflow-x-auto pb-2" style={{ height: 160 }}>
      {data.map((d) => {
        const h = Math.max(2, Math.round((d.monto / max) * 140));
        return (
          <div key={d.fecha} className="group flex flex-col items-center" style={{ minWidth: 18 }}>
            <div className="rounded-t bg-shocking transition group-hover:bg-mocha" style={{ height: h, width: 14 }} title={`${d.fecha}: ${fmt(d.monto)}`}/>
            <span className="mt-1 text-[9px] text-mocha/60">{d.fecha.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}
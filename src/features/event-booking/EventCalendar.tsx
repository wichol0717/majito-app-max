// [Módulo: features/event-booking] -> [Archivo: EventCalendar.tsx] -> [Acción: CREAR]
// Ruta C: Calendario de eventos con reglas del Manifiesto Parte III Caso C:
//   - No pasado
//   - Anti-empalmes (1 evento por día)

import { useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/api/supabase";

export function EventCalendar() {
  const [ocupadas, setOcupadas] = useState<Set<string>>(new Set());
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [mes, setMes] = useState(() => {
    const d = new Date();
    return { anio: d.getFullYear(), mes: d.getMonth() };
  });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from("event_bookings")
      .select("event_date, status")
      .in("status", ["HELD_24H", "VERIFIED"])
      .then(({ data }) => {
        setOcupadas(new Set((data ?? []).map((r) => r.event_date)));
      });
  }, []);

  const dias = useMemo(() => construirMes(mes.anio, mes.mes), [mes]);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMes(retrocederMes(mes))}
          className="rounded-full bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-mocha/20"
        >
          ←
        </button>
        <h3 className="text-xl font-bold capitalize text-mocha">
          {nombreMes(mes.anio, mes.mes)}
        </h3>
        <button
          type="button"
          onClick={() => setMes(avanzarMes(mes))}
          className="rounded-full bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-mocha/20"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-widest text-mocha">
        {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {dias.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = d.toISOString().split("T")[0];
          const enPasado = d < hoy;
          const ocupada = ocupadas.has(iso);
          const seleccionadaHoy = seleccionada === iso;
          const bloqueada = enPasado || ocupada;

          return (
            <button
              key={iso}
              type="button"
              disabled={bloqueada}
              onClick={() => setSeleccionada(iso)}
              className={`aspect-square rounded-xl text-sm font-semibold transition ${
                bloqueada
                  ? "cursor-not-allowed bg-mocha/10 text-mocha/40 line-through"
                  : seleccionadaHoy
                    ? "bg-shocking text-white shadow-md"
                    : "bg-white text-foreground ring-1 ring-mocha/20 hover:bg-sunset"
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {seleccionada && (
        <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-mocha/20">
          <p className="text-sm text-mocha">Fecha elegida:</p>
          <p className="text-2xl font-bold text-shocking">{formatearLargo(seleccionada)}</p>
          <button className="mt-4 w-full rounded-full bg-shocking px-6 py-3 font-bold text-white">
            Apartar con anticipo del 50%
          </button>
          <p className="mt-2 text-xs text-mocha">
            El día desaparece del calendario por 24 h mientras subes tu comprobante.
          </p>
        </div>
      )}
    </div>
  );
}

function construirMes(anio: number, mes: number): (Date | null)[] {
  const primero = new Date(anio, mes, 1);
  const totalDias = new Date(anio, mes + 1, 0).getDate();
  const padding = primero.getDay();
  const arr: (Date | null)[] = Array(padding).fill(null);
  for (let i = 1; i <= totalDias; i++) arr.push(new Date(anio, mes, i));
  return arr;
}
function avanzarMes({ anio, mes }: { anio: number; mes: number }) {
  return mes === 11 ? { anio: anio + 1, mes: 0 } : { anio, mes: mes + 1 };
}
function retrocederMes({ anio, mes }: { anio: number; mes: number }) {
  const hoy = new Date();
  if (anio === hoy.getFullYear() && mes === hoy.getMonth()) return { anio, mes };
  return mes === 0 ? { anio: anio - 1, mes: 11 } : { anio, mes: mes - 1 };
}
function nombreMes(anio: number, mes: number) {
  return new Date(anio, mes, 1).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
}
function formatearLargo(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
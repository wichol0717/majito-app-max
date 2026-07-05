// [Módulo: features/custom-cakes] -> [Archivo: CustomCakeForm.tsx] -> [Acción: CREAR]
// Ruta B: Cotizador de pastel personalizado (esqueleto v1).

import { useEffect, useState } from "react";

const STORAGE_KEY = "majito.custom-cake.v1";
type FormFields = {
  customer_name: string;
  customer_whatsapp: string;
  delivery_date: string;
  flavor_chosen: string;
  notes: string;
};
const EMPTY: FormFields = {
  customer_name: "", customer_whatsapp: "", delivery_date: "", flavor_chosen: "", notes: "",
};

export function CustomCakeForm() {
  const [submitted, setSubmitted] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [fields, setFields] = useState<FormFields>(() => {
    if (typeof window === "undefined") return EMPTY;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
    } catch { return EMPTY; }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fields)); } catch { /* ignore */ }
  }, [fields]);

  const set = (k: keyof FormFields) => (e: { target: { value: string } }) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  if (submitted) {
    return (
      <div className="rounded-2xl border border-sweet-pink bg-white p-8 text-center">
        <h3 className="text-2xl font-bold text-shocking">¡Recibido!</h3>
        <p className="mt-2 text-foreground/80">
          Tienes <strong>24 horas</strong> para subir tu comprobante del anticipo del 50%.
          Después el cupo se libera automáticamente.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <Field label="Tu nombre" name="customer_name" required value={fields.customer_name} onChange={set("customer_name")} />
      <Field label="WhatsApp" name="customer_whatsapp" required placeholder="Ej. 782 123 4567" value={fields.customer_whatsapp} onChange={set("customer_whatsapp")} />
      <Field
        label="Fecha de entrega"
        name="delivery_date"
        type="date"
        min={today}
        required
        value={fields.delivery_date}
        onChange={set("delivery_date")}
      />
      <Field label="Sabor" name="flavor_chosen" required value={fields.flavor_chosen} onChange={set("flavor_chosen")} />

      <div>
        <label className="block text-sm font-semibold text-foreground">
          Foto de referencia (Pinterest, WhatsApp…)
        </label>
        <input
          type="file"
          accept="image/*"
          className="mt-2 block w-full text-sm text-mocha file:mr-4 file:rounded-full file:border-0 file:bg-sweet-pink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-foreground"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground">
          Notas para Majito
        </label>
        <textarea
          name="notes"
          rows={3}
          value={fields.notes}
          onChange={set("notes")}
          className="mt-2 w-full rounded-xl border border-mocha/30 bg-white p-3 text-sm focus:border-shocking focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-full bg-shocking px-6 py-4 text-lg font-bold text-white shadow-md transition hover:bg-shocking/90"
      >
        Continuar al anticipo (50%)
      </button>
    </form>
  );
}

function Field(props: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-foreground">{props.label}</label>
      <input
        {...props}
        type={props.type ?? "text"}
        className="mt-2 w-full rounded-xl border border-mocha/30 bg-white p-3 text-sm focus:border-shocking focus:outline-none"
      />
    </div>
  );
}
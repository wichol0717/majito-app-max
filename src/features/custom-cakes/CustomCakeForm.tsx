// [Módulo: features/custom-cakes] -> [Archivo: CustomCakeForm.tsx]
import { useEffect, useState } from "react";
import { supabase } from "@/api/supabase";

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
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl = null;
    
    // --- LÓGICA DE SUBIDA DE IMAGEN MEJORADA ---
    if (file) {
      try {
        const fileExt = file.name.split('.').pop();
        // Usamos Date.now y Math.random para evitar errores de crypto en localhost/http
        const randomString = Math.random().toString(36).substring(2, 10);
        const fileName = `${Date.now()}-${randomString}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('foto-referencia') // IMPORTANTE: El bucket debe llamarse exactamente así
          .upload(fileName, file);

        if (uploadError) {
          console.error("Error de Supabase al subir:", uploadError.message);
          alert(`No se pudo subir la foto: ${uploadError.message}. El pedido se enviará sin foto.`);
        } else {
          const { data } = supabase.storage.from('foto-referencia').getPublicUrl(fileName);
          imageUrl = data.publicUrl;
        }
      } catch (err) {
        console.error("Error inesperado en la imagen:", err);
      }
    }

    // --- GUARDADO DEL PEDIDO ---
    const { error } = await supabase
      .from('custom_cake_orders')
      .insert([{ 
        nombre_cliente: fields.customer_name,
        customer_whatsapp: fields.customer_whatsapp,
        delivery_date: fields.delivery_date,
        flavor_chosen: fields.flavor_chosen,
        detalles: fields.notes,
        reference_image_url: imageUrl, // Aquí irá el link o null si falló
        total: 0,
        delivery_status: 'validando_pago'
      } as any]);

    if (!error) {
      setSubmitted(true);
      window.localStorage.removeItem(STORAGE_KEY);

      const mensajeWA = `¡Hola! Quiero solicitar una cotización para un pastel personalizado.%0A%0A` +
        `*Nombre:* ${fields.customer_name}%0A` +
        `*Fecha de entrega:* ${fields.delivery_date}%0A` +
        `*Sabor:* ${fields.flavor_chosen}%0A` +
        `*Notas:* ${fields.notes ? fields.notes : 'Ninguna'}%0A` +
        `*Referencia:* ${imageUrl ? imageUrl : 'Sin foto adjunta'}`;

      window.open(`https://wa.me/527831450929?text=${mensajeWA}`, "_blank");
    } else {
      console.error(error);
      alert("Hubo un error al enviar el formulario, intenta de nuevo.");
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-sweet-pink bg-white p-8 text-center">
        <h3 className="text-2xl font-bold text-shocking">¡Solicitud enviada!</h3>
        <p className="mt-2 text-foreground/80">
          Se ha abierto WhatsApp para que podamos darte tu cotización y afinar los detalles de tu pastel.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
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
          onChange={(e) => e.target.files && setFile(e.target.files[0])}
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
        disabled={loading}
        className="w-full rounded-full bg-shocking px-6 py-4 text-lg font-bold text-white shadow-md transition hover:bg-shocking/90 disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Solicitar Cotización"}
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
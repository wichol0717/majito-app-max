import { useState } from "react";
import confetti from "canvas-confetti";
import { Gift } from "lucide-react";

interface DigitalCardProps {
  recipientName: string;
  senderName: string;
  giftMessage: string;
  senderWhatsapp: string;
  bakeryWhatsapp: string;
  orderId: string;
  paymentReference?: string;
  design: string;
}

export function DigitalCard({
  recipientName,
  senderName,
  giftMessage,
  senderWhatsapp,
  bakeryWhatsapp,
  orderId,
  paymentReference,
  design,
}: DigitalCardProps) {
  const [revealed, setRevealed] = useState(false);

  const getCardImage = (designId: string) => {
    // Normalizamos y eliminamos espacios internos para atrapar "te amo", "teamo", etc.
    const cleanDesign = (designId || "cumple").toLowerCase().trim().replace(/\s+/g, "");

    const map: Record<string, string> = {
      cumple: "/tarjetas/cumple.jpg",
      boda: "/tarjetas/boda.jpg",
      amor: "/tarjetas/amor.jpg",
      teamo: "/tarjetas/amor.jpg",
      especial: "/tarjetas/especial.jpg",
      aniversario: "/tarjetas/aniversario.jpg",
    };

    // Validación extra por si llega con variantes de texto
    if (cleanDesign === "teamo" || cleanDesign === "amo") {
      return "/tarjetas/amor.jpg";
    }

    return map[cleanDesign] || "/tarjetas/cumple.jpg";
  };

  const formatWaNumber = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.length === 10) return `521${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith("52")) return `521${cleaned.slice(2)}`;
    return cleaned;
  };

  const iniciarSorpresa = () => {
    try {
      const audio = new Audio('https://actions.google.com/sounds/v1/foley/fireworks_explosion_large.ogg');
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => console.log("Audio omitido:", error));
      }
    } catch (e) {
      console.log("Audio no soportado:", e);
    }

    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    setRevealed(true);
  };

  const idFinal = paymentReference || orderId;

  const msgAgradecimiento = encodeURIComponent(`Hola ${senderName}, ¡muchas gracias por el regalo! Me encantó.`);
  const msgConfirmacion = encodeURIComponent(`Hola Majito Cake, confirmo que recibí el regalo del pedido #${idFinal}. ¡Muchas gracias!`);

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-[2rem] bg-white shadow-2xl border border-mocha/10">
      {!revealed ? (
        <div className="p-12 flex flex-col items-center justify-center h-[500px] text-center">
          <Gift className="w-16 h-16 text-shocking mb-4" />
          <h2 className="text-3xl font-bold text-shocking mb-6">¡Tienes un regalo! 🎁</h2>
          <button 
            onClick={iniciarSorpresa} 
            className="bg-shocking text-white font-bold py-4 px-8 rounded-full shadow-lg hover:scale-105 transition active:scale-95"
          >
            ¡Abrir Sorpresa!
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in duration-700">
          <img src={getCardImage(design)} alt="Tarjeta Regalo" className="w-full h-auto object-cover" />
          <div className="p-6 text-center">
            <div className="mb-6 rounded-2xl bg-crema p-5 shadow-inner border border-mocha/10">
              <p className="text-2xl">❤️</p>
              <p className="text-lg font-bold text-shocking uppercase mt-2">PARA: {recipientName}</p>
              <p className="text-sm font-medium text-mocha mb-4">De: {senderName}</p>
              <p className="text-md font-medium text-mocha italic">"{giftMessage}"</p>
            </div>
            
            <p className="text-xs font-bold text-mocha mb-4 uppercase tracking-widest">Confirma tu recepción</p>
            
            <a 
              href={`https://wa.me/${formatWaNumber(senderWhatsapp)}?text=${msgAgradecimiento}`} 
              target="_blank" rel="noreferrer"
              className="block w-full bg-shocking text-white font-bold py-3 rounded-full mb-3 hover:opacity-90 transition"
            >
              Agradecer al comprador
            </a>
            <a 
              href={`https://wa.me/${formatWaNumber(bakeryWhatsapp)}?text=${msgConfirmacion}`} 
              target="_blank" rel="noreferrer"
              className="block w-full bg-white text-mocha font-bold py-3 rounded-full border-2 border-mocha hover:bg-mocha hover:text-white transition"
            >
              Avisar a Majito Cake
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
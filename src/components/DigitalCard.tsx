import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { Gift, Volume2, VolumeX } from "lucide-react";

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
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const getCardVideo = (designId: string) => {
    const cleanDesign = (designId || "cumple").toLowerCase().trim().replace(/\s+/g, "");

    const map: Record<string, string> = {
      cumple: "/videos/cumple.mp4",
      boda: "/videos/especial.mp4",
      amor: "/videos/amor.mp4",
      teamo: "/videos/amor.mp4",
      especial: "/videos/especial.mp4",
      aniversario: "/videos/aniversario.mp4",
    };

    if (cleanDesign === "teamo" || cleanDesign === "amo") {
      return "/videos/amor.mp4";
    }

    return map[cleanDesign] || "/videos/cumple.mp4";
  };

  useEffect(() => {
    if (revealed && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(error => {
        console.log("Reproducción de video prevenida por el navegador:", error);
      });
    }
  }, [revealed, design]);

  const formatWaNumber = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.length === 10) return `521${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith("52")) return `521${cleaned.slice(2)}`;
    return cleaned;
  };

  const iniciarSorpresa = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.6;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.log("Audio bloqueado por políticas del navegador:", error);
      });
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

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const idFinal = paymentReference || orderId;

  const msgAgradecimiento = encodeURIComponent(`Hola ${senderName}, ¡muchas gracias por el regalo! Me encantó.`);
  const msgConfirmacion = encodeURIComponent(`Hola Majito Cake, confirmo que recibí el regalo del pedido #${idFinal}. ¡Muchas gracias!`);

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-[2rem] bg-white shadow-2xl border border-mocha/10 relative">
      <audio 
        ref={audioRef} 
        src="/musica/majito-regalo.mp3" 
        preload="auto"
        loop 
      />

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
        <div className="animate-in fade-in duration-700 relative">
          <button 
            onClick={toggleAudio}
            className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-mocha shadow-md hover:bg-white transition"
          >
            {isPlaying ? <Volume2 className="w-4 h-4 text-shocking animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            {isPlaying ? "Música ON" : "Silenciado"}
          </button>

          <video
            ref={videoRef}
            src={getCardVideo(design)}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-auto object-cover"
            onError={(e) => console.error("Error cargando video:", e)}
          />

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
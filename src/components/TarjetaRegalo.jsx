import { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAppSettings } from "@/hooks/useAppSettings";

export default function TarjetaRegalo({ telefonoComprador, tarjeta = 'cumple' }) {
  const [mostrar, setMostrar] = useState(false);
  const { settings } = useAppSettings();
  const videoRef = useRef(null);

  // Normalizador universal: detecta cualquier formato de texto u objeto de la compra
  const getNombreVideo = (t) => {
    if (!t) return 'cumple';
    let textoBusqueda = '';
    if (typeof t === 'object' && t !== null) {
      textoBusqueda = Object.values(t).join(' ');
    } else {
      textoBusqueda = String(t);
    }
    const lower = textoBusqueda.toLowerCase().trim();
    if (lower.includes('amor')) return 'amor';
    if (lower.includes('aniversario')) return 'aniversario';
    if (lower.includes('especial')) return 'especial';
    if (lower.includes('cumple')) return 'cumple';
    return 'cumple';
  };

  const nombreVideo = getNombreVideo(tarjeta);

  const iniciarSorpresa = () => {
    // Audio de fuegos artificiales independiente al hacer clic en el botón
    const audio = new Audio('https://actions.google.com/sounds/v1/foley/fireworks_explosion_large.ogg');
    audio.play().catch(e => console.log("Audio bloqueado por navegador", e));

    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60 };
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    setMostrar(true);
  };

  // Forzar la carga y reproducción del video inmediatamente cuando se monta en pantalla
  useEffect(() => {
    if (mostrar && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(error => {
        console.log("Reproducción automática prevenida por el navegador:", error);
      });
    }
  }, [mostrar, nombreVideo]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-200 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-[2rem] bg-white shadow-2xl border-4 border-white">
        {!mostrar ? (
          <div className="p-12 flex flex-col items-center justify-center h-[500px] text-center">
            <h2 className="text-3xl font-bold text-[#be185d] mb-6">¡Tienes un regalo! 🎁</h2>
            <button onClick={iniciarSorpresa} className="bg-[#be185d] text-white font-bold py-4 px-8 rounded-full shadow-lg hover:scale-105 transition active:scale-95">
              ¡Abrir Sorpresa!
            </button>
          </div>
        ) : (
          <div>
            <video
              ref={videoRef}
              src={`/videos/${nombreVideo}.mp4`}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-auto object-cover"
              onError={(e) => console.error("Error cargando video:", e)}
            />
            <div className="p-6 text-center">
              <div className="mb-6 rounded-2xl bg-[#fef3c7] p-5 shadow-inner border border-[#78350f]/10">
                <p className="text-2xl">❤️</p>
                <p className="text-lg font-bold text-[#be185d] uppercase mt-2">PARA: FESTEJADO</p>
                <p className="text-sm font-medium text-[#78350f] mb-4">De: Comprador</p>
                <p className="text-md font-medium text-[#78350f] italic">
                  "¡Espero que disfrutes mucho este detalle! Que tu día sea tan dulce como este pastel. ¡Feliz día!"
                </p>
              </div>
              <p className="text-xs font-bold text-[#78350f] mb-4 uppercase tracking-widest">Confirma tu recepción</p>
              <a href={`https://wa.me/52${telefonoComprador}`} className="block w-full bg-[#be185d] text-white font-bold py-3 rounded-full mb-3 hover:opacity-90 transition">
                Agradecer al comprador
              </a>
              <a href={`https://wa.me/${settings?.whatsapp_number || '527831450929'}`} className="block w-full bg-white text-[#78350f] font-bold py-3 rounded-full border-2 border-[#78350f] hover:bg-[#78350f] hover:text-white transition">
                Avisar a Majito Cake
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "majito_install_dismissed_at";
const DISMISS_DAYS = 7;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function recentlyDismissed() {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    // iOS Safari doesn't fire beforeinstallprompt: show manual hint.
    if (isIos()) {
      const t = setTimeout(() => setVisible(true), 1500);
      setShowIosHint(true);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBip);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 z-[60] mx-auto flex max-w-sm items-start gap-3 rounded-2xl border border-mocha/20 bg-white/90 p-4 shadow-xl backdrop-blur-md md:bottom-6">
      <img src="/majito-inicial.svg" alt="" className="h-12 w-12 shrink-0 rounded-xl" />
      <div className="flex-1 text-sm">
        <p className="font-semibold text-shocking">Instala Majito Cake</p>
        {showIosHint && !deferred ? (
          <p className="mt-1 text-foreground/80">
            Toca <span className="font-semibold">Compartir</span> y luego{" "}
            <span className="font-semibold">Añadir a pantalla de inicio</span>.
          </p>
        ) : (
          <p className="mt-1 text-foreground/80">
            Añádela a tu pantalla de inicio para abrirla como una app.
          </p>
        )}
        {deferred && (
          <button
            onClick={install}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-shocking px-4 py-2 text-xs font-semibold text-white hover:bg-shocking/90"
          >
            <Download className="h-4 w-4" /> Instalar
          </button>
        )}
      </div>
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        className="rounded-full p-1 text-foreground/60 hover:bg-black/5"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
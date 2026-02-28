"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const primaryClass =
  "w-full flex items-center justify-center gap-2 bg-[#FF4D00] text-white text-sm px-6 py-3 mt-3 rounded-full font-semibold hover:bg-[#E04400] transition-colors";

function getIsIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as unknown as { standalone: boolean }).standalone)
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (getIsStandalone()) return;
    if (localStorage.getItem("largada_install_dismissed") === "1") return;

    const visitCount = parseInt(
      localStorage.getItem("largada_visits") || "0",
      10
    );
    localStorage.setItem("largada_visits", String(visitCount + 1));

    // Only show after second visit
    if (visitCount < 1) return;

    // iOS Safari: defer setState to avoid synchronous setState in effect (React 19)
    if (getIsIOS()) {
      const id = setTimeout(() => setShowIOSPrompt(true), 0);
      return () => clearTimeout(id);
    }

    // Chrome/Edge: listen for native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("largada_install_dismissed", "1");
  };

  if (dismissed) return null;
  if (!deferredPrompt && !showIOSPrompt) return null;

  return (
    <div className="fixed bottom-16 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 md:bottom-4 md:left-auto md:right-4 md:w-80">
      <div className="rounded-lg border bg-background p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Instalar Largada</p>
            <p className="text-xs text-muted-foreground">
              {showIOSPrompt
                ? "Instale o app para receber notificações e acessar direto da tela inicial."
                : "Acesse rapidamente direto da tela inicial do seu celular."}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {showIOSPrompt ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF4D00] text-[10px] font-bold text-white">
                1
              </span>
              <span>
                Toque em{" "}
                <Share className="inline h-3.5 w-3.5 align-text-bottom" />{" "}
                <strong>Compartilhar</strong> na barra do Safari
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF4D00] text-[10px] font-bold text-white">
                2
              </span>
              <span>
                Toque em <strong>Adicionar à Tela de Início</strong>
              </span>
            </div>
          </div>
        ) : (
          <Button onClick={handleInstall} className={primaryClass}>
            <Download className="mr-2 h-4 w-4" />
            Instalar
          </Button>
        )}
      </div>
    </div>
  );
}

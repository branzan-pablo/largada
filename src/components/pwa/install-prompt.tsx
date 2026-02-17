"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const primaryClass =
  "w-full flex items-center justify-center gap-2 bg-[#e53300] text-white text-sm px-6 py-3 mt-3 rounded-full font-semibold hover:bg-[#c42d00] transition-colors";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session or already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const visitCount = parseInt(
      sessionStorage.getItem("largada_visits") || "0",
      10
    );
    sessionStorage.setItem("largada_visits", String(visitCount + 1));

    // Only show after second visit
    if (visitCount < 1) return;

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

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-16 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 md:bottom-4 md:left-auto md:right-4 md:w-80">
      <div className="rounded-lg border bg-background p-4 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Instalar Largada</p>
            <p className="text-xs text-muted-foreground">
              Acesse rapidamente direto da tela inicial do seu celular.
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Button onClick={handleInstall} className={primaryClass}>
          <Download className="mr-2 h-4 w-4" />
          Instalar
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const SNOOZE_KEY = "largada_install_snooze_until";
const LEGACY_DISMISS_KEY = "largada_install_dismissed";
const VISITS_KEY = "largada_visits";
const DAY_MS = 24 * 60 * 60 * 1000;
const SHORT_SNOOZE_MS = 14 * DAY_MS;
const LONG_SNOOZE_MS = 60 * DAY_MS;

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

function isSnoozed(): boolean {
  // Legacy permanent dismiss: respect it for users who already opted out.
  if (localStorage.getItem(LEGACY_DISMISS_KEY) === "1") return true;
  const until = parseInt(localStorage.getItem(SNOOZE_KEY) || "0", 10);
  return Number.isFinite(until) && until > Date.now();
}

function snoozeFor(ms: number) {
  localStorage.setItem(SNOOZE_KEY, String(Date.now() + ms));
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (getIsStandalone()) return;
    if (isSnoozed()) return;

    const visitCount = parseInt(
      localStorage.getItem(VISITS_KEY) || "0",
      10
    );
    localStorage.setItem(VISITS_KEY, String(visitCount + 1));

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
    } else {
      // User declined the native prompt — back off for 14 days.
      snoozeFor(SHORT_SNOOZE_MS);
      setDismissed(true);
    }
  };

  const handleSnooze = () => {
    setDismissed(true);
    snoozeFor(SHORT_SNOOZE_MS);
  };

  const handleDismiss = () => {
    setDismissed(true);
    snoozeFor(LONG_SNOOZE_MS);
  };

  if (dismissed) return null;
  if (!deferredPrompt && !showIOSPrompt) return null;

  return (
    <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-4 right-4 z-50 animate-in slide-in-from-bottom-4 md:bottom-4 md:left-auto md:right-4 md:w-80">
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
            type="button"
            onClick={handleDismiss}
            aria-label="Não mostrar mais"
            className="-m-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
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
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleSnooze}
              className="h-11 flex-1 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
            >
              Mais tarde
            </button>
            <Button onClick={handleInstall} className="h-11 flex-[1.4] text-sm font-semibold">
              <Download className="h-4 w-4" />
              Instalar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

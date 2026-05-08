"use client";

import { useState } from "react";
import { Share2, Copy, Check, Instagram, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { formatDateFull, formatTime } from "@/lib/date";
import {
  renderRaceShareImage,
  buildImageFilename,
  type InstagramFormat,
} from "./race-share-image";

interface RaceShareButtonProps {
  raceName: string;
  city: string;
  state: string;
  date: string;
  startTime: string | null;
  distances: string[];
  shareUrl: string;
  imageUrl?: string | null;
  className?: string;
  /** "default" = full button with label; "icon" = small icon-only (for cards) */
  variant?: "default" | "icon";
}

function buildShareText({
  raceName,
  city,
  state,
  date,
  startTime,
  distances,
}: Omit<RaceShareButtonProps, "shareUrl" | "className" | "imageUrl">) {
  const distancesLabel = distances.map((d) => d.toUpperCase()).join(", ");
  const timePart = startTime ? ` às ${formatTime(startTime)}` : "";
  return `${raceName} - ${city}/${state}
📅 ${formatDateFull(date)}${timePart}
🏃 Distâncias: ${distancesLabel}

Veja detalhes e confirme presença:`;
}

export function RaceShareButton(props: RaceShareButtonProps) {
  const { shareUrl, className, imageUrl, variant = "default" } = props;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState<InstagramFormat | null>(null);

  const text = buildShareText(props);
  const fullText = `${text}\n${shareUrl}`;

  async function handleTriggerClick(
    event?: React.MouseEvent<HTMLButtonElement>
  ) {
    // When mounted inside a parent <Link>, prevent navigation/propagation.
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    // Always open the custom sheet so users see Instagram (Post/Story) options
    // alongside WhatsApp/Facebook/Copy. The native share sheet (navigator.share)
    // is invoked from within the sheet — for Instagram via canShare({files}),
    // for the system "More" via shareViaSystem().
    setOpen(true);
  }

  async function shareViaSystem() {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      copyToClipboard(fullText, "Texto copiado!");
      setOpen(false);
      return;
    }
    try {
      await navigator.share({
        title: props.raceName,
        text,
        url: shareUrl,
      });
      setOpen(false);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Não foi possível compartilhar.");
    }
  }

  async function copyToClipboard(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Tente novamente.");
    }
  }

  async function handleGenerateImage(format: InstagramFormat) {
    if (generating) return;
    setGenerating(format);
    try {
      const blob = await renderRaceShareImage(
        {
          raceName: props.raceName,
          city: props.city,
          state: props.state,
          date: props.date,
          startTime: props.startTime,
          distances: props.distances,
          shareUrl,
          imageUrl,
        },
        format
      );
      const filename = buildImageFilename(props.raceName, format);
      const file = new File([blob], filename, { type: "image/jpeg" });

      const canShareFile =
        typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });

      if (canShareFile && typeof navigator.share === "function") {
        try {
          await navigator.share({
            files: [file],
            title: props.raceName,
            text: fullText,
          });
          setOpen(false);
          return;
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
        }
      }

      // Desktop / unsupported: download + copy caption
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      try {
        await navigator.clipboard.writeText(fullText);
        toast.success("Imagem baixada e legenda copiada. Abra o Instagram e poste!");
      } catch {
        toast.success("Imagem baixada. Abra o Instagram e poste!");
      }
    } catch (err) {
      console.error("[RaceShare] image generation failed", err);
      toast.error(
        "Não foi possível gerar a imagem. A foto da corrida pode ter bloqueado o acesso."
      );
    } finally {
      setGenerating(null);
    }
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  const trigger =
    variant === "icon" ? (
      <button
        type="button"
        onClick={handleTriggerClick}
        aria-label="Compartilhar corrida"
        className={
          className ??
          "inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#0D1B2A] shadow-md ring-1 ring-black/5 backdrop-blur-sm transition-colors hover:bg-white hover:text-[#FF4D00] active:scale-95"
        }
      >
        <Share2 className="h-[18px] w-[18px]" />
      </button>
    ) : (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleTriggerClick}
        aria-label="Compartilhar corrida"
        className={className}
      >
        <Share2 className="h-4 w-4" />
        Compartilhar
      </Button>
    );

  return (
    <>
      {trigger}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <SheetHeader>
            <SheetTitle>Compartilhar corrida</SheetTitle>
            <SheetDescription>
              Poste direto no Instagram ou envie o link para sua turma.
            </SheetDescription>
          </SheetHeader>

          {/* Instagram image generation */}
          <div className="px-4 pt-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Postar no Instagram
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleGenerateImage("post")}
                disabled={generating !== null}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left hover:border-[#F59E0B] transition-colors cursor-pointer disabled:opacity-60"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shrink-0">
                  {generating === "post" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-[#0D1B2A]">Postar no Feed</span>
                  <span className="text-xs text-muted-foreground">Imagem 1080×1350</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerateImage("story")}
                disabled={generating !== null}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left hover:border-[#F59E0B] transition-colors cursor-pointer disabled:opacity-60"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shrink-0">
                  {generating === "story" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Instagram className="h-5 w-5" />
                  )}
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-[#0D1B2A]">Postar no Story</span>
                  <span className="text-xs text-muted-foreground">Imagem 1080×1920</span>
                </span>
              </button>
            </div>
          </div>

          <div className="px-4 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Compartilhar link
            </p>
            <div className="grid grid-cols-3 gap-3 pb-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex flex-col items-center gap-1.5 text-xs font-medium text-[#0D1B2A] hover:opacity-80"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6">
                    <path
                      fill="#fff"
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"
                    />
                  </svg>
                </span>
                WhatsApp
              </a>

              <a
                href={facebookHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex flex-col items-center gap-1.5 text-xs font-medium text-[#0D1B2A] hover:opacity-80"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1877F2]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6">
                    <path
                      fill="#fff"
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </svg>
                </span>
                Facebook
              </a>

              <button
                type="button"
                onClick={() => copyToClipboard(shareUrl, "Link copiado!")}
                className="flex flex-col items-center gap-1.5 text-xs font-medium text-[#0D1B2A] hover:opacity-80 cursor-pointer"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-700">
                  {copied ? <Check className="h-6 w-6" /> : <Copy className="h-5 w-5" />}
                </span>
                Copiar link
              </button>
            </div>

            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <button
                type="button"
                onClick={shareViaSystem}
                className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-[#0D1B2A] transition-colors hover:bg-gray-50 cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                Mais apps...
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

"use client";

import Image from "next/image";
import { Check, Copy, Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LARGADA_PIX_PAYLOAD } from "@/lib/pix";

export function SupportLargada() {
  const [copied, setCopied] = useState(false);

  async function copyPixCode() {
    try {
      await navigator.clipboard.writeText(LARGADA_PIX_PAYLOAD);
      setCopied(true);
      toast.success("Código Pix copiado");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar. Escaneie o QR Code pelo aplicativo do banco.");
    }
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      <p className="text-xs font-semibold text-[#0D1B2A]">O Largada te ajudou?</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        Uma contribuição opcional ajuda a manter o calendário gratuito e atualizado.
      </p>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full border-[#FF4D00]/30 bg-white font-semibold text-[#C83D00] hover:border-[#FF4D00] hover:bg-[#FFF5F0] hover:text-[#A63200]"
          >
            <Heart className="mr-2 h-4 w-4" aria-hidden="true" />
            Apoiar o Largada
          </Button>
        </DialogTrigger>

        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border-slate-200 p-5 sm:max-w-md sm:p-6">
          <DialogHeader className="pr-7 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FF4D00]">Apoio voluntário</p>
            <DialogTitle className="text-2xl font-extrabold tracking-tight text-[#0D1B2A]">
              Ajude a manter o Largada
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              Escaneie o QR Code e escolha qualquer valor no aplicativo do seu banco.
            </DialogDescription>
          </DialogHeader>

          <div className="mx-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <Image
              src="/pix-largada.svg"
              alt="QR Code Pix para apoiar o Largada"
              width={256}
              height={256}
              className="h-auto w-56 sm:w-64"
              priority
            />
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Recebedor</p>
            <p className="mt-1 text-sm font-bold text-[#0D1B2A]">Pablo Ferreira</p>
            <p className="mt-0.5 text-xs text-slate-500">Chave Pix CPF: 388.040.058-07</p>
          </div>

          <Button type="button" onClick={copyPixCode} className="h-11 w-full bg-[#0D1B2A] font-bold text-white hover:bg-[#162B40]">
            {copied ? <Check className="mr-2 h-4 w-4" aria-hidden="true" /> : <Copy className="mr-2 h-4 w-4" aria-hidden="true" />}
            {copied ? "Código copiado" : "Copiar código Pix"}
          </Button>

          <p className="text-center text-[11px] leading-relaxed text-slate-500">
            O apoio é opcional e não interfere na inscrição da corrida, que acontece diretamente com o organizador.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

const PLAN_META: Record<string, { label: string; price: string; duration: string }> = {
  express: { label: "Express", price: "R$ 49", duration: "7 dias" },
  standard: { label: "Total", price: "R$ 149", duration: "30 dias" },
  organizador: { label: "Organizador", price: "R$ 349", duration: "3 destaques" },
  organizador_pro: { label: "Organizador Pro", price: "R$ 699", duration: "8 destaques" },
};

export function SucessoClient({ tier }: { tier?: string }) {
  const { user, profile } = useAuth();
  const [raceName, setRaceName] = useState("");
  const [contact, setContact] = useState(user?.email ?? "");
  const [sent, setSent] = useState(false);

  const plan = tier ? PLAN_META[tier] : null;
  const planLabel = plan?.label ?? "Plano";

  const handleSend = () => {
    if (!raceName.trim()) return;

    const msg = encodeURIComponent(
      `🏃 Solicitação de destaque!\n\nPlano: ${planLabel}${plan ? ` (${plan.price} · ${plan.duration})` : ""}\nCorrida: ${raceName.trim()}\nContato: ${contact.trim() || "não informado"}`
    );

    window.open(`https://wa.me/5517988282542?text=${msg}`, "_blank");
    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center space-y-4 py-8">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Solicitação enviada!</h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Entraremos em contato para confirmar e aplicar o destaque da sua corrida em breve.
        </p>
        <Link href="/corridas" className="inline-block text-sm font-medium text-[#FF4D00] hover:underline">
          Ver corridas →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Pagamento confirmado!</h1>
        {plan && (
          <p className="text-sm text-muted-foreground">
            Plano <strong>{plan.label}</strong> — {plan.price} · {plan.duration}
          </p>
        )}
      </div>

      <div className="rounded-xl border p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-[#0D1B2A]">Qual corrida quer destacar?</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Informe abaixo e fale conosco via WhatsApp para aplicarmos o destaque.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="race-name">Nome da corrida *</Label>
          <Input
            id="race-name"
            placeholder="Ex: Corrida de São João 2026"
            value={raceName}
            onChange={e => setRaceName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact">Seu contato (e-mail ou WhatsApp)</Label>
          <Input
            id="contact"
            placeholder="email@exemplo.com ou (17) 99999-9999"
            value={contact}
            onChange={e => setContact(e.target.value)}
          />
        </div>

        <Button
          className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold"
          disabled={!raceName.trim()}
          onClick={handleSend}
        >
          Enviar solicitação via WhatsApp
        </Button>
      </div>
    </div>
  );
}

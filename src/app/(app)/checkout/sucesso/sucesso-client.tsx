"use client";

import { useState } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

const PLAN_META: Record<string, { label: string; price: string; duration: string; maxRaces: number }> = {
  express:        { label: "Express",        price: "R$ 49",  duration: "7 dias",     maxRaces: 1 },
  standard:       { label: "Total",          price: "R$ 149", duration: "30 dias",    maxRaces: 1 },
  organizador:    { label: "Organizador",    price: "R$ 349", duration: "3 destaques", maxRaces: 3 },
  organizador_pro:{ label: "Organizador Pro",price: "R$ 699", duration: "8 destaques", maxRaces: 8 },
};

export function SucessoClient({ tier }: { tier?: string }) {
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [whatsapp, setWhatsapp] = useState("");
  const [races, setRaces] = useState([""]);
  const [sent, setSent] = useState(false);

  const plan = tier ? PLAN_META[tier] : null;
  const isMulti = (plan?.maxRaces ?? 1) > 1;

  const addRace = () => {
    if (races.length < (plan?.maxRaces ?? 1)) setRaces([...races, ""]);
  };

  const updateRace = (i: number, val: string) => {
    const next = [...races];
    next[i] = val;
    setRaces(next);
  };

  const removeRace = (i: number) => {
    setRaces(races.filter((_, idx) => idx !== i));
  };

  const filledRaces = races.filter(r => r.trim());
  const canSubmit = name.trim() && whatsapp.trim() && filledRaces.length > 0;

  const handleSend = () => {
    if (!canSubmit) return;

    const raceLines = filledRaces.map((r, i) => `Corrida ${i + 1}: ${r.trim()}`).join("\n");
    const msg = encodeURIComponent(
      `🏃 Solicitação de destaque!\n\nPlano: ${plan?.label ?? tier}${plan ? ` (${plan.price} · ${plan.duration})` : ""}\n\n${raceLines}\n\nNome: ${name.trim()}\nWhatsApp: ${whatsapp.trim()}`
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
          Entraremos em contato pelo WhatsApp para confirmar e aplicar o destaque.
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
          <h2 className="font-semibold text-[#0D1B2A]">
            {isMulti ? "Quais corridas quer destacar?" : "Qual corrida quer destacar?"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Preencha abaixo e envie via WhatsApp — aplicaremos o destaque em breve.
          </p>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Seu nome *</Label>
          <Input
            id="name"
            placeholder="João Silva"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* WhatsApp */}
        <div className="space-y-2">
          <Label htmlFor="whatsapp">Seu WhatsApp *</Label>
          <Input
            id="whatsapp"
            placeholder="(17) 99999-9999"
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
          />
        </div>

        {/* Race(s) */}
        <div className="space-y-3">
          <Label>{isMulti ? `Corridas (até ${plan?.maxRaces}) *` : "Nome da corrida *"}</Label>
          {races.map((race, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder={`Ex: Corrida de São João 2026`}
                value={race}
                onChange={e => updateRace(i, e.target.value)}
              />
              {isMulti && races.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeRace(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {isMulti && races.length < (plan?.maxRaces ?? 1) && (
            <button
              type="button"
              onClick={addRace}
              className="flex items-center gap-1.5 text-xs text-[#FF4D00] hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar corrida
            </button>
          )}
        </div>

        <Button
          className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold"
          disabled={!canSubmit}
          onClick={handleSend}
        >
          Enviar solicitação via WhatsApp
        </Button>
      </div>
    </div>
  );
}

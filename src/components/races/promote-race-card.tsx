"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { todayInBrazil } from "@/lib/date";
import type { OrganizerSubscription } from "@/types/subscription";

interface PromoteRaceCardProps {
  raceId: string;
  raceName: string;
  isPromoted: boolean;
  /** Whether the current user is the race creator. Defaults to true for backward compat. */
  isOwner?: boolean;
  /** "sidebar" renders a full card; "button" renders an inline action */
  variant?: "sidebar" | "button";
  /** Active subscription, if any. Enables "promote via plan" flow. */
  subscription?: OrganizerSubscription | null;
  /** Registration deadline (YYYY-MM-DD). Used to disable promotion for expired races. */
  registrationDeadline?: string;
}

export function PromoteRaceCard({
  raceId,
  raceName,
  isPromoted,
  isOwner = true,
  variant = "sidebar",
  subscription,
  registrationDeadline,
}: PromoteRaceCardProps) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsCustomer, setNeedsCustomer] = useState(false);
  const [taxId, setTaxId] = useState("");
  const [cellphone, setCellphone] = useState("");

  const hasSubscription = !!subscription;
  const hasCredits =
    hasSubscription &&
    subscription.promotions_used < subscription.promotions_limit;

  // Promote via subscription (no payment needed)
  const handlePromoteWithSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/races/${raceId}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useSubscription: true }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao destacar corrida.");
        return;
      }

      toast.success("Corrida destacada com sucesso!");
      window.location.reload();
    } catch {
      toast.error("Erro ao destacar corrida. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Promote via one-time payment (redirect to AbacatePay)
  const handlePromote = async (customer?: { name: string; email: string; taxId: string; cellphone: string }) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/races/${raceId}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer ? { customer } : {}),
      });

      if (res.status === 422) {
        // Customer data needed — show form fields in the dialog
        setNeedsCustomer(true);
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao criar cobrança.");
        return;
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch {
      toast.error("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteWithCustomer = async () => {
    if (!taxId.trim() || !cellphone.trim()) {
      toast.error("Preencha CPF/CNPJ e celular.");
      return;
    }
    await handlePromote({
      name: profile?.full_name || "",
      email: user?.email || "",
      taxId: taxId.trim(),
      cellphone: cellphone.trim(),
    });
  };

  // Already promoted
  if (isPromoted) {
    if (variant === "button") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 border border-yellow-200 px-2.5 py-1 text-xs font-semibold text-yellow-700">
          <Star className="w-3 h-3 fill-yellow-500" />
          Em Destaque
        </span>
      );
    }
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          <h3 className="font-semibold text-yellow-800">Corrida em Destaque</h3>
        </div>
        <p className="text-xs text-yellow-700">
          Esta corrida está aparecendo em destaque para todos os atletas.
        </p>
      </div>
    );
  }

  // Registration closed — disable promotion
  const isExpired = registrationDeadline ? registrationDeadline < todayInBrazil() : false;
  if (isExpired) {
    if (variant === "button") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500">
          Inscrições encerradas
        </span>
      );
    }
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-gray-400" />
          <h3 className="font-semibold text-gray-600">Inscrições encerradas</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Não é possível destacar uma corrida com inscrições encerradas.
        </p>
      </div>
    );
  }

  // Confirmation dialog with optional customer form
  const paymentDialog = (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setNeedsCustomer(false);
        setTaxId("");
        setCellphone("");
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Destacar corrida</DialogTitle>
          <DialogDescription>
            {needsCustomer
              ? "Precisamos do seu CPF/CNPJ e celular para processar o pagamento."
              : "Sua corrida aparecerá com o badge ⭐ Destaque e será exibida no topo da listagem por 30 dias."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Race + price summary */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#0D1B2A] line-clamp-1">
                {raceName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Destaque por 30 dias
              </p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <span className="text-lg font-bold text-[#0D1B2A]">R$ 149,00</span>
              <p className="text-xs text-muted-foreground">pagamento único</p>
            </div>
          </div>

          {needsCustomer && (
            <>
              <div className="space-y-2">
                <Label htmlFor="promote-taxId">CPF/CNPJ</Label>
                <Input
                  id="promote-taxId"
                  placeholder="000.000.000-00"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promote-cellphone">Celular</Label>
                <Input
                  id="promote-cellphone"
                  placeholder="(11) 99999-9999"
                  value={cellphone}
                  onChange={(e) => setCellphone(e.target.value)}
                />
              </div>
            </>
          )}

          {!needsCustomer && (
            <p className="text-xs text-muted-foreground">
              Você será redirecionado para a página de pagamento seguro. Aceitamos
              PIX e cartão de crédito.
            </p>
          )}

          <Button
            className="w-full"
            onClick={needsCustomer ? handlePromoteWithCustomer : () => handlePromote()}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {needsCustomer ? "Continuar para pagamento" : "Ir para pagamento"}
                <ExternalLink className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // -- BUTTON VARIANT --
  if (variant === "button") {
    // Subscription with credits: one-click promote
    if (hasCredits) {
      return (
        <Button
          size="sm"
          variant="outline"
          className="border-green-200 text-green-700 hover:bg-green-50"
          onClick={handlePromoteWithSubscription}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Star className="mr-1.5 h-3.5 w-3.5" />
          )}
          Destacar (plano)
        </Button>
      );
    }

    // Subscription exhausted
    if (hasSubscription && !hasCredits) {
      return (
        <>
          <Button
            size="sm"
            variant="outline"
            className="border-orange-200 text-[#FF4D00] hover:bg-orange-50"
            onClick={() => setOpen(true)}
          >
            <Star className="mr-1.5 h-3.5 w-3.5" />
            Destacar (R$ 149)
          </Button>
          {paymentDialog}
        </>
      );
    }

    // No subscription
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          className="border-orange-200 text-[#FF4D00] hover:bg-orange-50"
          onClick={() => setOpen(true)}
        >
          <Star className="mr-1.5 h-3.5 w-3.5" />
          Destacar
        </Button>
        {paymentDialog}
      </>
    );
  }

  // -- SIDEBAR VARIANT — non-owner --
  if (!isOwner) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-[#FF4D00]" />
          <h3 className="font-semibold text-[#0D1B2A]">Destacar esta corrida</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Interessado em destacar esta corrida? Entre em contato com o organizador.
        </p>
      </div>
    );
  }

  // -- SIDEBAR VARIANT — owner with subscription credits --
  if (hasCredits) {
    const remaining =
      subscription!.promotions_limit - subscription!.promotions_used;
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-green-600" />
          <h3 className="font-semibold text-green-900">Destacar esta corrida</h3>
        </div>
        <p className="text-xs text-green-700">
          Incluso no seu plano — {remaining} destaque{remaining !== 1 ? "s" : ""}{" "}
          disponíve{remaining !== 1 ? "is" : "l"}.
        </p>
        <Button
          className="w-full cursor-pointer"
          variant="outline"
          onClick={handlePromoteWithSubscription}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Star className="mr-2 h-4 w-4" />
          )}
          Destacar corrida
        </Button>
      </div>
    );
  }

  // -- SIDEBAR VARIANT — owner, no credits / no subscription --
  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-[#FF4D00]" />
          <h3 className="font-semibold text-[#0D1B2A]">Destacar esta corrida</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Apareça no topo da listagem e ganhe mais visibilidade para os atletas.
        </p>
        <p className="text-sm font-semibold text-[#0D1B2A]">
          R$ 149,00{" "}
          <span className="text-xs font-normal text-muted-foreground">
            por 30 dias
          </span>
        </p>
        <Button className="w-full cursor-pointer" variant="outline" onClick={() => setOpen(true)}>
          <Star className="mr-2 h-4 w-4" />
          Destacar corrida
        </Button>
        {!hasSubscription && (
          <Link
            href="/perfil/assinatura"
            className="block text-center text-xs text-muted-foreground hover:text-[#FF4D00] transition-colors"
          >
            Economize com um plano de organizador &rarr;
          </Link>
        )}
      </div>
      {paymentDialog}
    </>
  );
}

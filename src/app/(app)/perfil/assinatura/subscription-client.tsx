"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, Loader2, ExternalLink, Check, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
  type OrganizerSubscription,
  type SubscriptionConfig,
} from "@/types/subscription";

const tiers = Object.values(SUBSCRIPTION_TIERS);

export function SubscriptionClient({ initialTier, paymentSuccess }: { initialTier?: string; paymentSuccess?: boolean }) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [subscription, setSubscription] =
    useState<OrganizerSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingTier, setSubmittingTier] = useState<SubscriptionTier | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [taxId, setTaxId] = useState("");
  const [cellphone, setCellphone] = useState("");
  const hasAutoOpened = useRef(false);
  const avulsoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSubscription(retries = 0): Promise<void> {
      try {
        const res = await fetch("/api/subscriptions/status");
        if (res.ok) {
          const data = await res.json();
          if (data.subscription) {
            setSubscription(data.subscription);
            return;
          }
          // If paymentSuccess but no subscription yet, poll a few times
          if (paymentSuccess && retries < 8 && !cancelled) {
            await new Promise((r) => setTimeout(r, 3000));
            return fetchSubscription(retries + 1);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchSubscription();

    return () => { cancelled = true; };
  }, [paymentSuccess]);

  // Auto-scroll to avulso based on URL tier param
  useEffect(() => {
    if (isLoading || hasAutoOpened.current || subscription) return;
    if (!initialTier) return;
    hasAutoOpened.current = true;

    if (initialTier === "organizador" || initialTier === "organizador_pro") {
      const config = SUBSCRIPTION_TIERS[initialTier as SubscriptionTier];
      if (config) {
        handleSubscribe(initialTier as SubscriptionTier);
      }
    } else if (initialTier === "avulso" && avulsoRef.current) {
      avulsoRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Clean tier param from URL to prevent re-trigger on back navigation
    router.replace("/perfil/assinatura");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, initialTier, subscription]);

  async function handleSubscribe(tier: SubscriptionTier, customer?: { name: string; email: string; taxId: string; cellphone: string }) {
    setSubmittingTier(tier);

    try {
      const res = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, ...(customer ? { customer } : {}) }),
      });

      if (res.status === 422) {
        // Customer data needed — open dialog
        setSelectedTier(tier);
        setDialogOpen(true);
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
      setSubmittingTier(null);
    }
  }

  const handleDialogSubmit = async () => {
    if (!selectedTier) return;
    if (!taxId.trim() || !cellphone.trim()) {
      toast.error("Preencha CPF/CNPJ e celular.");
      return;
    }

    await handleSubscribe(selectedTier, {
      name: profile?.full_name || "",
      email: user?.email || "",
      taxId: taxId.trim(),
      cellphone: cellphone.trim(),
    });

    if (!dialogOpen) {
      // Successfully redirected — dialog was not re-opened
      setTaxId("");
      setCellphone("");
    }
  };

  if (isLoading) {
    // Show processing state when returning from payment
    if (paymentSuccess) {
      return (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 space-y-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto" />
          <h2 className="text-lg font-semibold text-green-900">Processando pagamento...</h2>
          <p className="text-sm text-green-700">
            Estamos confirmando seu pagamento. Isso pode levar alguns segundos.
          </p>
        </div>
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  // Payment succeeded but webhook hasn't processed yet (polling exhausted)
  if (paymentSuccess && !subscription) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-green-900">Pagamento recebido!</h2>
        </div>
        <p className="text-sm text-green-700">
          Seu pagamento foi realizado com sucesso. O plano será ativado em instantes.
          Atualize a página em alguns segundos para ver seu plano ativo.
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.location.reload()}
        >
          Atualizar página
        </Button>
      </div>
    );
  }

  // Active subscription view
  if (subscription) {
    const config = SUBSCRIPTION_TIERS[subscription.tier];
    const remaining =
      subscription.promotions_limit - subscription.promotions_used;
    const expiresDate = new Date(
      subscription.current_period_end
    ).toLocaleDateString("pt-BR");

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-green-600 text-green-600" />
            <h2 className="text-lg font-semibold text-green-900">
              Plano {config.label} ativo
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-green-700">Destaques disponíveis</p>
              <p className="text-2xl font-bold text-green-900">
                {remaining}
                <span className="text-sm font-normal text-green-700">
                  {" "}
                  de {subscription.promotions_limit}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-green-700">Válido até</p>
              <p className="text-lg font-semibold text-green-900">
                {expiresDate}
              </p>
            </div>
          </div>

          <p className="text-xs text-green-700">
            Destaque suas corridas na aba &quot;Criadas&quot; em Minhas Corridas.
            Ao expirar, você pode adquirir um novo pacote.
          </p>

          <Link href="/perfil/minhas-corridas?tab=created">
            <Button variant="outline" className="w-full cursor-pointer">
              Ir para Minhas Corridas → Criadas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // No subscription — show tier cards
  return (
    <>
      <p className="text-sm text-muted-foreground mb-6">
        Destaque múltiplas corridas com desconto. Cada pacote dá créditos de
        destaque válidos por 30 dias.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {tiers.map((tier) => (
          <TierCard
            key={tier.tier}
            config={tier}
            isSubmitting={submittingTier === tier.tier}
            onSelect={() => handleSubscribe(tier.tier)}
          />
        ))}
      </div>

      <div
        ref={avulsoRef}
        className={`mt-6 rounded-xl border p-6 space-y-3 ${initialTier === "avulso"
          ? "border-[#FF4D00] ring-2 ring-[#FF4D00]/30 bg-orange-50/30"
          : "border-gray-200 bg-gray-50"
          }`}
      >
        <h3 className="text-base font-semibold text-[#0D1B2A]">Avulso</h3>
        <p className="text-sm text-muted-foreground">
          Destaque uma corrida por{" "}
          <span className="font-semibold text-[#0D1B2A]">R$ 149,00</span>{" "}
          (pagamento único). Selecione a corrida que deseja destacar.
        </p>
        <Link href="/perfil/minhas-corridas">
          <Button variant="outline" className="w-full cursor-pointer">
            Escolher corrida para destacar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) setSubmittingTier(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dados para pagamento</DialogTitle>
            <DialogDescription>
              Precisamos do seu CPF/CNPJ e celular para processar o pagamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taxId">CPF/CNPJ</Label>
              <Input
                id="taxId"
                placeholder="000.000.000-00"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cellphone">Celular</Label>
              <Input
                id="cellphone"
                placeholder="(11) 99999-9999"
                value={cellphone}
                onChange={(e) => setCellphone(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleDialogSubmit}
              disabled={submittingTier !== null}
            >
              {submittingTier ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  Continuar para pagamento
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TierCard({
  config,
  isSubmitting,
  onSelect,
}: {
  config: SubscriptionConfig;
  isSubmitting: boolean;
  onSelect: () => void;
}) {
  const isPopular = config.tier === "organizador";
  const savingsPercent = Math.round(
    (1 - config.priceInCentavos / (14900 * config.promotionsPerMonth)) * 100
  );

  return (
    <div
      className={`rounded-xl border p-6 space-y-4 ${isPopular
        ? "border-[#FF4D00] bg-orange-50/50"
        : "border-gray-200 bg-white"
        }`}
    >
      {isPopular && (
        <span className="inline-block rounded-full bg-[#FF4D00] px-2.5 py-0.5 text-xs font-semibold text-white">
          Mais popular
        </span>
      )}
      <div>
        <h3 className="text-lg font-semibold text-[#0D1B2A]">
          {config.label}
        </h3>
        <p className="text-sm text-muted-foreground">
          Até {config.promotionsPerMonth} corridas em destaque
        </p>
      </div>

      <div>
        <span className="text-3xl font-bold text-[#0D1B2A]">
          {config.priceDisplay}
        </span>
        <span className="text-sm text-muted-foreground"> / pagamento único</span>
        <p className="text-xs text-muted-foreground mt-1">
          Créditos válidos por 30 dias
        </p>
      </div>

      <ul className="space-y-2 text-sm">
        <li className="flex items-start gap-2">
          <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          <span>
            {config.promotionsPerMonth} destaques inclusos
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          <span>~{savingsPercent}% de economia vs. avulso</span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          <span>Destaque instantâneo (sem pagamento por corrida)</span>
        </li>
      </ul>

      <Button
        className="w-full cursor-pointer"
        variant={isPopular ? "default" : "outline"}
        onClick={onSelect}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            Adquirir {config.label}
            <ExternalLink className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}

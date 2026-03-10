"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, Loader2, ExternalLink, Check, ArrowRight } from "lucide-react";
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
import {
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
  type OrganizerSubscription,
  type SubscriptionConfig,
} from "@/types/subscription";

const tiers = Object.values(SUBSCRIPTION_TIERS);

export function SubscriptionClient({ initialTier }: { initialTier?: string }) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] =
    useState<OrganizerSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<SubscriptionConfig | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const hasAutoOpened = useRef(false);
  const avulsoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch("/api/subscriptions/status");
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.subscription);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
    fetchSubscription();
  }, []);

  // Auto-open dialog or scroll to avulso based on URL tier param
  useEffect(() => {
    if (isLoading || hasAutoOpened.current || subscription) return;
    if (!initialTier) return;
    hasAutoOpened.current = true;

    if (initialTier === "organizador" || initialTier === "organizador_pro") {
      const config = SUBSCRIPTION_TIERS[initialTier as SubscriptionTier];
      if (config) {
        handleOpenDialog(config);
      }
    } else if (initialTier === "avulso" && avulsoRef.current) {
      avulsoRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Clean tier param from URL to prevent re-trigger on back navigation
    router.replace("/perfil/assinatura");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, initialTier, subscription]);

  const handleOpenDialog = (tier: SubscriptionConfig) => {
    setSelectedTier(tier);
    setName(profile?.full_name ?? "");
    setEmail(user?.email ?? "");
    setDialogOpen(true);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: selectedTier.tier,
          customer: {
            name: name.trim(),
            email: email.trim(),
            taxId: cpf.replace(/\D/g, ""),
            cellphone: phone.replace(/\D/g, ""),
          },
        }),
      });

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
      setSubmitting(false);
    }
  };

  if (isLoading) return null;

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
            onSelect={() => handleOpenDialog(tier)}
          />
        ))}
      </div>

      <div
        ref={avulsoRef}
        className={`mt-6 rounded-xl border p-6 space-y-3 ${
          initialTier === "avulso"
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

      {/* Payment dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assinar Plano {selectedTier?.label}
            </DialogTitle>
            <DialogDescription>
              {selectedTier?.promotionsPerMonth} corridas em destaque por 30
              dias.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubscribe} className="space-y-4">
            {/* Plan summary */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#0D1B2A]">
                  Plano {selectedTier?.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedTier?.promotionsPerMonth} destaques por 30 dias
                </p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <span className="text-lg font-bold text-[#0D1B2A]">
                  {selectedTier?.priceDisplay}
                </span>
                <p className="text-xs text-muted-foreground">
                  pagamento único
                </p>
              </div>
            </div>

            {/* Customer data */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Dados para cobrança
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label htmlFor="sub-name">Nome completo</Label>
                  <Input
                    id="sub-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    required
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <Label htmlFor="sub-email">E-mail</Label>
                  <Input
                    id="sub-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sub-cpf">CPF</Label>
                  <Input
                    id="sub-cpf"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    required
                    minLength={11}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="sub-phone">Celular</Label>
                  <Input
                    id="sub-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    required
                    minLength={10}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Você será redirecionado para a página de pagamento seguro.
              Aceitamos PIX e cartão de crédito.
            </p>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  Ir para pagamento
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TierCard({
  config,
  onSelect,
}: {
  config: SubscriptionConfig;
  onSelect: () => void;
}) {
  const isPro = config.tier === "organizador_pro";
  const savingsPerRace = Math.round(
    14900 - config.priceInCentavos / config.promotionsPerMonth
  );
  const savingsPercent = Math.round(
    (1 - config.priceInCentavos / (14900 * config.promotionsPerMonth)) * 100
  );

  return (
    <div
      className={`rounded-xl border p-6 space-y-4 ${
        isPro
          ? "border-[#FF4D00] bg-orange-50/50"
          : "border-gray-200 bg-white"
      }`}
    >
      {isPro && (
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
        <span className="text-sm text-muted-foreground"> /30 dias</span>
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
        variant={isPro ? "default" : "outline"}
        onClick={onSelect}
      >
        <Star className="mr-2 h-4 w-4" />
        Assinar {config.label}
      </Button>
    </div>
  );
}

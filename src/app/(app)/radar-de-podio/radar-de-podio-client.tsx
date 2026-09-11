"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CityAutocomplete } from "@/components/onboarding/city-autocomplete";
import { useAuth } from "@/contexts/auth-context";
import { useLoginModal } from "@/contexts/login-modal-context";
import { toast } from "sonner";
import {
  DEFAULT_DISTANCES,
  RADAR_AGE_CATEGORIES,
} from "@/lib/constants";
import {
  buildRadarWhatsAppUrl as buildWhatsAppUrl,
  EMPTY_RADAR_FORM as EMPTY_FORM,
  formatRadarPace as formatPace,
  isValidRadarPace as isValidPace,
  RADAR_BILLING_STORAGE_KEY as LS_BILLING_KEY,
  type RadarFormData as FormData,
  type RadarStep as Step,
} from "@/lib/radar-form";
import {
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Gauge,
  Users,
  MapPin,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Loader2,
  ExternalLink,
} from "lucide-react";

export function RadarDePodioClient() {
  const { user, profile } = useAuth();
  const { openLogin } = useLoginModal();
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [paidForm, setPaidForm] = useState<FormData | null>(null);
  const [paying, setPaying] = useState(false);
  const [taxId, setTaxId] = useState("");
  const [cellphone, setCellphone] = useState("");
  const verifyingRef = useRef(false);

  const isFormValid =
    isValidPace(form.pace) &&
    form.distance !== "" &&
    form.category !== "" &&
    form.sex !== "" &&
    form.city !== "";

  const verifyPayment = useCallback(async (billingId: string) => {
    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetch(`/api/radar/status?id=${billingId}`);
        if (res.ok) {
          const data = (await res.json()) as {
            status: string;
            form: Record<string, string> | null;
          };
          if (data.status === "PAID") {
            if (data.form) {
              setPaidForm({
                ...EMPTY_FORM,
                pace: data.form.pace ?? "",
                distance: data.form.distance ?? "",
                category: data.form.category ?? "",
                sex: data.form.sex ?? "",
                city: data.form.city ?? "",
              });
            }
            window.localStorage.removeItem(LS_BILLING_KEY);
            setStep("paid");
            return;
          }
        }
      } catch {
        // continue polling
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
    toast.error(
      "Não conseguimos confirmar seu pagamento agora. Se você foi cobrado, recarregue a página."
    );
    setStep("form");
  }, []);

  // Detect return from AbacatePay (?paid=sucesso) and start verifying.
  useEffect(() => {
    if (verifyingRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") !== "sucesso") return;
    const billingId = window.localStorage.getItem(LS_BILLING_KEY);
    if (!billingId) return;
    verifyingRef.current = true;
    // This effect synchronizes the UI with payment state stored by the external checkout.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep("verifying");
    void verifyPayment(billingId);
    window.history.replaceState({}, "", window.location.pathname);
  }, [verifyPayment]);

  const handleCheckout = useCallback(
    async (customer?: {
      name: string;
      email: string;
      taxId: string;
      cellphone: string;
    }) => {
      setPaying(true);
      try {
        const res = await fetch("/api/radar/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            form: {
              pace: form.pace,
              distance: form.distance,
              category: form.category,
              sex: form.sex,
              city: form.city,
            },
            ...(customer ? { customer } : {}),
          }),
        });

        if (res.status === 401) {
          toast.error("Faça login para continuar.");
          openLogin();
          return;
        }

        if (res.status === 422) {
          setStep("customer");
          return;
        }

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err?.error || "Erro ao iniciar pagamento.");
          return;
        }

        const data = (await res.json()) as {
          billingId: string;
          url: string;
        };
        window.localStorage.setItem(LS_BILLING_KEY, data.billingId);
        window.location.href = data.url;
      } catch {
        toast.error("Erro ao iniciar pagamento. Tente novamente.");
      } finally {
        setPaying(false);
      }
    },
    [form, openLogin]
  );

  const handleSubmitCustomer = useCallback(async () => {
    if (!taxId.trim() || !cellphone.trim()) {
      toast.error("Preencha CPF/CNPJ e celular.");
      return;
    }
    await handleCheckout({
      name: profile?.full_name || "Atleta Largada",
      email: user?.email || "",
      taxId: taxId.trim(),
      cellphone: cellphone.trim(),
    });
  }, [taxId, cellphone, profile?.full_name, user?.email, handleCheckout]);

  const handleOpenWhatsApp = useCallback(() => {
    const formToUse = paidForm ?? form;
    window.open(buildWhatsAppUrl(formToUse), "_blank");
    setStep("success");
  }, [form, paidForm]);

  const handleReset = useCallback(() => {
    setStep("form");
    setForm(EMPTY_FORM);
    setPaidForm(null);
    setTaxId("");
    setCellphone("");
  }, []);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF4D00]/10">
          <Crosshair className="h-5 w-5 text-[#FF4D00]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#0D1B2A]">
            Curadoria de Corridas
          </h1>
          <p className="text-xs text-muted-foreground">
            Encontre as melhores provas para o seu perfil
          </p>
        </div>
      </div>

      {step === "form" && (
        <FormStep
          form={form}
          setForm={setForm}
          isValid={isFormValid}
          onContinue={() => setStep("confirm")}
        />
      )}

      {step === "confirm" && (
        <ConfirmStep
          form={form}
          paying={paying}
          onPay={() => {
            if (!user) {
              openLogin();
              return;
            }
            handleCheckout();
          }}
          onBack={() => setStep("form")}
        />
      )}

      {step === "customer" && (
        <CustomerStep
          taxId={taxId}
          setTaxId={setTaxId}
          cellphone={cellphone}
          setCellphone={setCellphone}
          paying={paying}
          onSubmit={handleSubmitCustomer}
          onBack={() => setStep("confirm")}
        />
      )}

      {step === "verifying" && <VerifyingStep />}

      {step === "paid" && (
        <PaidStep
          form={paidForm ?? form}
          onOpenWhatsApp={handleOpenWhatsApp}
        />
      )}

      {step === "success" && <SuccessStep onReset={handleReset} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Steps
// ─────────────────────────────────────────────────────────────────────────────

function FormStep({
  form,
  setForm,
  isValid,
  onContinue,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  isValid: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-5">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[#FF4D00]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-[#0D1B2A]">
              Performance
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Pace (mm:ss/km)
              </label>
              <Input
                placeholder="05:30"
                value={form.pace}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    pace: formatPace(e.target.value),
                  }))
                }
                maxLength={5}
                inputMode="numeric"
                className="h-10 w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Distância
              </label>
              <Select
                value={form.distance}
                onValueChange={(v) => setForm((f) => ({ ...f, distance: v }))}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_DISTANCES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-[#FF4D00]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-[#0D1B2A]">
              Categoria
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Sexo
              </label>
              <Select
                value={form.sex}
                onValueChange={(v) => setForm((f) => ({ ...f, sex: v }))}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Faixa etária
              </label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {RADAR_AGE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        <div>
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#FF4D00]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-[#0D1B2A]">
              Localização
            </span>
          </div>
          <CityAutocomplete
            onSelect={(city) =>
              setForm((f) => ({
                ...f,
                city: `${city.name} - ${city.state_code}`,
                cityId: city.id,
                state: city.state_code,
                latitude: city.latitude,
                longitude: city.longitude,
              }))
            }
            onClear={() =>
              setForm((f) => ({
                ...f,
                city: "",
                cityId: null,
                state: null,
                latitude: null,
                longitude: null,
              }))
            }
            placeholder="Digite sua cidade..."
          />
        </div>
      </div>

      <Button
        onClick={onContinue}
        disabled={!isValid}
        className="w-full bg-[#FF4D00] hover:bg-[#E04500]"
        size="lg"
      >
        Continuar
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function ConfirmStep({
  form,
  paying,
  onPay,
  onBack,
}: {
  form: FormData;
  paying: boolean;
  onPay: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#0D1B2A]">
          Revise seus dados
        </p>
        <div className="space-y-2 text-sm text-muted-foreground">
          <Row label="Pace" value={`${form.pace}/km`} />
          <Row label="Distância" value={form.distance} />
          <Row
            label="Sexo"
            value={form.sex === "masculino" ? "Masculino" : "Feminino"}
          />
          <Row label="Faixa etária" value={form.category} />
          <Row label="Cidade" value={form.city} />
        </div>
      </div>

      <div className="rounded-xl border-2 border-[#FF4D00]/30 bg-gradient-to-br from-[#FF4D00]/5 to-orange-50 p-5">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#FF4D00]" />
          <p className="text-sm font-bold text-[#0D1B2A]">
            Curadoria personalizada
          </p>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Pague R$ 29,90 e um especialista vai analisar seu perfil e recomendar
          as melhores corridas para você. Retorno em até 48h via WhatsApp.
        </p>
        <p className="text-center text-lg font-bold text-[#0D1B2A]">R$ 29,90</p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          PIX ou cartão · pagamento único
        </p>
      </div>

      <Button
        onClick={onPay}
        disabled={paying}
        className="w-full bg-[#FF4D00] hover:bg-[#E04500]"
        size="lg"
      >
        {paying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Iniciando pagamento...
          </>
        ) : (
          <>
            Pagar R$ 29,90
            <ExternalLink className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      <Button variant="ghost" onClick={onBack} className="w-full" size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar e editar
      </Button>
    </div>
  );
}

function CustomerStep({
  taxId,
  setTaxId,
  cellphone,
  setCellphone,
  paying,
  onSubmit,
  onBack,
}: {
  taxId: string;
  setTaxId: (v: string) => void;
  cellphone: string;
  setCellphone: (v: string) => void;
  paying: boolean;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-[#0D1B2A]">
            Dados para pagamento
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Precisamos do seu CPF/CNPJ e celular para emitir a cobrança.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="radar-taxId">CPF/CNPJ</Label>
          <Input
            id="radar-taxId"
            placeholder="000.000.000-00"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="radar-cellphone">Celular</Label>
          <Input
            id="radar-cellphone"
            placeholder="(11) 99999-9999"
            value={cellphone}
            onChange={(e) => setCellphone(e.target.value)}
          />
        </div>
      </div>

      <Button
        onClick={onSubmit}
        disabled={paying}
        className="w-full bg-[#FF4D00] hover:bg-[#E04500]"
        size="lg"
      >
        {paying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Iniciando pagamento...
          </>
        ) : (
          <>
            Continuar para pagamento
            <ExternalLink className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>

      <Button variant="ghost" onClick={onBack} className="w-full" size="sm">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>
    </div>
  );
}

function VerifyingStep() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
      <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#FF4D00]" />
      <p className="text-sm font-semibold text-[#0D1B2A]">
        Confirmando seu pagamento...
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Pode levar alguns segundos.
      </p>
    </div>
  );
}

function PaidStep({
  form,
  onOpenWhatsApp,
}: {
  form: FormData;
  onOpenWhatsApp: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
        <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-green-600" />
        <p className="text-sm font-semibold text-[#0D1B2A]">
          Pagamento confirmado!
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Agora envie sua solicitação pelo WhatsApp para iniciarmos a curadoria.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#0D1B2A]">
          Seus dados
        </p>
        <div className="space-y-2 text-sm text-muted-foreground">
          <Row label="Pace" value={`${form.pace}/km`} />
          <Row label="Distância" value={form.distance} />
          <Row
            label="Sexo"
            value={form.sex === "masculino" ? "Masculino" : "Feminino"}
          />
          <Row label="Faixa etária" value={form.category} />
          <Row label="Cidade" value={form.city} />
        </div>
      </div>

      <Button
        onClick={onOpenWhatsApp}
        className="w-full bg-[#25D366] hover:bg-[#1DA851]"
        size="lg"
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        Abrir WhatsApp
      </Button>
    </div>
  );
}

function SuccessStep({ onReset }: { onReset: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" />
        <p className="text-sm font-semibold text-[#0D1B2A]">
          Solicitação enviada!
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Retornaremos em até 48h pelo WhatsApp com suas recomendações
          personalizadas.
        </p>
      </div>

      <Button variant="outline" onClick={onReset} className="w-full" size="lg">
        Fazer nova consulta
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="font-medium text-[#0D1B2A]">{value}</span>
    </div>
  );
}

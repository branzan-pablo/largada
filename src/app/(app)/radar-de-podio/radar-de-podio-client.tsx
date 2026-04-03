"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CityAutocomplete } from "@/components/onboarding/city-autocomplete";
import {
  DEFAULT_DISTANCES,
  RADAR_AGE_CATEGORIES,
  RADAR_WHATSAPP_NUMBER,
} from "@/lib/constants";
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
} from "lucide-react";

interface FormData {
  pace: string;
  distance: string;
  category: string;
  sex: string;
  city: string;
  cityId: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
}

type Step = "form" | "confirm" | "success";

function formatPace(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

function isValidPace(pace: string): boolean {
  return /^\d{2}:\d{2}$/.test(pace);
}

function buildWhatsAppUrl(form: FormData): string {
  const sexLabel = form.sex === "masculino" ? "Masculino" : "Feminino";
  const message = [
    "Olá! Gostaria de solicitar a *Curadoria de Corridas*.",
    "",
    `Pace: ${form.pace}/km`,
    `Distância: ${form.distance}`,
    `Sexo: ${sexLabel}`,
    `Faixa etária: ${form.category}`,
    `Cidade: ${form.city}`,
    "",
    "Estou ciente que o serviço custa *R$ 29,90*.",
  ].join("\n");

  return `https://wa.me/${RADAR_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function RadarDePodioClient() {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormData>({
    pace: "",
    distance: "",
    category: "",
    sex: "",
    city: "",
    cityId: null,
    state: null,
    latitude: null,
    longitude: null,
  });

  const isFormValid =
    isValidPace(form.pace) &&
    form.distance !== "" &&
    form.category !== "" &&
    form.sex !== "" &&
    form.city !== "";

  const handleSendWhatsApp = useCallback(() => {
    window.open(buildWhatsAppUrl(form), "_blank");
    setStep("success");
  }, [form]);

  const handleReset = useCallback(() => {
    setStep("form");
    setForm({
      pace: "",
      distance: "",
      category: "",
      sex: "",
      city: "",
      cityId: null,
      state: null,
      latitude: null,
      longitude: null,
    });
  }, []);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
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

      {/* ──── STEP 1: FORM ──── */}
      {step === "form" && (
        <div className="space-y-3">
          {/* Performance + Categoria unified card */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-5">
            {/* Performance */}
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
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, distance: v }))
                    }
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

            {/* Categoria */}
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
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, category: v }))
                    }
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

            {/* Localização */}
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
            onClick={() => setStep("confirm")}
            disabled={!isFormValid}
            className="w-full bg-[#FF4D00] hover:bg-[#E04500]"
            size="lg"
          >
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ──── STEP 2: CONFIRM ──── */}
      {step === "confirm" && (
        <div className="space-y-4">
          {/* Review data */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#0D1B2A]">
              Revise seus dados
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Pace</span>
                <span className="font-medium text-[#0D1B2A]">
                  {form.pace}/km
                </span>
              </div>
              <div className="flex justify-between">
                <span>Distância</span>
                <span className="font-medium text-[#0D1B2A]">
                  {form.distance}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sexo</span>
                <span className="font-medium text-[#0D1B2A]">
                  {form.sex === "masculino" ? "Masculino" : "Feminino"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Faixa etária</span>
                <span className="font-medium text-[#0D1B2A]">
                  {form.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cidade</span>
                <span className="font-medium text-[#0D1B2A]">{form.city}</span>
              </div>
            </div>
          </div>

          {/* Pricing card */}
          <div className="rounded-xl border-2 border-[#FF4D00]/30 bg-gradient-to-br from-[#FF4D00]/5 to-orange-50 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#FF4D00]" />
              <p className="text-sm font-bold text-[#0D1B2A]">
                Curadoria personalizada
              </p>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Um especialista vai analisar seu perfil e recomendar as melhores
              corridas para você.
            </p>
            <p className="text-center text-lg font-bold text-[#0D1B2A]">
              R$ 29,90
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Pagamento único &middot; Retorno em até 48h
            </p>
          </div>

          <Button
            onClick={handleSendWhatsApp}
            className="w-full bg-[#25D366] hover:bg-[#1DA851]"
            size="lg"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Solicitar curadoria via WhatsApp
          </Button>

          <Button
            variant="ghost"
            onClick={() => setStep("form")}
            className="w-full"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar e editar
          </Button>
        </div>
      )}

      {/* ──── STEP 3: SUCCESS ──── */}
      {step === "success" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" />
            <p className="text-sm font-semibold text-[#0D1B2A]">
              Solicitação enviada!
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Retornaremos em breve pelo WhatsApp com suas recomendações
              personalizadas.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full"
            size="lg"
          >
            Fazer nova consulta
          </Button>
        </div>
      )}
    </div>
  );
}

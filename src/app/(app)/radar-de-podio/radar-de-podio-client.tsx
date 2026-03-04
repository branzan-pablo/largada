"use client";

import { useState } from "react";
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
  CheckCircle2,
  Crosshair,
  Gauge,
  Route,
  Users,
  MapPin,
} from "lucide-react";

interface FormData {
  pace: string;
  distance: string;
  category: string;
  sex: string;
  city: string;
}

function formatPace(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

function isValidPace(pace: string): boolean {
  return /^\d{2}:\d{2}$/.test(pace);
}

export function RadarDePodioClient() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    pace: "",
    distance: "",
    category: "",
    sex: "",
    city: "",
  });

  const sexLabel = form.sex === "masculino" ? "M" : "F";

  const isStep1Valid =
    isValidPace(form.pace) &&
    form.distance !== "" &&
    form.category !== "" &&
    form.sex !== "" &&
    form.city !== "";

  function handleNext() {
    if (!isStep1Valid) return;
    setStep(2);
  }

  function handleSend() {
    const message = [
      "Olá! Quero usar o Radar de Pódio.",
      "",
      `Pace médio: ${form.pace}/km`,
      `Distância: ${form.distance}`,
      `Categoria: ${sexLabel} ${form.category}`,
      `Cidade: ${form.city}`,
    ].join("\n");

    const url = `https://wa.me/${RADAR_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    setStep(3);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header compacto */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF4D00]/10">
          <Crosshair className="h-5 w-5 text-[#FF4D00]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#0D1B2A]">Radar de Pódio</h1>
          <p className="text-xs text-muted-foreground">
            Descubra suas chances de pódio na região
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="mb-5 flex items-center gap-1.5">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-all ${
              s === step
                ? "bg-[#FF4D00]"
                : s < step
                  ? "bg-[#FF4D00]/30"
                  : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          {/* Pace + Distância — row compacto */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
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
                  className="h-10"
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
                  <SelectTrigger className="h-10">
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

          {/* Sexo + Categoria */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
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
                  <SelectTrigger className="h-10">
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
                  <SelectTrigger className="h-10">
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

          {/* Cidade */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
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
                }))
              }
              onClear={() => setForm((f) => ({ ...f, city: "" }))}
              placeholder="Digite sua cidade..."
            />
          </div>

          <Button
            onClick={handleNext}
            disabled={!isStep1Valid}
            className="w-full bg-[#FF4D00] hover:bg-[#E04500]"
            size="lg"
          >
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-[#0D1B2A]">
              Confirme seus dados
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Gauge className="h-3.5 w-3.5" />
                  Pace
                </span>
                <span className="font-medium">{form.pace}/km</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Route className="h-3.5 w-3.5" />
                  Distância
                </span>
                <span className="font-medium">{form.distance}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  Categoria
                </span>
                <span className="font-medium">
                  {sexLabel} {form.category}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Cidade
                </span>
                <span className="font-medium">{form.city}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button
              onClick={handleSend}
              className="flex-1 bg-[#FF4D00] hover:bg-[#E04500]"
              size="lg"
            >
              Analisar chances
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h2 className="text-lg font-semibold text-[#0D1B2A]">
            Mensagem enviada!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Vamos analisar e retornar em breve.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setStep(1);
              setForm({
                pace: "",
                distance: "",
                category: "",
                sex: "",
                city: "",
              });
            }}
            className="mt-6"
          >
            Fazer nova consulta
          </Button>
        </div>
      )}
    </div>
  );
}

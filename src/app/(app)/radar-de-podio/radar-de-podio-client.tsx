"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CityAutocomplete } from "@/components/onboarding/city-autocomplete";
import { DEFAULT_DISTANCES, RADAR_AGE_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/date";
import {
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Gauge,
  Route,
  Users,
  MapPin,
  Loader2,
  Lock,
  Trophy,
  Calendar,
  TrendingUp,
  Zap,
  Target,
  ChevronRight,
} from "lucide-react";
import type { ScoredRace } from "@/lib/radar/scoring";

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

interface AnalysisResult {
  totalFound: number;
  totalRecommended: number;
  freeResults: ScoredRace[];
  lockedCount: number;
  lockedResults: Array<{
    score: number;
    label: string;
    race: { city: string; state: string; date: string };
  }>;
  profile: {
    id: string;
    pace: string;
    distance: string;
    sex: string;
    ageCategory: string;
    city: string;
  };
}

type Step = "form" | "loading" | "results";

function formatPace(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

function isValidPace(pace: string): boolean {
  return /^\d{2}:\d{2}$/.test(pace);
}

function scoreColor(label: string): string {
  switch (label) {
    case "alta":
      return "text-green-600";
    case "media":
      return "text-amber-500";
    default:
      return "text-gray-400";
  }
}

function scoreBg(label: string): string {
  switch (label) {
    case "alta":
      return "bg-green-50 border-green-200";
    case "media":
      return "bg-amber-50 border-amber-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
}

function scoreBadgeVariant(
  label: string,
): string {
  switch (label) {
    case "alta":
      return "bg-green-100 text-green-700 border-green-200";
    case "media":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-gray-100 text-gray-500 border-gray-200";
  }
}

function labelText(label: string): string {
  switch (label) {
    case "alta":
      return "Alta chance";
    case "media":
      return "Chance moderada";
    default:
      return "Chance baixa";
  }
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
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFormValid =
    isValidPace(form.pace) &&
    form.distance !== "" &&
    form.category !== "" &&
    form.sex !== "" &&
    form.city !== "";

  const handleAnalyze = useCallback(async () => {
    if (!isFormValid) return;
    setStep("loading");
    setError(null);

    try {
      const res = await fetch("/api/radar/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pace: form.pace,
          distance: form.distance,
          sex: form.sex,
          ageCategory: form.category,
          city: form.city,
          cityId: form.cityId,
          state: form.state,
          latitude: form.latitude,
          longitude: form.longitude,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao analisar");
      }

      const data: AnalysisResult = await res.json();
      setResult(data);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setStep("form");
    }
  }, [form, isFormValid]);

  const handleReset = useCallback(() => {
    setStep("form");
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF4D00]/10">
          <Crosshair className="h-5 w-5 text-[#FF4D00]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#0D1B2A]">Radar de Pódio</h1>
          <p className="text-xs text-muted-foreground">
            {step === "results"
              ? `${result?.totalFound ?? 0} corridas analisadas`
              : "Descubra onde você tem chances reais de pódio"}
          </p>
        </div>
      </div>

      {/* ──── FORM STEP ──── */}
      {step === "form" && (
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Performance */}
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

          {/* Categoria */}
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

          <Button
            onClick={handleAnalyze}
            disabled={!isFormValid}
            className="w-full bg-[#FF4D00] hover:bg-[#E04500]"
            size="lg"
          >
            Descobrir minhas corridas de pódio
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Analisamos seu pace e perfil contra todas as corridas disponíveis
          </p>
        </div>
      )}

      {/* ──── LOADING STEP ──── */}
      {step === "loading" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#FF4D00]" />
            <p className="text-sm font-medium text-[#0D1B2A]">
              Analisando corridas...
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cruzando seu pace de {form.pace}/km com o perfil de cada prova
            </p>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──── RESULTS STEP ──── */}
      {step === "results" && result && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="rounded-xl border border-[#FF4D00]/20 bg-gradient-to-br from-[#FF4D00]/5 to-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#0D1B2A]">
                  {result.totalRecommended > 0
                    ? `${result.totalRecommended} corrida${result.totalRecommended > 1 ? "s" : ""} com potencial`
                    : "Nenhuma corrida com alto potencial"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {form.pace}/km &middot; {form.distance} &middot;{" "}
                  {form.sex === "masculino" ? "M" : "F"} {form.category}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF4D00]/10">
                <Target className="h-5 w-5 text-[#FF4D00]" />
              </div>
            </div>
          </div>

          {/* Free results */}
          {result.freeResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Suas melhores chances
              </p>
              {result.freeResults.map((item) => (
                <RaceResultCard key={item.race.id} item={item} />
              ))}
            </div>
          )}

          {/* Locked results */}
          {result.lockedCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  +{result.lockedCount} corrida
                  {result.lockedCount > 1 ? "s" : ""} encontrada
                  {result.lockedCount > 1 ? "s" : ""}
                </p>
              </div>
              {result.lockedResults.slice(0, 3).map((item, i) => (
                <LockedRaceCard key={i} item={item} />
              ))}
              {result.lockedCount > 3 && (
                <p className="text-center text-xs text-muted-foreground">
                  e mais {result.lockedCount - 3} corrida
                  {result.lockedCount - 3 > 1 ? "s" : ""}...
                </p>
              )}
            </div>
          )}

          {/* Paywall CTA */}
          {result.lockedCount > 0 && (
            <div className="rounded-xl border-2 border-[#FF4D00]/30 bg-gradient-to-br from-[#FF4D00]/5 to-orange-50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#FF4D00]" />
                <p className="text-sm font-bold text-[#0D1B2A]">
                  Desbloqueie a análise completa
                </p>
              </div>
              <ul className="mb-4 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-[#FF4D00]" />
                  Todas as {result.totalFound} corridas com score detalhado
                </li>
                <li className="flex items-center gap-2">
                  <Trophy className="h-3.5 w-3.5 text-[#FF4D00]" />
                  Ranking completo de compatibilidade
                </li>
                <li className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-[#FF4D00]" />
                  Análise por proximidade, competitividade e premiação
                </li>
              </ul>
              <p className="mb-1 text-center text-lg font-bold text-[#0D1B2A]">
                R$ 9,90
              </p>
              <p className="mb-3 text-center text-xs text-muted-foreground">
                Análise avulsa &middot; Pagamento único
              </p>
              <Button
                className="w-full bg-[#FF4D00] hover:bg-[#E04500]"
                size="lg"
                disabled
              >
                <Lock className="mr-2 h-4 w-4" />
                Desbloquear análise completa
              </Button>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                Em breve &middot; Pagamento via PIX ou cartão
              </p>
            </div>
          )}

          {/* No results */}
          {result.totalFound === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
              <Route className="mx-auto mb-3 h-8 w-8 text-gray-300" />
              <p className="text-sm font-medium text-[#0D1B2A]">
                Nenhuma corrida de {form.distance} encontrada
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tente outra distância ou volte em breve — novas corridas são
                adicionadas toda semana.
              </p>
            </div>
          )}

          {/* Social proof */}
          <div className="rounded-lg bg-gray-50 p-3 text-center text-xs text-muted-foreground">
            Baseado em dados reais de corridas cadastradas no Largada
          </div>

          {/* Anchoring phrase */}
          <p className="text-center text-xs text-muted-foreground italic">
            &ldquo;Uma inscrição custa entre R$80 e R$250. O Radar te ajuda a
            investir onde o retorno é real.&rdquo;
          </p>

          {/* Reset button */}
          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full"
            size="lg"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Nova consulta
          </Button>
        </div>
      )}
    </div>
  );
}

// ──── Sub-components ────

function RaceResultCard({ item }: { item: ScoredRace }) {
  const { race, score, distanceKm, label } = item;

  return (
    <a
      href={`/corrida/${race.slug}`}
      className={`block rounded-xl border p-4 transition-all hover:shadow-md ${scoreBg(label)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-[#0D1B2A]">
              {race.name}
            </p>
            {race.isPromoted && (
              <Badge className="shrink-0 border-amber-200 bg-amber-100 text-[10px] text-amber-700">
                Destaque
              </Badge>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {race.city} - {race.state}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(race.date)}
            </span>
            {distanceKm >= 0 && (
              <span className="flex items-center gap-1">
                <Route className="h-3 w-3" />
                {distanceKm} km
              </span>
            )}
          </div>
          {/* Factor bars */}
          <div className="mt-2.5 grid grid-cols-4 gap-1.5">
            <FactorBar
              label="Proximidade"
              value={item.factors.proximity}
            />
            <FactorBar
              label="Competição"
              value={item.factors.competition}
            />
            <FactorBar label="Premiação" value={item.factors.prize} />
            <FactorBar label="Timing" value={item.factors.timing} />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-bold ${scoreColor(label)} ${
              label === "alta"
                ? "bg-green-100"
                : label === "media"
                  ? "bg-amber-100"
                  : "bg-gray-100"
            }`}
          >
            {score}
          </div>
          <Badge
            className={`border text-[9px] ${scoreBadgeVariant(label)}`}
          >
            {labelText(label)}
          </Badge>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs font-medium text-[#FF4D00]">
          Ver detalhes da corrida
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-[#FF4D00]" />
      </div>
    </a>
  );
}

function LockedRaceCard({
  item,
}: {
  item: {
    score: number;
    label: string;
    race: { city: string; state: string; date: string };
  };
}) {
  return (
    <div className="relative rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <Lock className="h-3 w-3 text-gray-300" />
          </div>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {item.race.city} - {item.race.state}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(item.race.date)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1 opacity-50">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-bold ${scoreColor(item.label)} ${
              item.label === "alta"
                ? "bg-green-100"
                : item.label === "media"
                  ? "bg-amber-100"
                  : "bg-gray-100"
            }`}
          >
            {item.score}
          </div>
          <Badge
            className={`border text-[9px] ${scoreBadgeVariant(item.label)}`}
          >
            {labelText(item.label)}
          </Badge>
        </div>
      </div>
      {/* Blur overlay */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/60 backdrop-blur-[2px]" />
    </div>
  );
}

function FactorBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-0.5 text-[9px] text-muted-foreground">{label}</div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-[#FF4D00] transition-all"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

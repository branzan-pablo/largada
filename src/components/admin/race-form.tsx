"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CityAutocomplete } from "@/components/onboarding/city-autocomplete";
import { ImageUpload } from "@/components/ui/image-upload";
import { RaceFiller } from "@/components/admin/race-filler";
import { DEFAULT_DISTANCES } from "@/lib/constants";
import { raceSchema } from "@/lib/validations";
import { toast } from "sonner";
import type { Race, RegistrationBatch } from "@/types/race";
import type { RaceExtraction } from "@/lib/ai/schemas/race-extraction";
import { todayInBrazil } from "@/lib/date";

interface RaceFormProps {
  race?: Race;
  suggestionData?: {
    name?: string;
    city?: string;
    state?: string;
    date?: string;
    link?: string;
    notes?: string;
    suggestionId?: string;
    cityData?: { name: string; state_code: string; latitude: number; longitude: number };
  };
}

export function RaceForm({ race, suggestionData }: RaceFormProps) {
  const router = useRouter();
  const isEditing = !!race;

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [name, setName] = useState(race?.name ?? suggestionData?.name ?? "");
  const [date, setDate] = useState(race?.date ?? suggestionData?.date ?? "");
  const [startTime, setStartTime] = useState(race?.start_time?.slice(0, 5) ?? "07:00");
  const [selectedCity, setSelectedCity] = useState<{
    name: string;
    state_code: string;
    latitude: number;
    longitude: number;
  } | null>(
    race
      ? { name: race.city, state_code: race.state, latitude: race.latitude, longitude: race.longitude }
      : suggestionData?.cityData ?? null
  );
  const [address, setAddress] = useState(race?.address ?? "");
  const [distances, setDistances] = useState<string[]>(race?.distances ?? []);
  const [customDistanceInput, setCustomDistanceInput] = useState("");
  const [customDistanceError, setCustomDistanceError] = useState("");
  const [registrationPrices, setRegistrationPrices] = useState<Record<string, string>>(
    race?.registration_prices ?? {}
  );
  const [registrationPrice, setRegistrationPrice] = useState(race?.registration_price ?? "");
  const [registrationBatches, setRegistrationBatches] = useState<RegistrationBatch[]>(
    race?.registration_batches ?? []
  );
  const [registrationLink, setRegistrationLink] = useState(race?.registration_link ?? "");
  const [registrationDeadline, setRegistrationDeadline] = useState(race?.registration_deadline ?? "");
  const [prizeType, setPrizeType] = useState<string>(race?.prize_type ?? "none");
  const [prizeDetails, setPrizeDetails] = useState(race?.prize_details ?? "");
  const [routeDescription, setRouteDescription] = useState(race?.route_description ?? "");
  const [organizer, setOrganizer] = useState(race?.organizer ?? "");
  const [description, setDescription] = useState(race?.description ?? "");
  const [status, setStatus] = useState<string>(race?.status ?? "confirmed");
  const [notes, setNotes] = useState(race?.notes ?? suggestionData?.notes ?? "");
  const [link, setLink] = useState(race?.link ?? suggestionData?.link ?? "");
  const [isPromoted, setIsPromoted] = useState(race?.is_promoted ?? false);
  const [imageUrl, setImageUrl] = useState<string | null>(race?.image_url ?? null);
  const [uploadFolder] = useState(() => race?.id ?? crypto.randomUUID());

  const handleDistanceToggle = (distance: string) => {
    setDistances((prev) => {
      if (prev.includes(distance)) {
        // Remove price entry when distance is removed
        setRegistrationPrices((prices) => {
          const updated = { ...prices };
          delete updated[distance];
          return updated;
        });
        return prev.filter((d) => d !== distance);
      }
      return [...prev, distance];
    });
  };

  const normalizeDistance = (raw: string): string | null => {
    const cleaned = raw.trim().toLowerCase().replace(/km$/, "k");
    if (/^\d+(\.\d+)?k$/.test(cleaned)) return cleaned;
    return null;
  };

  const handleAddCustomDistance = () => {
    const normalized = normalizeDistance(customDistanceInput);
    if (!normalized) {
      setCustomDistanceError('Formato inválido. Use "42k", "100k" ou "21.1k".');
      return;
    }
    if (distances.includes(normalized)) {
      setCustomDistanceError("Essa distância já foi adicionada.");
      return;
    }
    setCustomDistanceError("");
    setDistances((prev) => [...prev, normalized]);
    setCustomDistanceInput("");
  };

  // Merge AI-extracted fields into the form, preserving anything the admin
  // already typed. Treats form defaults ("07:00", "none", "") as "empty" so
  // a fresh form gets filled but mid-flight edits are never overwritten.
  const handleExtracted = async (extracted: RaceExtraction) => {
    let filled = 0;
    const hints: string[] = [];

    if (extracted.name && !name.trim()) {
      setName(extracted.name);
      filled++;
    }
    if (extracted.date && !date) {
      setDate(extracted.date);
      filled++;
    }
    if (extracted.startTime && startTime === "07:00") {
      setStartTime(extracted.startTime);
      filled++;
    }
    if (extracted.address && !address.trim()) {
      setAddress(extracted.address);
      filled++;
    }
    if (extracted.distances && extracted.distances.length > 0 && distances.length === 0) {
      setDistances(extracted.distances);
      filled++;
    }
    if (
      extracted.registrationPrices &&
      extracted.registrationPrices.length > 0 &&
      Object.keys(registrationPrices).length === 0
    ) {
      const asMap = Object.fromEntries(
        extracted.registrationPrices.map((p) => [p.distance, p.price]),
      );
      setRegistrationPrices(asMap);
      filled++;
    }
    if (extracted.registrationPrice && !registrationPrice.trim()) {
      setRegistrationPrice(extracted.registrationPrice);
      filled++;
    }
    if (extracted.registrationLink && !registrationLink.trim()) {
      setRegistrationLink(extracted.registrationLink);
      filled++;
    }
    if (extracted.registrationDeadline && !registrationDeadline) {
      setRegistrationDeadline(extracted.registrationDeadline);
      filled++;
    }
    if (extracted.prizeType && prizeType === "none") {
      setPrizeType(extracted.prizeType);
      filled++;
    }
    if (extracted.prizeDetails && !prizeDetails.trim()) {
      // Guard against the LLM echoing the prize type label as the "detail".
      // If the entire text matches a known type keyword, drop it.
      const normalized = extracted.prizeDetails.trim().toLowerCase();
      const isEcho = ["troféu", "trofeu", "medalha", "dinheiro", "money", "trophy", "both", "ambos", "none", "nenhum"].includes(normalized);
      if (!isEcho) {
        setPrizeDetails(extracted.prizeDetails);
        filled++;
      }
    }
    if (extracted.routeDescription && !routeDescription.trim()) {
      setRouteDescription(extracted.routeDescription);
      filled++;
    }
    if (extracted.organizer && !organizer.trim()) {
      setOrganizer(extracted.organizer);
      filled++;
    }
    if (extracted.description && !description.trim()) {
      setDescription(extracted.description);
      filled++;
    }
    if (extracted.imageUrl && !imageUrl) {
      setImageUrl(extracted.imageUrl);
      filled++;
    }

    // Resolve city via the same search RPC the autocomplete uses so we land
    // on a row with lat/lng instead of a raw text hint.
    if (extracted.city && !selectedCity) {
      try {
        const res = await fetch(
          `/api/cities/search?q=${encodeURIComponent(extracted.city)}&limit=8`,
        );
        if (res.ok) {
          const cities: Array<{
            name: string;
            state_code: string;
            latitude: number;
            longitude: number;
          }> = await res.json();
          const match =
            (extracted.state &&
              cities.find((c) => c.state_code === extracted.state)) ||
            cities[0];
          if (match) {
            setSelectedCity({
              name: match.name,
              state_code: match.state_code,
              latitude: match.latitude,
              longitude: match.longitude,
            });
            filled++;
          } else {
            hints.push(
              `Cidade ${extracted.city}${extracted.state ? " - " + extracted.state : ""} não encontrada no banco. Cadastre manualmente.`,
            );
          }
        }
      } catch {
        hints.push(
          `Não foi possível resolver a cidade ${extracted.city} automaticamente.`,
        );
      }
    }

    if (filled > 0) {
      toast.success(`${filled} ${filled === 1 ? "campo preenchido" : "campos preenchidos"}.`);
    } else {
      toast.info("Nenhum campo novo. Os existentes foram preservados.");
    }
    for (const hint of hints) toast.info(hint);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Only include non-empty price entries
    const filteredPrices = Object.fromEntries(
      Object.entries(registrationPrices).filter(([, v]) => v.trim() !== "")
    );

    const parsed = raceSchema.safeParse({
      name,
      date,
      startTime,
      city: selectedCity?.name ?? "",
      state: selectedCity?.state_code ?? "",
      address,
      latitude: selectedCity?.latitude,
      longitude: selectedCity?.longitude,
      distances,
      registrationPrices: Object.keys(filteredPrices).length > 0 ? filteredPrices : undefined,
      registrationPrice: registrationPrice || undefined,
      registrationBatches: registrationBatches.length > 0 ? registrationBatches : undefined,
      registrationLink,
      registrationDeadline,
      prizeType,
      prizeDetails: prizeDetails || undefined,
      routeDescription: routeDescription || undefined,
      organizer: organizer || undefined,
      description: description || undefined,
      status,
      isPromoted,
      imageUrl: imageUrl || undefined,
      link: link || undefined,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString();
        if (field) fieldErrors[field] = issue.message;
      }
      // Map coordinate errors to the city field (coordinates come from city selection)
      if (fieldErrors.latitude || fieldErrors.longitude) {
        fieldErrors.city = fieldErrors.city || "Selecione uma cidade da lista para preencher as coordenadas";
        delete fieldErrors.latitude;
        delete fieldErrors.longitude;
      }
      setErrors(fieldErrors);
      toast.error("Corrija os campos destacados antes de salvar");
      // Scroll to first field with error
      requestAnimationFrame(() => {
        const firstErrorEl =
          document.querySelector(".border-destructive") ??
          document.querySelector(".text-destructive");
        firstErrorEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    setIsLoading(true);

    const payload = {
      ...parsed.data,
      origin: suggestionData?.suggestionId ? "approved_suggestion" : "admin",
    };

    try {
      const url = isEditing ? `/api/races/${race.id}` : "/api/races";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();

        if (err.details && Array.isArray(err.details)) {
          const fieldErrors: Record<string, string> = {};
          for (const issue of err.details) {
            const field = issue.path?.[0]?.toString();
            if (field) fieldErrors[field] = issue.message;
          }
          if (fieldErrors.latitude || fieldErrors.longitude) {
            fieldErrors.city = fieldErrors.city || "Selecione uma cidade da lista para preencher as coordenadas";
            delete fieldErrors.latitude;
            delete fieldErrors.longitude;
          }
          setErrors(fieldErrors);
          toast.error("Corrija os campos destacados antes de salvar");
          requestAnimationFrame(() => {
            const firstErrorEl =
              document.querySelector(".border-destructive") ??
              document.querySelector(".text-destructive");
            firstErrorEl?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
          return;
        }

        throw new Error(err.error || "Erro ao salvar corrida");
      }

      // If approving a suggestion, update its status
      if (suggestionData?.suggestionId) {
        await fetch("/api/suggestions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: suggestionData.suggestionId,
            status: "approved",
          }),
        });
      }

      toast.success(isEditing ? "Corrida atualizada!" : "Corrida criada!");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl space-y-6" noValidate>
      {!isEditing && (
        <div className="flex justify-end">
          <RaceFiller onExtract={handleExtracted} disabled={isLoading} />
        </div>
      )}
      {suggestionData?.suggestionId && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          Criando corrida a partir de uma sugestão. Os campos Nome, Cidade, Data, Link e Observações já
          foram pré-preenchidos. Ao salvar, a sugestão será marcada como aprovada.
        </div>
      )}

      {/* Basic Info — full width */}
      <section className="space-y-4 rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold">Informações Básicas</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Imagem / Banner da corrida</Label>
            <ImageUpload
              bucket="race-images"
              folder={uploadFolder}
              value={imageUrl}
              onChange={setImageUrl}
            />
            <p className="text-xs text-muted-foreground">
              Aceita JPEG, PNG ou WebP. Tamanho máximo: 5MB.
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nome da corrida <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Corrida Noturna de São José"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizer">Organizador</Label>
            <Input
              id="organizer"
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              placeholder="Ex: Assessoria XYZ"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link (site ou rede social)</Label>
            <Input
              id="link"
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Ex: www.corridaxyz.com.br ou https://..."
              className={errors.link ? "border-destructive" : ""}
            />
            {errors.link ? (
              <p className="text-xs text-destructive">{errors.link}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Aceita links com ou sem https://
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Location + Date & Time — side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold">Localização</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cidade <span className="text-destructive">*</span></Label>
              <CityAutocomplete
                onSelect={(c) => setSelectedCity({
                  name: c.name,
                  state_code: c.state_code,
                  latitude: c.latitude,
                  longitude: c.longitude,
                })}
                onClear={() => setSelectedCity(null)}
                initialCity={
                  race
                    ? `${race.city} - ${race.state}`
                    : suggestionData?.city && suggestionData?.state
                      ? `${suggestionData.city} - ${suggestionData.state}`
                      : suggestionData?.city
                        ? suggestionData.city
                        : undefined
                }
                inputClassName={errors.city ? "border-destructive" : ""}
              />
              {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço / local de largada <span className="text-destructive">*</span></Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Praça Rui Barbosa, Centro"
                className={errors.address ? "border-destructive" : ""}
              />
              {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold">Data e Horário</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data da corrida <span className="text-destructive">*</span></Label>
              <Input
                id="date"
                type="date"
                value={date}
                min={todayInBrazil()}
                onChange={(e) => setDate(e.target.value)}
                className={errors.date ? "border-destructive" : ""}
              />
              {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Horário de largada <span className="text-destructive">*</span></Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={errors.startTime ? "border-destructive" : ""}
                />
                {errors.startTime && <p className="text-xs text-destructive">{errors.startTime}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDeadline">Prazo de Inscrição<span className="text-destructive">*</span></Label>
                <Input
                  id="registrationDeadline"
                  type="date"
                  value={registrationDeadline}
                  max={date || undefined}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className={errors.registrationDeadline ? "border-destructive" : ""}
                />
                {errors.registrationDeadline && <p className="text-xs text-destructive">{errors.registrationDeadline}</p>}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Distances & Prize + Registration — side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-5 rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold">Distâncias e Premiação</h2>

          {/* Distances */}
          <div className="space-y-2">
            <Label>Distâncias <span className="text-destructive">*</span></Label>
            <div className={`flex flex-wrap gap-3 sm:gap-4 ${errors.distances ? "rounded border border-destructive p-2" : ""}`}>
              {DEFAULT_DISTANCES.map((d) => (
                <label key={d} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={distances.includes(d)}
                    onCheckedChange={() => handleDistanceToggle(d)}
                  />
                  {d.toUpperCase()}
                </label>
              ))}
              {distances
                .filter((d) => !(DEFAULT_DISTANCES as readonly string[]).includes(d))
                .map((d) => (
                  <span key={d} className="flex items-center gap-1.5 text-sm">
                    <Checkbox
                      checked
                      onCheckedChange={() => handleDistanceToggle(d)}
                    />
                    {d.toUpperCase()}
                    <button
                      type="button"
                      onClick={() => handleDistanceToggle(d)}
                      className="ml-0.5 text-gray-400 hover:text-destructive transition-colors"
                      aria-label={`Remover ${d}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Input
                value={customDistanceInput}
                onChange={(e) => {
                  setCustomDistanceInput(e.target.value);
                  setCustomDistanceError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomDistance())}
                placeholder="Ex: 42k, 100k"
                className="w-full sm:w-36 h-8 text-sm"
              />
              <button
                type="button"
                onClick={handleAddCustomDistance}
                className="text-sm text-primary hover:underline"
              >
                + Adicionar
              </button>
            </div>
            {customDistanceError && <p className="text-xs text-destructive">{customDistanceError}</p>}
            {errors.distances && <p className="text-xs text-destructive">{errors.distances}</p>}
          </div>

          <hr className="border-gray-100" />

          {/* Prize */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prizeType">Tipo de premiação <span className="text-destructive">*</span></Label>
              <Select value={prizeType} onValueChange={setPrizeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem premiação</SelectItem>
                  <SelectItem value="money">Dinheiro</SelectItem>
                  <SelectItem value="trophy">Troféu</SelectItem>
                  <SelectItem value="both">Dinheiro e Troféu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {prizeType !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="prizeDetails">Detalhes da premiação</Label>
                <Textarea
                  id="prizeDetails"
                  value={prizeDetails}
                  onChange={(e) => setPrizeDetails(e.target.value)}
                  placeholder="Ex: R$1.000 (1º), R$500 (2º), R$300 (3º)"
                  className="min-h-[60px]"
                />
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold">Inscrição</h2>

          <div className="space-y-4">
            {/* Per-distance prices (simple mode — shown when no batches) */}
            {distances.length > 0 && registrationBatches.length === 0 && (
              <div className="space-y-2">
                <Label>Valor por distância</Label>
                <div className="space-y-2">
                  {distances.map((d) => (
                    <div key={d} className="flex items-center gap-2">
                      <Badge variant="secondary" className="shrink-0 min-w-[3.5rem] justify-center">
                        {d.toUpperCase()}
                      </Badge>
                      <Input
                        value={registrationPrices[d] ?? ""}
                        onChange={(e) =>
                          setRegistrationPrices((prev) => ({
                            ...prev,
                            [d]: e.target.value,
                          }))
                        }
                        placeholder="Ex: R$ 89,90 + taxa"
                        className="h-9"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Registration Batches (lotes) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Lotes de preço</Label>
                <button
                  type="button"
                  onClick={() =>
                    setRegistrationBatches((prev) => [
                      ...prev,
                      { name: `${prev.length + 1}º Lote`, items: [{ label: "", price: "" }] },
                    ])
                  }
                  className="text-sm text-primary hover:underline"
                >
                  + Adicionar lote
                </button>
              </div>

              {registrationBatches.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Organize os preços por lote (ex: Lote Promocional, 1º Lote). Cada lote pode ter vários kits/modalidades.
                </p>
              )}

              {registrationBatches.map((batch, batchIndex) => (
                <div
                  key={batchIndex}
                  className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 grid gap-2 sm:grid-cols-2">
                      <Input
                        value={batch.name}
                        onChange={(e) =>
                          setRegistrationBatches((prev) =>
                            prev.map((b, i) =>
                              i === batchIndex ? { ...b, name: e.target.value } : b
                            )
                          )
                        }
                        placeholder="Nome do lote (ex: 1º Lote)"
                        className="h-9 text-sm font-medium"
                      />
                      <Input
                        type="date"
                        value={batch.deadline ?? ""}
                        onChange={(e) =>
                          setRegistrationBatches((prev) =>
                            prev.map((b, i) =>
                              i === batchIndex
                                ? { ...b, deadline: e.target.value || undefined }
                                : b
                            )
                          )
                        }
                        placeholder="Data limite (opcional)"
                        className="h-9 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setRegistrationBatches((prev) => prev.filter((_, i) => i !== batchIndex))
                      }
                      className="mt-1.5 text-gray-400 hover:text-destructive transition-colors text-lg leading-none"
                      aria-label={`Remover ${batch.name}`}
                    >
                      ×
                    </button>
                  </div>

                  {/* Batch items */}
                  <div className="space-y-2 pl-1">
                    {batch.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center gap-2">
                        <Input
                          value={item.label}
                          onChange={(e) =>
                            setRegistrationBatches((prev) =>
                              prev.map((b, bi) =>
                                bi === batchIndex
                                  ? {
                                      ...b,
                                      items: b.items.map((it, ii) =>
                                        ii === itemIndex ? { ...it, label: e.target.value } : it
                                      ),
                                    }
                                  : b
                              )
                            )
                          }
                          placeholder="Ex: Kit Premium 5K (opcional)"
                          className="h-8 text-sm flex-1 placeholder:text-muted-foreground/60 placeholder:italic"
                        />
                        <Input
                          value={item.price}
                          onChange={(e) =>
                            setRegistrationBatches((prev) =>
                              prev.map((b, bi) =>
                                bi === batchIndex
                                  ? {
                                      ...b,
                                      items: b.items.map((it, ii) =>
                                        ii === itemIndex ? { ...it, price: e.target.value } : it
                                      ),
                                    }
                                  : b
                              )
                            )
                          }
                          placeholder="R$ 99,00"
                          className="h-8 text-sm w-32 placeholder:text-muted-foreground/60 placeholder:italic"
                        />
                        {batch.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setRegistrationBatches((prev) =>
                                prev.map((b, bi) =>
                                  bi === batchIndex
                                    ? { ...b, items: b.items.filter((_, ii) => ii !== itemIndex) }
                                    : b
                                )
                              )
                            }
                            className="text-gray-400 hover:text-destructive transition-colors"
                            aria-label="Remover item"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setRegistrationBatches((prev) =>
                          prev.map((b, bi) =>
                            bi === batchIndex
                              ? { ...b, items: [...b.items, { label: "", price: "" }] }
                              : b
                          )
                        )
                      }
                      className="text-xs text-primary hover:underline"
                    >
                      + Adicionar item
                    </button>
                  </div>
                </div>
              ))}

              {errors.registrationPrice && (
                <p className="text-xs text-destructive">{errors.registrationPrice}</p>
              )}
            </div>

            {/* Free-text notes about pricing */}
            <div className="space-y-2">
              <Label htmlFor="registrationPrice">
                Observações sobre valores
              </Label>
              <Textarea
                id="registrationPrice"
                value={registrationPrice}
                onChange={(e) => setRegistrationPrice(e.target.value)}
                placeholder="Ex: 1º lote até 15/01, desconto para idosos, PcD..."
                className={`min-h-[60px] ${errors.registrationPrice ? "border-destructive" : ""}`}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationLink">Link de inscrição <span className="text-destructive">*</span></Label>
              <Input
                id="registrationLink"
                type="text"
                value={registrationLink}
                onChange={(e) => setRegistrationLink(e.target.value)}
                placeholder="Ex: www.corridaxyz.com.br ou https://..."
                className={errors.registrationLink ? "border-destructive" : ""}
              />
              {errors.registrationLink ? (
                <p className="text-xs text-destructive">{errors.registrationLink}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Aceita links com ou sem https://. O prefixo é adicionado automaticamente.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Route & Description + Status — side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold">Percurso e Descrição</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="routeDescription">Descrição do percurso</Label>
              <Textarea
                id="routeDescription"
                value={routeDescription}
                onChange={(e) => setRouteDescription(e.target.value)}
                placeholder="Ex: Percurso plano, com largada e chegada na praça central"
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição adicional</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Informações extras sobre a corrida"
                className="min-h-[80px]"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold">Status e Configurações</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status <span className="text-destructive">*</span></Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="pending_review">Pendente</SelectItem>
                  <SelectItem value="postponed">Adiada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informações adicionais sobre a corrida..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isPromoted"
                checked={isPromoted}
                onCheckedChange={(checked) => setIsPromoted(checked === true)}
              />
              <Label htmlFor="isPromoted" className="cursor-pointer">
                Destacar corrida (aparece no topo da listagem)
              </Label>
            </div>
          </div>
        </section>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isLoading} className="cursor-pointer">
          {isLoading
            ? "Salvando..."
            : isEditing
              ? "Salvar alterações"
              : "Criar corrida"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin")}
          className="cursor-pointer"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { DISTANCES } from "@/lib/constants";
import { raceSchema } from "@/lib/validations";
import { toast } from "sonner";
import type { Race } from "@/types/race";

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
  const [registrationPrice, setRegistrationPrice] = useState(race?.registration_price ?? "");
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

  const handleDistanceToggle = (distance: string) => {
    setDistances((prev) =>
      prev.includes(distance)
        ? prev.filter((d) => d !== distance)
        : [...prev, distance]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

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
      registrationPrice,
      registrationLink,
      registrationDeadline,
      prizeType,
      prizeDetails: prizeDetails || undefined,
      routeDescription: routeDescription || undefined,
      organizer: organizer || undefined,
      description: description || undefined,
      status,
      isPromoted,
      link: link || undefined,
      notes: notes || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString();
        if (field) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Corrija os campos destacados antes de salvar");
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
      router.push("/admin/corridas");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6" noValidate>
      {suggestionData?.suggestionId && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          Criando corrida a partir de uma sugestão. Os campos Nome, Cidade, Data, Link e Observações já
          foram pré-preenchidos. Ao salvar, a sugestão será marcada como aprovada.
        </div>
      )}

      {/* Basic Info */}
      <section className="space-y-4 rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold">Informações Básicas</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nome da corrida *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Corrida Noturna de São José"
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2 sm:col-span-1">
            <Label>Cidade *</Label>
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
                  ? `${race.city} — ${race.state}`
                  : suggestionData?.city && suggestionData?.state
                    ? `${suggestionData.city} — ${suggestionData.state}`
                    : suggestionData?.city
                      ? suggestionData.city
                      : undefined
              }
            />
            {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
          </div>

          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="address">Endereço / local de largada *</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Praça Rui Barbosa, Centro"
              className={errors.address ? "border-destructive" : ""}
            />
            {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={errors.date ? "border-destructive" : ""}
            />
            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startTime">Horário de largada *</Label>
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
            <Label htmlFor="organizer">Organizador</Label>
            <Input
              id="organizer"
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              placeholder="Ex: Assessoria XYZ"
            />
          </div>

          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="postponed">Adiada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox
              id="isPromoted"
              checked={isPromoted}
              onCheckedChange={(checked) => setIsPromoted(checked === true)}
            />
            <Label htmlFor="isPromoted" className="cursor-pointer">
              Destacar corrida (aparece no topo da listagem)
            </Label>
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
        </div>
      </section>

      {/* Distances + Prize side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distances */}
        <section className="space-y-4 rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold">Distâncias *</h2>
          <div className="flex flex-wrap gap-4">
            {DISTANCES.map((d) => (
              <label
                key={d}
                className="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={distances.includes(d)}
                  onCheckedChange={() => handleDistanceToggle(d)}
                />
                {d.toUpperCase()}
              </label>
            ))}
          </div>
          {errors.distances && <p className="text-xs text-destructive">{errors.distances}</p>}
        </section>

        {/* Prize */}
        <section className="space-y-4 rounded-lg border border-gray-200 p-5">
          <h2 className="text-lg font-semibold">Premiação</h2>

          <div className="space-y-2">
            <Label htmlFor="prizeType">Tipo de premiação *</Label>
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
        </section>
      </div>

      {/* Registration */}
      <section className="space-y-4 rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold">Inscrição</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="registrationPrice">Valor da inscrição *</Label>
            <Input
              id="registrationPrice"
              value={registrationPrice}
              onChange={(e) => setRegistrationPrice(e.target.value)}
              placeholder="Ex: 1º lote R$80, 2º lote R$100"
              className={errors.registrationPrice ? "border-destructive" : ""}
            />
            {errors.registrationPrice && <p className="text-xs text-destructive">{errors.registrationPrice}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="registrationDeadline">Prazo final *</Label>
            <Input
              id="registrationDeadline"
              type="date"
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              className={errors.registrationDeadline ? "border-destructive" : ""}
            />
            {errors.registrationDeadline && <p className="text-xs text-destructive">{errors.registrationDeadline}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="registrationLink">Link de inscrição *</Label>
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
                Aceita links com ou sem https:// — o prefixo é adicionado automaticamente.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Route & Description */}
      <section className="space-y-4 rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold">Percurso e Descrição</h2>

        <div className="grid gap-4 sm:grid-cols-2">
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

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Salvando..."
            : isEditing
              ? "Salvar alterações"
              : "Criar corrida"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/corridas")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

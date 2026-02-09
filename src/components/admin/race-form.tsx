"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DISTANCES, REGION_CITIES } from "@/lib/constants";
import { toast } from "sonner";
import type { Race } from "@/types/race";

interface RaceFormProps {
  race?: Race;
  suggestionData?: {
    name?: string;
    city?: string;
    date?: string;
    suggestionId?: string;
  };
}

export function RaceForm({ race, suggestionData }: RaceFormProps) {
  const router = useRouter();
  const isEditing = !!race;

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(race?.name ?? suggestionData?.name ?? "");
  const [date, setDate] = useState(race?.date ?? suggestionData?.date ?? "");
  const [startTime, setStartTime] = useState(race?.start_time?.slice(0, 5) ?? "07:00");
  const [city, setCity] = useState(race?.city ?? suggestionData?.city ?? "");
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

  const selectedCity = REGION_CITIES.find((c) => c.name === city);

  const handleDistanceToggle = (distance: string) => {
    setDistances((prev) =>
      prev.includes(distance)
        ? prev.filter((d) => d !== distance)
        : [...prev, distance]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (distances.length === 0) {
      toast.error("Selecione pelo menos uma distância");
      return;
    }

    if (!selectedCity) {
      toast.error("Selecione uma cidade válida");
      return;
    }

    setIsLoading(true);

    const payload = {
      name,
      date,
      startTime,
      city: selectedCity.name,
      state: selectedCity.state,
      address,
      latitude: selectedCity.lat,
      longitude: selectedCity.lng,
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
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Informações Básicas</h2>

        <div className="space-y-2">
          <Label htmlFor="name">Nome da corrida *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="date">Data *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startTime">Horário de largada *</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">Cidade *</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {REGION_CITIES.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}/{c.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Endereço / local de largada *</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizer">Organizador</Label>
          <Input
            id="organizer"
            value={organizer}
            onChange={(e) => setOrganizer(e.target.value)}
          />
        </div>
      </section>

      {/* Distances */}
      <section className="space-y-4">
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
      </section>

      {/* Registration */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Inscrição</h2>

        <div className="space-y-2">
          <Label htmlFor="registrationPrice">Valor da inscrição *</Label>
          <Input
            id="registrationPrice"
            value={registrationPrice}
            onChange={(e) => setRegistrationPrice(e.target.value)}
            placeholder="Ex: 1º lote R$80, 2º lote R$100"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registrationLink">Link de inscrição *</Label>
          <Input
            id="registrationLink"
            type="url"
            value={registrationLink}
            onChange={(e) => setRegistrationLink(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registrationDeadline">Prazo final de inscrição *</Label>
          <Input
            id="registrationDeadline"
            type="date"
            value={registrationDeadline}
            onChange={(e) => setRegistrationDeadline(e.target.value)}
            required
          />
        </div>
      </section>

      {/* Prize */}
      <section className="space-y-4">
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
            <textarea
              id="prizeDetails"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={prizeDetails}
              onChange={(e) => setPrizeDetails(e.target.value)}
              placeholder="Ex: R$1.000 (1º), R$500 (2º), R$300 (3º)"
            />
          </div>
        )}
      </section>

      {/* Route & Description */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Percurso e Descrição</h2>

        <div className="space-y-2">
          <Label htmlFor="routeDescription">Descrição do percurso</Label>
          <textarea
            id="routeDescription"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={routeDescription}
            onChange={(e) => setRouteDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição adicional</Label>
          <textarea
            id="description"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </section>

      <div className="flex gap-3">
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

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RaceDistanceBadges } from "@/components/races/race-distance-badges";
import { RacePrizeBadge } from "@/components/races/race-prize-badge";
import { RaceStatusBadge } from "@/components/races/race-status-badge";
import { RsvpButton } from "@/components/rsvp/rsvp-button";
import {
  CalendarDays,
  Clock,
  MapPin,
  ExternalLink,
  Route,
  Users,
  Trophy,
  Banknote,
} from "lucide-react";
import { formatDateFull, formatTime } from "@/lib/utils";
import { PRIZE_TYPES } from "@/lib/constants";
import type { Race } from "@/types/race";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: race } = await supabase
    .from("races")
    .select("name, city, date, distances")
    .eq("slug", slug)
    .single();

  if (!race) return { title: "Corrida não encontrada" };

  const distances = (race.distances as string[]).map((d: string) => d.toUpperCase()).join(", ");

  return {
    title: race.name,
    description: `${race.name} em ${race.city} — ${distances}. Veja detalhes e marque sua participação.`,
    openGraph: {
      title: race.name,
      description: `Corrida em ${race.city} — ${distances}`,
      type: "article",
    },
  };
}

export default async function RaceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: race } = await supabase
    .from("races")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!race) notFound();

  const typedRace = race as Race;
  const today = new Date().toISOString().split("T")[0];
  const deadlinePassed = typedRace.registration_deadline < today;
  const deadlineSoon =
    !deadlinePassed &&
    new Date(typedRace.registration_deadline).getTime() - Date.now() <
      3 * 24 * 60 * 60 * 1000;

  // Fetch current user's RSVP status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRsvped = false;
  if (user) {
    const { data: rsvp } = await supabase
      .from("rsvps")
      .select("id")
      .eq("user_id", user.id)
      .eq("race_id", typedRace.id)
      .single();
    userRsvped = !!rsvp;
  }

  // Fetch RSVP participants
  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("id, profiles:user_id(full_name, avatar_url)")
    .eq("race_id", typedRace.id)
    .limit(10);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: typedRace.name,
    startDate: `${typedRace.date}T${typedRace.start_time || "06:00"}`,
    location: {
      "@type": "Place",
      name: typedRace.address,
      address: {
        "@type": "PostalAddress",
        addressLocality: typedRace.city,
        addressRegion: typedRace.state,
        addressCountry: "BR",
      },
    },
    description: typedRace.description || `Corrida de rua em ${typedRace.city}`,
    organizer: typedRace.organizer
      ? { "@type": "Organization", name: typedRace.organizer }
      : undefined,
    url: `${baseUrl}/corrida/${typedRace.slug}`,
    eventStatus:
      typedRace.status === "cancelled"
        ? "https://schema.org/EventCancelled"
        : typedRace.status === "postponed"
          ? "https://schema.org/EventPostponed"
          : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  };

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {typedRace.status !== "confirmed" && (
            <RaceStatusBadge status={typedRace.status} />
          )}
          <RacePrizeBadge prizeType={typedRace.prize_type} />
        </div>
        <h1 className="text-2xl font-bold md:text-3xl">{typedRace.name}</h1>
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {formatDateFull(typedRace.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {formatTime(typedRace.start_time)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {typedRace.city}/{typedRace.state}
          </span>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 md:col-span-2">
          {/* Address */}
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Local
            </h2>
            <p>{typedRace.address}</p>
          </section>

          {/* Distances */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Distâncias
            </h2>
            <RaceDistanceBadges distances={typedRace.distances} />
          </section>

          {/* Prize Details */}
          {typedRace.prize_type !== "none" && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Premiação
              </h2>
              <div className="flex items-start gap-2">
                {typedRace.prize_type === "money" || typedRace.prize_type === "both" ? (
                  <Banknote className="mt-0.5 h-4 w-4 text-green-600" />
                ) : (
                  <Trophy className="mt-0.5 h-4 w-4 text-yellow-600" />
                )}
                <div>
                  <p className="font-medium">
                    {PRIZE_TYPES[typedRace.prize_type as keyof typeof PRIZE_TYPES]}
                  </p>
                  {typedRace.prize_details && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {typedRace.prize_details}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Route */}
          {typedRace.route_description && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Percurso
              </h2>
              <div className="flex items-start gap-2">
                <Route className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <p>{typedRace.route_description}</p>
              </div>
            </section>
          )}

          {/* Description */}
          {typedRace.description && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Sobre a corrida
              </h2>
              <p className="text-muted-foreground">{typedRace.description}</p>
            </section>
          )}

          {/* Organizer */}
          {typedRace.organizer && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Organizador
              </h2>
              <p>{typedRace.organizer}</p>
            </section>
          )}

          {/* Participants */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Participantes ({typedRace.rsvp_count})
            </h2>
            {rsvps && rsvps.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {rsvps.map((rsvp) => {
                  const profile = rsvp.profiles as unknown as { full_name: string | null; avatar_url: string | null } | null;
                  return (
                    <Badge key={rsvp.id} variant="secondary" className="gap-1.5 px-3 py-1">
                      <Users className="h-3 w-3" />
                      {profile?.full_name ?? "Corredor"}
                    </Badge>
                  );
                })}
                {typedRace.rsvp_count > 10 && (
                  <Badge variant="secondary" className="px-3 py-1">
                    +{typedRace.rsvp_count - 10} mais
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ninguém confirmou presença ainda. Seja o primeiro!
              </p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Registration Card */}
          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="font-semibold">Inscrição</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Valor:</span>{" "}
                {typedRace.registration_price}
              </p>
              <p className="flex items-center gap-1">
                <span className="text-muted-foreground">Prazo:</span>{" "}
                {formatDateFull(typedRace.registration_deadline)}
                {deadlineSoon && (
                  <Badge variant="outline" className="ml-1 bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                    Expirando!
                  </Badge>
                )}
              </p>
            </div>
            {deadlinePassed ? (
              <Badge variant="secondary" className="w-full justify-center py-2">
                Inscrições encerradas
              </Badge>
            ) : (
              <Button className="w-full" asChild>
                <a
                  href={typedRace.registration_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Inscreva-se
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>

          {/* RSVP */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold">Vou nessa!</h3>
            <p className="text-sm text-muted-foreground">
              {typedRace.rsvp_count} {typedRace.rsvp_count === 1 ? "pessoa confirmou" : "pessoas confirmaram"}
            </p>
            <RsvpButton
              raceId={typedRace.id}
              initialRsvped={userRsvped}
              initialCount={typedRace.rsvp_count}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBillingById } from "@/lib/payments/billing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RaceDistanceBadges } from "@/components/races/race-distance-badges";
import { RacePrizeBadge } from "@/components/races/race-prize-badge";
import { RaceStatusBadge } from "@/components/races/race-status-badge";
import { RsvpProvider, ParticipantsSection, RsvpCard } from "./race-detail-client";
import { PromoteRaceCard } from "@/components/races/promote-race-card";
import {
  CalendarDays,
  ChevronLeft,
  Clock,
  MapPin,
  ExternalLink,
  Route,
  Trophy,
  Banknote,
} from "lucide-react";
import { formatDateFull, formatTime, todayInBrazil, utcNow } from "@/lib/date";
import { PRIZE_TYPES } from "@/lib/constants";
import type { Race } from "@/types/race";
import type { Metadata } from "next";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ destaque?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: race } = await supabase
    .from("races")
    .select("name, city, date, distances, image_url")
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
      images: race.image_url ? [{ url: race.image_url }] : undefined,
    },
  };
}

export default async function RaceDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearch = await searchParams;
  const paymentSuccess = resolvedSearch?.destaque === "sucesso";
  const supabase = await createClient();

  const { data: race } = await supabase
    .from("races")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!race) notFound();

  const typedRace = race as Race;
  const today = todayInBrazil();
  const deadlinePassed = typedRace.registration_deadline < today;
  // Deadline is "soon" if within 3 days — compare date strings (DATE type)
  const deadlineSoon =
    !deadlinePassed &&
    typedRace.registration_deadline <= (() => {
      const d = new Date(today + "T00:00:00");
      d.setDate(d.getDate() + 3);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    })();

  // Fetch current user's RSVP status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = !!user && user.id === typedRace.created_by;

  // Verify promotion payment when returning from checkout
  let promotionVerified = false;
  if (paymentSuccess && !typedRace.is_promoted && isOwner && user) {
    try {
      const admin = createAdminClient();
      const { data: pendingOrder } = await admin
        .from("payment_orders")
        .select("id, abacatepay_id, status")
        .eq("order_type", "race_promotion")
        .eq("external_id", typedRace.id)
        .eq("status", "PENDING")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (pendingOrder?.abacatepay_id) {
        const billing = await getBillingById(pendingOrder.abacatepay_id);
        if (billing?.status === "PAID") {
          const promotedUntil = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString();

          await Promise.all([
            admin
              .from("payment_orders")
              .update({
                status: "PAID",
                paid_amount: billing.amount,
                paid_at: utcNow(),
              })
              .eq("id", pendingOrder.id),
            admin
              .from("races")
              .update({ is_promoted: true, promoted_until: promotedUntil })
              .eq("id", typedRace.id),
          ]);

          promotionVerified = true;
          console.info(
            `[Race Detail] Promotion verified via billing check for race ${typedRace.id}`
          );
        }
      }
    } catch (err) {
      console.error("[Race Detail] Failed to verify promotion payment:", err);
    }
  }
  const isPromoted = typedRace.is_promoted || promotionVerified;

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
    .select("profiles!rsvps_user_id_fkey(id, full_name, avatar_url)")
    .eq("race_id", typedRace.id)
    .limit(10);

  const participants = (rsvps ?? []).map((r) => ({
    id: r.profiles?.id ?? "",
    full_name: r.profiles?.full_name ?? null,
    avatar_url: r.profiles?.avatar_url ?? null,
  }));

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: typedRace.name,
    startDate: `${typedRace.date}T${typedRace.start_time || "06:00:00"}-03:00`,
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
    image: typedRace.image_url || undefined,
  };

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Back link */}
      <Link
        href="/corridas"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar para listagem
      </Link>

      {/* Header */}
      <div className="mb-8 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {typedRace.status !== "confirmed" && (
            <RaceStatusBadge status={typedRace.status} />
          )}
          <RacePrizeBadge prizeType={typedRace.prize_type} />
        </div>
        <h1 className="text-2xl font-medium text-[#0D1B2A] md:text-3xl tracking-tight">{typedRace.name}</h1>
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

      {/* Banner image */}
      {typedRace.image_url && (
        <div className="relative mb-8 aspect-[21/9] w-full overflow-hidden rounded-xl">
          <Image
            src={typedRace.image_url}
            alt={typedRace.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1024px"
            priority
          />
        </div>
      )}

      <RsvpProvider
        raceId={typedRace.id}
        initialRsvped={userRsvped}
        initialCount={typedRace.rsvp_count}
        initialParticipants={participants}
      >
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

            {/* Participants — reacts to RSVP toggle */}
            <ParticipantsSection />
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Registration Card */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4">
              <h3 className="font-semibold text-[#0D1B2A]">Inscrição</h3>
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
                    href={`/api/r/${typedRace.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Inscreva-se
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>

            {/* RSVP Card — shares state with ParticipantsSection */}
            <RsvpCard />

            {/* Promote card — payment for owner, contact hint for others (hidden when already promoted + not owner) */}
            {(!isPromoted || isOwner) && (
              <PromoteRaceCard
                raceId={typedRace.id}
                raceName={typedRace.name}
                isPromoted={isPromoted}
                isOwner={isOwner}
              />
            )}
          </aside>
        </div>
      </RsvpProvider>
    </div>
  );
}

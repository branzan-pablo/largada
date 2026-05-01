import { cache } from "react";
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
import {
  RsvpProvider,
  ParticipantsSection,
  RsvpCard,
  StickyActionBar,
  ExpandableDescription,
  ExpandableText,
} from "./race-detail-client";
import { PromoteRaceCard } from "@/components/races/promote-race-card";
import { RaceShareButton } from "@/components/races/race-share-button";
import { RaceViewTracker } from "@/components/races/race-view-tracker";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  Clock,
  ExternalLink,
  Info,
  MapPin,
  Route,
  Trophy,
  Banknote,
} from "lucide-react";
import { formatDateFull, formatTime, todayInBrazil, utcNow, futureUtc } from "@/lib/date";
import { PRIZE_TYPES } from "@/lib/constants";
import type { Race, RegistrationBatch } from "@/types/race";
import type { Metadata } from "next";
import Link from "next/link";

// ISR: revalidate every 5 minutes (same as /corridas)
export const revalidate = 300;

// Deduplicated fetch — React.cache() ensures this runs only once per request
const getRaceBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("races")
    .select("*")
    .eq("slug", slug)
    .single();
  return data as Race | null;
});

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ destaque?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const race = await getRaceBySlug(slug);

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

  const race = await getRaceBySlug(slug);

  if (!race) notFound();

  const typedRace = race as Race;
  const today = todayInBrazil();
  const deadlinePassed = typedRace.registration_deadline < today;
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
          const promotedUntil = futureUtc(30);

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

  const [userRsvpResult, rsvpsResult] = await Promise.all([
    user
      ? supabase.from("rsvps").select("id").eq("user_id", user.id).eq("race_id", typedRace.id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("rsvps")
      .select("profiles!rsvps_user_id_fkey(id, full_name, avatar_url)")
      .eq("race_id", typedRace.id)
      .limit(10),
  ]);

  const userRsvped = !!userRsvpResult.data;
  const participants = (rsvpsResult.data ?? []).map((r) => ({
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <RaceViewTracker raceId={typedRace.id} />

      {/* Back link + share */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link
          href="/corridas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para listagem
        </Link>
        <RaceShareButton
          raceName={typedRace.name}
          city={typedRace.city}
          state={typedRace.state}
          date={typedRace.date}
          startTime={typedRace.start_time}
          distances={typedRace.distances as string[]}
          shareUrl={`${baseUrl}/corrida/${typedRace.slug}`}
          imageUrl={typedRace.image_url}
        />
      </div>

      {/* Hero */}
      <div className="relative -mx-4 md:-mx-0 mb-6 aspect-[16/9] md:aspect-[21/9] w-[calc(100%+2rem)] md:w-full overflow-hidden md:rounded-xl">
        {typedRace.image_url ? (
          <>
            <Image
              src={typedRace.image_url}
              alt={typedRace.name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
        )}
        {/* Overlay content */}
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {typedRace.status !== "confirmed" && (
              <RaceStatusBadge status={typedRace.status} />
            )}
            <RacePrizeBadge prizeType={typedRace.prize_type} />
            {isPromoted && (
              <Badge className="bg-yellow-400/90 text-yellow-950 text-xs">
                Destaque
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
            {typedRace.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-white text-sm">
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
      </div>

      <RsvpProvider
        raceId={typedRace.id}
        initialRsvped={userRsvped}
        initialCount={typedRace.rsvp_count}
        initialParticipants={participants}
      >
        {/* Quick Info Strip */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-card p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Data
              </span>
              <p className="font-semibold text-[#0D1B2A]">{formatDateFull(typedRace.date)}</p>
            </div>
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Horário
              </span>
              <p className="font-semibold text-[#0D1B2A]">{formatTime(typedRace.start_time)}</p>
            </div>
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Local
              </span>
              <p className="font-semibold text-[#0D1B2A]">{typedRace.city}/{typedRace.state}</p>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Distâncias</span>
              <RaceDistanceBadges distances={typedRace.distances} />
            </div>
          </div>
          {typedRace.address && typedRace.address !== `${typedRace.city}/${typedRace.state}` && (
            <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-muted-foreground flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {typedRace.address}
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Sidebar */}
          <aside className="order-2 md:order-2 md:col-start-3 space-y-4">
            {/* Registration Card */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4">
              <h3 className="font-semibold text-[#0D1B2A]">Inscrição</h3>

              {/* Registration batches (lotes) */}
              {(typedRace.registration_batches as RegistrationBatch[] | null)?.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valores</p>
                  {(typedRace.registration_batches as RegistrationBatch[]).map((batch, i) => (
                    <div key={i} className="rounded-lg bg-white border border-gray-100 p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-semibold text-[#0D1B2A]">{batch.name}</p>
                        {batch.deadline && (
                          <span className="text-[10px] text-muted-foreground">
                            até {formatDateFull(batch.deadline)}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {batch.items.map((item, j) => (
                          <div key={j} className="flex items-center justify-between gap-2 text-sm">
                            <span className="text-muted-foreground text-xs">{item.label}</span>
                            <span className="font-medium whitespace-nowrap">{item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {typedRace.registration_price && (
                    <div className="rounded-lg bg-white border border-gray-100 p-3">
                      <ExpandableText text={typedRace.registration_price} maxLength={100} />
                    </div>
                  )}
                </div>
              ) : typedRace.registration_prices && Object.keys(typedRace.registration_prices).length > 0 ? (
                <div className="rounded-lg bg-white border border-gray-100 p-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Valor</p>
                  <div className="space-y-1.5">
                    {Object.entries(typedRace.registration_prices as Record<string, string>).map(([dist, price]) => (
                      <div key={dist} className="flex items-center justify-between gap-2 text-sm">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {dist.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{price}</span>
                      </div>
                    ))}
                  </div>
                  {typedRace.registration_price && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <ExpandableText text={typedRace.registration_price} maxLength={100} />
                    </div>
                  )}
                </div>
              ) : typedRace.registration_price ? (
                <div className="rounded-lg bg-white border border-gray-100 p-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Valor</p>
                  <ExpandableText text={typedRace.registration_price} maxLength={100} />
                </div>
              ) : null}

              <div className="rounded-lg bg-white border border-gray-100 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Prazo</p>
                <p className="text-sm font-medium flex items-center gap-1">
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

            {/* RSVP Card — hidden on mobile where StickyActionBar handles it */}
            <div className="hidden md:block">
              <RsvpCard deadlinePassed={deadlinePassed} />
            </div>

            {/* Promote card */}
            {(!isPromoted || isOwner) && (
              <PromoteRaceCard
                raceId={typedRace.id}
                raceName={typedRace.name}
                isPromoted={isPromoted}
                isOwner={isOwner}
                registrationDeadline={typedRace.registration_deadline}
              />
            )}
          </aside>

          {/* Main Content */}
          <div className="order-1 md:order-1 md:col-span-2 space-y-5">
            {/* Description */}
            {typedRace.description && (
              <section className="rounded-xl border border-gray-200 bg-card p-5">
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Sobre a corrida
                </h2>
                <ExpandableDescription text={typedRace.description} />
              </section>
            )}

            {/* Details Card — consolidated organizer, route, notes, link */}
            {(typedRace.organizer || typedRace.route_description || typedRace.notes || typedRace.link) && (
              <section className="rounded-xl border border-gray-200 bg-card p-5">
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Detalhes
                </h2>
                <div className="space-y-3">
                  {typedRace.organizer && (
                    <div className="flex items-start gap-3">
                      <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Organizador</p>
                        <p className="text-sm font-medium text-[#0D1B2A]">{typedRace.organizer}</p>
                      </div>
                    </div>
                  )}
                  {typedRace.route_description && (
                    <div className="flex items-start gap-3">
                      <Route className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Percurso</p>
                        <p className="text-sm text-[#0D1B2A]">{typedRace.route_description}</p>
                      </div>
                    </div>
                  )}
                  {typedRace.notes && (
                    <div className="flex items-start gap-3">
                      <Info className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Observações</p>
                        <p className="text-sm text-[#0D1B2A]">{typedRace.notes}</p>
                      </div>
                    </div>
                  )}
                  {typedRace.link && (
                    <div className="flex items-start gap-3">
                      <ExternalLink className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Site oficial</p>
                        <a
                          href={typedRace.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Acessar
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Prize Details */}
            {typedRace.prize_type !== "none" && (
              <section className="rounded-xl border border-gray-200 bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  {typedRace.prize_type === "money" || typedRace.prize_type === "both" ? (
                    <Banknote className="h-4 w-4 text-green-600" />
                  ) : (
                    <Trophy className="h-4 w-4 text-yellow-600" />
                  )}
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Premiação
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {PRIZE_TYPES[typedRace.prize_type as keyof typeof PRIZE_TYPES]}
                  </Badge>
                </div>
                {typedRace.prize_details && (
                  <ExpandableDescription text={typedRace.prize_details} maxLines={3} />
                )}
              </section>
            )}

            {/* Participants — only shown when there are participants */}
            <ParticipantsSection />
          </div>
        </div>

        {/* Sticky action bar — mobile only */}
        <StickyActionBar
          registrationSlug={typedRace.slug}
          deadlinePassed={deadlinePassed}
        />

        {/* Bottom padding so sticky bar doesn't cover content on mobile */}
        <div className="h-20 md:hidden" />
      </RsvpProvider>
    </>
  );
}

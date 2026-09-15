import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Banknote, Building2, CalendarDays, ChevronLeft, Clock, ExternalLink, Info, MapPin, Route, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RaceDistanceBadges } from "@/components/races/race-distance-badges";
import { RacePrizeBadge } from "@/components/races/race-prize-badge";
import { RacePrizeAmountBadge } from "@/components/races/race-prize-amount-badge";
import { RaceShareButton } from "@/components/races/race-share-button";
import { RaceDetailHeroImage } from "@/components/races/race-detail-hero-image";
import { SupportLargada } from "@/components/races/support-largada";
import { PRIZE_TYPES } from "@/lib/constants";
import { formatDateFull, formatTime, parseRaceDate, todayInBrazil } from "@/lib/date";
import type { Race, RegistrationBatch } from "@/types/race";

export const revalidate = 300;

const getRaceBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("races")
    .select("*")
    .eq("slug", slug)
    .eq("status", "confirmed")
    .single();
  return data as Race | null;
});

export async function generateMetadata({ params }: PageProps<"/corrida/[slug]">): Promise<Metadata> {
  const race = await getRaceBySlug((await params).slug);
  if (!race) return { title: "Corrida não encontrada" };
  const distances = race.distances.map((distance) => distance.toUpperCase()).join(", ");
  return {
    title: race.name,
    description: `${race.name} em ${race.city}. ${distances}. Consulte os detalhes da prova.`,
    openGraph: {
      title: race.name,
      description: `Corrida em ${race.city}. ${distances}`,
      type: "article",
      images: race.image_url ? [{ url: race.image_url }] : undefined,
    },
  };
}

export default async function RaceDetailPage({ params }: PageProps<"/corrida/[slug]">) {
  const race = await getRaceBySlug((await params).slug);
  if (!race) notFound();

  const deadlinePassed = race.registration_deadline < todayInBrazil();
  const raceDate = parseRaceDate(race.date);
  const day = format(raceDate, "dd");
  const month = format(raceDate, "MMM", { locale: ptBR }).toUpperCase();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: race.name,
    startDate: `${race.date}T${race.start_time || "06:00:00"}-03:00`,
    location: {
      "@type": "Place",
      name: race.address,
      address: { "@type": "PostalAddress", addressLocality: race.city, addressRegion: race.state, addressCountry: "BR" },
    },
    description: race.description || `Corrida de rua em ${race.city}`,
    organizer: race.organizer ? { "@type": "Organization", name: race.organizer } : undefined,
    url: `${baseUrl}/corrida/${race.slug}`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: race.image_url || undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Voltar para listagem
        </Link>
        <RaceShareButton
          raceName={race.name}
          city={race.city}
          state={race.state}
          date={race.date}
          startTime={race.start_time}
          distances={race.distances}
          shareUrl={`${baseUrl}/corrida/${race.slug}`}
          imageUrl={race.image_url}
        />
      </div>

      <div className="relative -mx-4 mb-6 aspect-video w-[calc(100%+2rem)] overflow-hidden md:mx-0 md:aspect-[21/9] md:w-full md:rounded-xl">
        <RaceDetailHeroImage imageUrl={race.image_url} raceName={race.name} day={day} month={month} />
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
          <div className="mb-2 flex flex-wrap gap-2"><RacePrizeBadge prizeType={race.prize_type} /></div>
          <h1 className="text-2xl font-bold leading-tight text-white md:text-3xl">{race.name}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white">
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatDateFull(race.date)}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{formatTime(race.start_time)}</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{race.city}/{race.state}</span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl border bg-card p-4 text-sm md:grid-cols-4">
        <InfoItem label="Data" value={formatDateFull(race.date)} icon={<CalendarDays className="h-3.5 w-3.5" />} />
        <InfoItem label="Horário" value={formatTime(race.start_time)} icon={<Clock className="h-3.5 w-3.5" />} />
        <InfoItem label="Local" value={`${race.city}/${race.state}`} icon={<MapPin className="h-3.5 w-3.5" />} />
        <div><p className="mb-1 text-xs font-medium text-muted-foreground">Distâncias</p><RaceDistanceBadges distances={race.distances} /></div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <main className="space-y-5 md:col-span-2">
          {race.description && <Section title="Sobre a corrida"><p className="whitespace-pre-line text-sm text-[#0D1B2A]">{race.description}</p></Section>}
          {(race.organizer || race.route_description || race.notes || race.address) && (
            <Section title="Detalhes">
              <div className="space-y-3 text-sm">
                {race.organizer && <Detail icon={<Building2 />} label="Organizador" value={race.organizer} />}
                {race.address && <Detail icon={<MapPin />} label="Endereço" value={race.address} />}
                {race.route_description && <Detail icon={<Route />} label="Percurso" value={race.route_description} />}
                {race.notes && <Detail icon={<Info />} label="Observações" value={race.notes} />}
              </div>
            </Section>
          )}
          {race.prize_type !== "none" && (
            <Section title="Premiação">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {race.prize_type === "money" || race.prize_type === "both" ? <Banknote className="h-4 w-4 text-green-600" /> : <Trophy className="h-4 w-4 text-yellow-600" />}
                <Badge variant="secondary">{PRIZE_TYPES[race.prize_type]}</Badge>
                <RacePrizeAmountBadge prize={race.prize_structured} />
              </div>
              {race.prize_details && <p className="whitespace-pre-line text-sm text-[#0D1B2A]">{race.prize_details}</p>}
            </Section>
          )}
        </main>

        <aside className="rounded-xl border bg-gray-50 p-5">
          <h2 className="mb-4 font-semibold text-[#0D1B2A]">Inscrição</h2>
          <RegistrationPrices race={race} />
          <div className="my-4 rounded-lg border bg-white p-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">Prazo</p>
            <p className="mt-1 text-sm font-medium">{formatDateFull(race.registration_deadline)}</p>
          </div>
          {deadlinePassed ? (
            <Badge variant="secondary" className="w-full justify-center py-2">Inscrições encerradas</Badge>
          ) : (
            <Button className="w-full" asChild>
              <a href={`/api/r/${race.slug}`} target="_blank" rel="noopener noreferrer">Inscreva-se <ExternalLink className="ml-2 h-4 w-4" /></a>
            </Button>
          )}
          <SupportLargada />
        </aside>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border bg-card p-5"><h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>{children}</section>;
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div><p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{icon}{label}</p><p className="mt-1 font-semibold text-[#0D1B2A]">{value}</p></div>;
}

function Detail({ icon, label, value }: { icon: React.ReactElement<{ className?: string }>; label: string; value: string }) {
  return <div className="flex items-start gap-3">{icon}<div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="text-[#0D1B2A]">{value}</p></div></div>;
}

function RegistrationPrices({ race }: { race: Race }) {
  const batches = race.registration_batches as RegistrationBatch[] | null;
  return (
    <div className="space-y-2 text-sm">
      {batches?.map((batch) => (
        <div key={batch.name} className="rounded-lg border bg-white p-3">
          <p className="mb-1 font-semibold text-[#0D1B2A]">{batch.name}</p>
          {batch.items.map((item) => <div key={`${item.label}-${item.price}`} className="flex justify-between gap-2"><span>{item.label}</span><strong>{item.price}</strong></div>)}
        </div>
      ))}
      {!batches?.length && race.registration_price && <div className="rounded-lg border bg-white p-3 whitespace-pre-line">{race.registration_price}</div>}
    </div>
  );
}

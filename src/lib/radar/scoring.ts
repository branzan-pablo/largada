/**
 * Radar de Pódio — Scoring Algorithm
 *
 * Calcula a compatibilidade entre o perfil do corredor e cada corrida.
 * Score final: 0–100 (quanto maior, melhor a chance de pódio).
 *
 * Fatores:
 * 1. Proximidade geográfica (peso 30%)
 * 2. Competitividade (RSVP count — menos inscritos = mais chance) (peso 35%)
 * 3. Premiação (corridas com premiação atraem menos amadores no pódio) (peso 15%)
 * 4. Tempo até a corrida (corridas mais próximas = mais relevantes) (peso 20%)
 */

import { haversineDistance } from "@/lib/geo";

export interface RunnerProfile {
  pace: string; // "05:30"
  distance: string; // "10k"
  sex: string;
  ageCategory: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

export interface RaceCandidate {
  id: string;
  name: string;
  slug: string;
  date: string;
  startTime: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  distances: string[];
  rsvpCount: number;
  prizeType: string;
  prizeDetails: string | null;
  registrationPrice: string;
  registrationLink: string;
  imageUrl: string | null;
  isPromoted: boolean;
}

export interface ScoredRace {
  race: RaceCandidate;
  score: number; // 0–100
  distanceKm: number; // km from runner
  factors: {
    proximity: number;
    competition: number;
    prize: number;
    timing: number;
  };
  label: "alta" | "media" | "baixa";
}

const WEIGHTS = {
  proximity: 0.3,
  competition: 0.35,
  prize: 0.15,
  timing: 0.2,
} as const;

const MAX_DISTANCE_KM = 300;

/**
 * Score de proximidade: 100 se mesma cidade, 0 se >= MAX_DISTANCE_KM
 */
function proximityScore(
  runnerLat: number | null,
  runnerLng: number | null,
  raceLat: number,
  raceLng: number,
): { score: number; distanceKm: number } {
  if (runnerLat == null || runnerLng == null) {
    return { score: 50, distanceKm: -1 }; // sem localização, score neutro
  }

  const km = haversineDistance(runnerLat, runnerLng, raceLat, raceLng);
  const score = Math.max(0, 100 * (1 - km / MAX_DISTANCE_KM));
  return { score, distanceKm: Math.round(km) };
}

/**
 * Score de competitividade: menos inscritos = mais chance de pódio.
 * 0 RSVP = 100, 50+ = baixo score.
 */
function competitionScore(rsvpCount: number): number {
  if (rsvpCount <= 5) return 100;
  if (rsvpCount <= 15) return 85;
  if (rsvpCount <= 30) return 65;
  if (rsvpCount <= 50) return 45;
  if (rsvpCount <= 100) return 25;
  return 10;
}

/**
 * Score de premiação: corridas com premiação acessível são melhores.
 * "none" (sem premiação) = corridas menores = mais chance.
 * "trophy" = intermediário.
 * "money"/"both" = mais competitivo, mas mais recompensador.
 */
function prizeScore(prizeType: string): number {
  switch (prizeType) {
    case "none":
      return 90; // menos competição, mais chance
    case "trophy":
      return 70;
    case "money":
      return 50;
    case "both":
      return 40;
    default:
      return 60;
  }
}

/**
 * Score de timing: corridas mais próximas no tempo = mais relevantes.
 * 0-14 dias = 100, 15-30 = 80, 31-60 = 50, 60+ = 20.
 */
function timingScore(raceDate: string): number {
  const now = new Date();
  const race = new Date(raceDate + "T00:00:00");
  const daysUntil = Math.max(0, (race.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil <= 14) return 100;
  if (daysUntil <= 30) return 80;
  if (daysUntil <= 60) return 55;
  if (daysUntil <= 90) return 35;
  return 20;
}

function getLabel(score: number): "alta" | "media" | "baixa" {
  if (score >= 70) return "alta";
  if (score >= 45) return "media";
  return "baixa";
}

/**
 * Filtra corridas que oferecem a distância do corredor e calcula scores.
 * Retorna ordenado por score (maior primeiro).
 */
export function scoreRaces(
  profile: RunnerProfile,
  races: RaceCandidate[],
): ScoredRace[] {
  // Filtrar por distância
  const matching = races.filter((r) =>
    r.distances.some((d) => d.toLowerCase() === profile.distance.toLowerCase()),
  );

  const scored = matching.map((race) => {
    const prox = proximityScore(
      profile.latitude,
      profile.longitude,
      race.latitude,
      race.longitude,
    );
    const comp = competitionScore(race.rsvpCount);
    const prize = prizeScore(race.prizeType);
    const timing = timingScore(race.date);

    const score = Math.round(
      prox.score * WEIGHTS.proximity +
        comp * WEIGHTS.competition +
        prize * WEIGHTS.prize +
        timing * WEIGHTS.timing,
    );

    return {
      race,
      score,
      distanceKm: prox.distanceKm,
      factors: {
        proximity: Math.round(prox.score),
        competition: comp,
        prize,
        timing,
      },
      label: getLabel(score),
    };
  });

  // Ordenar por score (desc), promoted primeiro em caso de empate
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.race.isPromoted !== b.race.isPromoted) return a.race.isPromoted ? -1 : 1;
    return 0;
  });

  return scored;
}

/** Número de resultados gratuitos mostrados com detalhes */
export const FREE_RESULTS_COUNT = 2;

/** Score mínimo para ser considerado "recomendado" */
export const MIN_RECOMMENDED_SCORE = 40;

import type { Scraper, ScrapedRace } from "./types";
import { equilibrioScraper } from "./equilibrio";
import { raxEventosScraper } from "./rax-eventos";
import { tnvTeamScraper } from "./tnv-team";
import { tvcomRunningScraper } from "./tvcom-running";

export type { ScrapedRace } from "./types";

const scrapers: Scraper[] = [
  equilibrioScraper,
  raxEventosScraper,
  tnvTeamScraper,
  tvcomRunningScraper,
];

export async function runAllScrapers(): Promise<ScrapedRace[]> {
  const results = await Promise.allSettled(scrapers.map((s) => s.scrape()));

  const allRaces: ScrapedRace[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      console.log(
        `[scrapers] ${scrapers[i].name}: ${result.value.length} corridas`,
      );
      allRaces.push(...result.value);
    } else {
      console.error(
        `[scrapers] ${scrapers[i].name} falhou:`,
        result.reason instanceof Error ? result.reason.message : result.reason,
      );
    }
  }

  return allRaces;
}

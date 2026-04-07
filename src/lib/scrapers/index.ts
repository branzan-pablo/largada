import type { Scraper, ScrapedRace } from "./types";
import { equilibrioScraper } from "./equilibrio";
import { incentivoEsporteScraper } from "./incentivo-esporte";
import { raxEventosScraper } from "./rax-eventos";
import { tnvTeamScraper } from "./tnv-team";
import { tvcomRunningScraper } from "./tvcom-running";
import { wxEsportesScraper } from "./wx-esportes";
import { alcerScraper } from "./alcer";

export type { ScrapedRace } from "./types";

const scrapers: Scraper[] = [
  alcerScraper,
  equilibrioScraper,
  incentivoEsporteScraper,
  raxEventosScraper,
  tnvTeamScraper,
  tvcomRunningScraper,
  wxEsportesScraper,
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

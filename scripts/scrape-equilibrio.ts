/**
 * CLI script para scraping manual de equilibrio.esp.br
 *
 * Uso: npx tsx scripts/scrape-equilibrio.ts [--output <arquivo.json>]
 */

import { scrapeEquilibrio } from "../src/lib/scrapers/equilibrio";
import { writeFileSync } from "fs";

async function main() {
  const args = process.argv.slice(2);
  const outputIndex = args.indexOf("--output");
  const outputFile = outputIndex >= 0 ? args[outputIndex + 1] : null;

  console.log("Iniciando scraping de equilibrio.esp.br...\n");

  const corridas = await scrapeEquilibrio();
  console.log(
    `\nScraping finalizado! ${corridas.length} corridas extraídas.\n`,
  );

  const json = JSON.stringify(corridas, null, 2);

  if (outputFile) {
    writeFileSync(outputFile, json, "utf-8");
    console.log(`JSON salvo em: ${outputFile}`);
  } else {
    console.log(json);
  }
}

main().catch((err) => {
  console.error("Erro durante scraping:", err.message);
  process.exit(1);
});

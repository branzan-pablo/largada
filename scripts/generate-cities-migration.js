#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * generate-cities-migration.js
 *
 * Fetches all Brazilian municipalities from the public dataset
 * (github.com/kelvins/municipios-brasileiros) and generates a
 * Supabase migration SQL that upserts all ~5,570 cities into
 * the existing `public.cities` table (PostGIS-enabled).
 *
 * Usage:
 *   node scripts/generate-cities-migration.js
 *
 * Output:
 *   supabase/migrations/007_all_brazilian_cities.sql
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const CSV_URL =
  "https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/csv/municipios.csv";

const OUTPUT_FILE = path.join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "007_all_brazilian_cities.sql"
);

// ---------------------------------------------------------------------------
// IBGE numeric state code → 2-letter UF abbreviation
// ---------------------------------------------------------------------------
const CODIGO_UF_TO_STATE = {
  11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA",
  16: "AP", 17: "TO", 21: "MA", 22: "PI", 23: "CE",
  24: "RN", 25: "PB", 26: "PE", 27: "AL", 28: "SE",
  29: "BA", 31: "MG", 32: "ES", 33: "RJ", 35: "SP",
  41: "PR", 42: "SC", 43: "RS", 50: "MS", 51: "MT",
  52: "GO", 53: "DF",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Follows redirects and returns the full response body as a string.
 */
function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return resolve(fetchText(res.headers.location));
        }
        if (res.statusCode !== 200) {
          return reject(
            new Error(`HTTP ${res.statusCode} fetching ${url}`)
          );
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

/**
 * Converts a city name to a URL-safe slug.
 * e.g. "São José D'Oeste" → "sao-jose-d-oeste"
 */
function slugify(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accent combining chars
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ") // replace non-alphanum with space
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/-+/g, "-") // collapse repeated hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}

/**
 * Escapes single quotes for SQL string literals.
 */
function sqlEscape(str) {
  return str.replace(/'/g, "''");
}

/**
 * Parses a single CSV line, respecting double-quoted fields.
 */
function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("⬇️  Fetching dataset from GitHub...");
  console.log(`   ${CSV_URL}\n`);

  const csvText = await fetchText(CSV_URL);
  const lines = csvText
    .split("\n")
    .map((l) => l.replace(/\r$/, "")) // strip Windows CR
    .filter(Boolean);

  const headers = parseCsvLine(lines[0]);
  const iNome = headers.indexOf("nome");
  const iLat = headers.indexOf("latitude");
  const iLng = headers.indexOf("longitude");
  // Dataset uses numeric state code; 2-letter "uf" may or may not be present
  const iUf = headers.indexOf("uf");
  const iCodigoUf = headers.indexOf("codigo_uf");

  if ([iNome, iLat, iLng].includes(-1)) {
    throw new Error(
      `Required columns (nome, latitude, longitude) not found.\nGot: ${headers.join(", ")}`
    );
  }
  if (iUf === -1 && iCodigoUf === -1) {
    throw new Error(
      `State column (uf or codigo_uf) not found.\nGot: ${headers.join(", ")}`
    );
  }

  console.log(`📄 CSV columns: ${headers.join(", ")}`);

  // -------------------------------------------------------------------------
  // Parse rows
  // -------------------------------------------------------------------------
  const rawCities = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const nome = cols[iNome];
    const lat = parseFloat(cols[iLat]);
    const lng = parseFloat(cols[iLng]);

    // Resolve state abbreviation from either "uf" or "codigo_uf" column
    let uf;
    if (iUf !== -1 && cols[iUf]) {
      uf = cols[iUf].trim();
    } else if (iCodigoUf !== -1) {
      const codigoUf = parseInt(cols[iCodigoUf], 10);
      uf = CODIGO_UF_TO_STATE[codigoUf];
    }

    if (!nome || isNaN(lat) || isNaN(lng) || !uf) {
      console.warn(`  ⚠️  Skipping malformed row ${i}: ${lines[i]}`);
      continue;
    }

    rawCities.push({ name: nome, latitude: lat, longitude: lng, stateCode: uf });
  }

  console.log(`\n✅ Parsed ${rawCities.length} municipalities`);

  // -------------------------------------------------------------------------
  // Generate unique slugs
  // Duplicates (same city name, different states) get "-{uf}" suffix.
  // -------------------------------------------------------------------------
  const slugCount = {};
  for (const c of rawCities) {
    const base = slugify(c.name);
    slugCount[base] = (slugCount[base] || 0) + 1;
  }

  const usedSlugs = new Set();
  const cities = rawCities.map((c) => {
    const base = slugify(c.name);
    let slug = slugCount[base] > 1 ? `${base}-${c.stateCode.toLowerCase()}` : base;

    // Last-resort dedup (extremely rare: same name AND same state)
    if (usedSlugs.has(slug)) {
      let n = 2;
      while (usedSlugs.has(`${slug}-${n}`)) n++;
      slug = `${slug}-${n}`;
    }
    usedSlugs.add(slug);

    return { ...c, slug };
  });

  // -------------------------------------------------------------------------
  // Build SQL
  // -------------------------------------------------------------------------
  const BATCH_SIZE = 500; // keep individual statements manageable
  const batches = [];
  for (let i = 0; i < cities.length; i += BATCH_SIZE) {
    batches.push(cities.slice(i, i + BATCH_SIZE));
  }

  const stateStats = {};
  for (const c of cities) {
    stateStats[c.stateCode] = (stateStats[c.stateCode] || 0) + 1;
  }
  const statsComment = Object.entries(stateStats)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([uf, n]) => `--   ${uf}: ${n}`)
    .join("\n");

  const batchSql = batches
    .map(
      (batch, idx) =>
        `-- Batch ${idx + 1}/${batches.length} (${batch.length} rows)\n` +
        `INSERT INTO public.cities (name, slug, state_code, latitude, longitude, active)\nVALUES\n` +
        batch
          .map(
            (c) =>
              `  ('${sqlEscape(c.name)}', '${sqlEscape(c.slug)}', '${c.stateCode}', ${c.latitude.toFixed(7)}, ${c.longitude.toFixed(7)}, true)`
          )
          .join(",\n") +
        `\nON CONFLICT (slug) DO UPDATE SET\n` +
        `  name       = EXCLUDED.name,\n` +
        `  state_code = EXCLUDED.state_code,\n` +
        `  latitude   = EXCLUDED.latitude,\n` +
        `  longitude  = EXCLUDED.longitude,\n` +
        `  active     = true;`
    )
    .join("\n\n");

  const sql = `-- ============================================================
-- Migration 007: All Brazilian Municipalities (PostGIS)
-- ============================================================
-- Source  : github.com/kelvins/municipios-brasileiros
-- Records : ${cities.length} municipalities across 26 states + DF
-- Generated: ${new Date().toISOString()}
--
-- Coverage by state:
${statsComment}
-- ============================================================
--
-- This migration is IDEMPOTENT: uses ON CONFLICT (slug) DO UPDATE.
-- Safe to re-run after adding new cities to the source dataset.
-- ============================================================

${batchSql}

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
`;

  // -------------------------------------------------------------------------
  // Write file
  // -------------------------------------------------------------------------
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, sql, "utf8");

  const fileSizeKb = Math.round(fs.statSync(OUTPUT_FILE).size / 1024);
  console.log(`\n🎉 Migration written:`);
  console.log(`   ${OUTPUT_FILE}`);
  console.log(`   Size: ${fileSizeKb} KB  |  Cities: ${cities.length}  |  Batches: ${batches.length}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review the file (optional)`);
  console.log(`  2a. Local dev  → supabase db reset`);
  console.log(`  2b. Production → supabase db push   (or apply via SQL editor)`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});

import { lookup } from "node:dns/promises";

const PRIVATE_IPV4_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\./, // CGNAT 100.64.0.0/10
];

function isPrivateIPv4(ip: string): boolean {
  return PRIVATE_IPV4_RANGES.some((re) => re.test(ip));
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80:")) return true; // link-local
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true; // unique local fc00::/7
  if (lower.startsWith("::ffff:")) {
    const v4 = lower.replace("::ffff:", "");
    return isPrivateIPv4(v4);
  }
  return false;
}

async function assertPublicHost(hostname: string): Promise<void> {
  if (hostname === "localhost") {
    throw new Error("Refusing to fetch from localhost");
  }
  const addrs = await lookup(hostname, { all: true });
  for (const { address, family } of addrs) {
    const blocked =
      family === 4 ? isPrivateIPv4(address) : isPrivateIPv6(address);
    if (blocked) {
      throw new Error(`Refusing to fetch host resolving to private address ${address}`);
    }
  }
}

export interface FetchSafeOptions {
  timeoutMs?: number;
  maxBytes?: number;
  userAgent?: string;
}

export interface FetchSafeResult {
  text: string;
  finalUrl: string;
  contentType: string | null;
  bytes: number;
}

const MAX_REDIRECTS = 5;

/**
 * Fetch a URL with SSRF protection: only http(s), revalidates host against
 * private IP ranges on every hop (initial + each redirect), size cap, timeout.
 * Used by the admin race extractor so a hostile URL cannot reach internal
 * services even via a redirect chain (e.g. evil.com → 169.254.169.254).
 */
export async function fetchSafe(
  url: string,
  options: FetchSafeOptions = {},
): Promise<FetchSafeResult> {
  const timeoutMs = options.timeoutMs ?? 15_000;
  const maxBytes = options.maxBytes ?? 5_000_000;
  const userAgent =
    options.userAgent ??
    "Mozilla/5.0 (compatible; LargadaBot/1.0; +https://largada.app)";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let currentUrl = url;

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const parsed = new URL(currentUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error(`Unsupported protocol: ${parsed.protocol}`);
      }
      await assertPublicHost(parsed.hostname);

      const response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: "manual",
        headers: { "User-Agent": userAgent, Accept: "text/html,*/*;q=0.8" },
      });

      // Follow redirects manually so we can revalidate the next hop's host.
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          throw new Error(`Redirect ${response.status} without Location header`);
        }
        if (hop === MAX_REDIRECTS) {
          throw new Error(`Too many redirects (>${MAX_REDIRECTS})`);
        }
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (!response.ok) {
        throw new Error(`Upstream returned ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > maxBytes) {
        throw new Error(
          `Response too large: ${buffer.byteLength} bytes (limit ${maxBytes})`,
        );
      }

      const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
      return {
        text,
        finalUrl: response.url || currentUrl,
        contentType: response.headers.get("content-type"),
        bytes: buffer.byteLength,
      };
    }

    throw new Error(`Too many redirects (>${MAX_REDIRECTS})`);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Pull structured signals from the head of an HTML document: Open Graph,
 * Twitter card meta tags, canonical link, and JSON-LD blocks. These are far
 * cheaper for the LLM to read than the surrounding markup and usually hold
 * the canonical image, title, description, and event date for race pages
 * that are JS-rendered (the visible HTML is sparse).
 */
export function extractMetadata(html: string): string {
  const lines: string[] = [];

  const metaAttr = /<meta\b[^>]*>/gi;
  const attrPair = /(\w[\w:-]*)=["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = metaAttr.exec(html)) !== null) {
    const tag = m[0];
    const attrs: Record<string, string> = {};
    let a: RegExpExecArray | null;
    attrPair.lastIndex = 0;
    while ((a = attrPair.exec(tag)) !== null) {
      attrs[a[1].toLowerCase()] = a[2];
    }
    const key = attrs.property ?? attrs.name;
    const value = attrs.content;
    if (!key || !value) continue;
    if (!/^(og:|twitter:|article:|event:|description$|keywords$)/i.test(key)) continue;
    lines.push(`${key}: ${value}`);
  }

  const canonicalMatch = html.match(
    /<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["']/i,
  );
  if (canonicalMatch) lines.push(`canonical: ${canonicalMatch[1]}`);

  const jsonLd = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let n: RegExpExecArray | null;
  while ((n = jsonLd.exec(html)) !== null) {
    const raw = n[1].trim();
    try {
      const parsed = JSON.parse(raw);
      const serialized = JSON.stringify(parsed).slice(0, 4000);
      lines.push(`json-ld: ${serialized}`);
    } catch {
      // skip malformed json-ld
    }
  }

  return lines.join("\n");
}

/**
 * Strip script/style tags and collapse whitespace from an HTML document so the
 * LLM gets cheaper, denser input. Prepends extracted metadata (og:*, json-ld,
 * canonical) so the LLM sees structured signals before the noisy body.
 */
export function cleanHtml(html: string, maxChars = 30_000): string {
  const metadata = extractMetadata(html);
  let body = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ");
  body = body.replace(/[ \t\f\v]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();

  const combined = metadata
    ? `METADATA:\n${metadata}\n\nBODY:\n${body}`
    : body;
  if (combined.length > maxChars) return combined.slice(0, maxChars);
  return combined;
}

// Exported for testing
export const __TESTING__ = {
  isPrivateIPv4,
  isPrivateIPv6,
};

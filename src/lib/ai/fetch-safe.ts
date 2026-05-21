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

/**
 * Fetch a URL with basic SSRF protection: only http(s), no private IPs on the
 * first hop, size cap, timeout. Used by the admin race extractor so a hostile
 * URL cannot reach internal services.
 *
 * Caveat: redirect targets are not re-validated against private IPs because
 * the consumer fetches public race pages on platforms we trust (Sympla,
 * Ticket Sports, Instagram, organizer sites). If we open this surface to
 * untrusted user input later, switch to `redirect: "manual"` and re-validate
 * each Location header before following.
 */
export async function fetchSafe(
  url: string,
  options: FetchSafeOptions = {},
): Promise<FetchSafeResult> {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Unsupported protocol: ${parsed.protocol}`);
  }

  await assertPublicHost(parsed.hostname);

  const timeoutMs = options.timeoutMs ?? 15_000;
  const maxBytes = options.maxBytes ?? 5_000_000;
  const userAgent =
    options.userAgent ??
    "Mozilla/5.0 (compatible; LargadaBot/1.0; +https://largada.app)";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": userAgent, Accept: "text/html,*/*;q=0.8" },
    });

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
      finalUrl: response.url,
      contentType: response.headers.get("content-type"),
      bytes: buffer.byteLength,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Strip script/style tags and collapse whitespace from an HTML document so the
 * LLM gets cheaper, denser input. Keeps anchor text, headings, meta tags.
 */
export function cleanHtml(html: string, maxChars = 30_000): string {
  let text = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ");
  text = text.replace(/[ \t\f\v]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
  if (text.length > maxChars) text = text.slice(0, maxChars);
  return text;
}

// Exported for testing
export const __TESTING__ = {
  isPrivateIPv4,
  isPrivateIPv6,
};

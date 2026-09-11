import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  extractRaceFromUrl,
  extractRaceFromImage,
} from "@/lib/ai/extract-race";
import { isAIEnabled } from "@/lib/ai/provider";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB base64-decoded

const bodySchema = z
  .object({
    url: z.string().url().optional(),
    imageBase64: z.string().min(32).optional(),
    imageMimeType: z.string().optional(),
  })
  .refine((v) => !!v.url !== !!v.imageBase64, {
    message: "Forneça apenas url OU imageBase64, não ambos.",
  });

function approxBase64Bytes(b64: string): number {
  // Strip data URL prefix if present
  const stripped = b64.replace(/^data:[^;]+;base64,/, "");
  return Math.floor((stripped.length * 3) / 4);
}

function normalizeBase64(b64: string): string {
  return b64.replace(/^data:[^;]+;base64,/, "");
}

export async function POST(request: Request) {
  if (!isAIEnabled()) {
    return NextResponse.json(
      { error: "Extração por IA não está disponível no momento." },
      { status: 503 },
    );
  }

  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const { limited } = await rateLimit(`ai-extract:${authResult.user.id}`, {
    max: 5,
    windowMs: 60_000,
  });
  if (limited) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde alguns segundos." },
      { status: 429 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.url) {
      const extracted = await extractRaceFromUrl(parsed.data.url);
      return NextResponse.json({ extracted, source: "url" });
    }

    const mimeType = parsed.data.imageMimeType ?? "image/png";
    const cleaned = normalizeBase64(parsed.data.imageBase64!);
    if (approxBase64Bytes(cleaned) > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: `Imagem maior que ${MAX_IMAGE_BYTES} bytes.` },
        { status: 413 },
      );
    }
    const extracted = await extractRaceFromImage(cleaned, mimeType);
    return NextResponse.json({ extracted, source: "image" });
  } catch (err) {
    console.error("[api/admin/ai/extract-race]", err);
    const message =
      err instanceof Error ? err.message : "Falha ao extrair dados.";
    return NextResponse.json(
      { error: "Extração falhou", message },
      { status: 502 },
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { describeRace } from "@/lib/ai/describe-race";
import { isAIEnabled } from "@/lib/ai/provider";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  city: z.string().max(120).nullable().optional(),
  state: z.string().max(2).nullable().optional(),
  date: z.string().max(10).nullable().optional(),
  startTime: z.string().max(5).nullable().optional(),
  distances: z.array(z.string().max(16)).nullable().optional(),
  prizeType: z.enum(["money", "trophy", "both", "none"]).nullable().optional(),
  prizeDetails: z.string().max(2000).nullable().optional(),
  registrationPrice: z.string().max(200).nullable().optional(),
  organizer: z.string().max(200).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
});

export async function POST(request: Request) {
  if (!isAIEnabled()) {
    return NextResponse.json(
      { error: "IA não disponível no momento." },
      { status: 503 },
    );
  }

  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const { limited } = rateLimit(`ai-describe:${authResult.user.id}`, {
    max: 10,
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
    const description = await describeRace({
      name: parsed.data.name,
      city: parsed.data.city ?? null,
      state: parsed.data.state ?? null,
      date: parsed.data.date ?? null,
      startTime: parsed.data.startTime ?? null,
      distances: parsed.data.distances ?? null,
      prizeType: parsed.data.prizeType ?? null,
      prizeDetails: parsed.data.prizeDetails ?? null,
      registrationPrice: parsed.data.registrationPrice ?? null,
      organizer: parsed.data.organizer ?? null,
      address: parsed.data.address ?? null,
    });
    if (!description) {
      return NextResponse.json(
        { error: "Não foi possível gerar a descrição." },
        { status: 500 },
      );
    }
    return NextResponse.json({ description });
  } catch (err) {
    console.error("[api/admin/ai/describe-race]", err);
    const message = err instanceof Error ? err.message : "Falha ao gerar.";
    return NextResponse.json(
      { error: "Geração falhou", message },
      { status: 502 },
    );
  }
}

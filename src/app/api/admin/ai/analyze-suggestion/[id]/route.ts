import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { analyzeSuggestion } from "@/lib/ai/analyze-suggestion";
import { isAIEnabled } from "@/lib/ai/provider";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAIEnabled()) {
    return NextResponse.json(
      { error: "IA não disponível no momento." },
      { status: 503 },
    );
  }

  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  if (!id || id.length < 8) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const { limited } = rateLimit(`ai-analyze-suggestion:${authResult.user.id}`, {
    max: 10,
    windowMs: 60_000,
  });
  if (limited) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde alguns segundos." },
      { status: 429 },
    );
  }

  try {
    const analysis = await analyzeSuggestion(id);
    if (!analysis) {
      return NextResponse.json(
        { error: "Não foi possível analisar a sugestão." },
        { status: 500 },
      );
    }
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("[api/admin/ai/analyze-suggestion]", err);
    const message = err instanceof Error ? err.message : "Falha na análise.";
    return NextResponse.json(
      { error: "Análise falhou", message },
      { status: 502 },
    );
  }
}

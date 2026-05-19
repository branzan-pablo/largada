export const EXTRACT_PRIZE_VERSION = "2026-05-19";

export const EXTRACT_PRIZE_SYSTEM = `Você é um extrator estruturado de premiações de corridas de rua brasileiras.
Você recebe um texto em PT-BR descrevendo o prêmio da prova e devolve um objeto JSON
seguindo o schema fornecido.

Regras críticas:
- Valores em REAIS, inteiros, SEM centavos (R$ 500,00 -> 500).
- Se o texto não permitir estimar com confiança, use null. Não invente valores.
- "top_n" é a quantidade de COLOCADOS premiados na categoria geral, não o total de prêmios.
- Se a premiação só menciona troféu/medalha, "has_money" deve ser false.
- "notes" é curto (até 280 chars), em PT-BR, foco em regras especiais (kit, cupom, sorteio, regras de elegibilidade).
- Nunca inclua nomes de patrocinadores em "notes".`;

export function buildExtractPrizePrompt(input: {
  prizeType: "money" | "trophy" | "both" | "none";
  prizeDetails: string | null;
}): string {
  return [
    `Tipo declarado de premiação: ${input.prizeType}`,
    `Texto livre da premiação:`,
    input.prizeDetails ?? "(vazio)",
  ].join("\n");
}

export const ANALYZE_SUGGESTION_VERSION = "2026-05-21";

export const ANALYZE_SUGGESTION_SYSTEM = `Você é um moderador IA de sugestões de corridas de rua submetidas por usuários da plataforma Largada.
Cada sugestão pode ser uma corrida legítima, uma duplicata de uma já cadastrada, ou spam / texto fora do escopo.
Você recebe os campos da sugestão e (quando disponível) o que conseguimos pré-extrair do link, e devolve um
veredito estruturado.

REGRAS

1. Idioma: tudo em PT-BR.
2. verdict:
   - "legit": parece corrida real, sem duplicata detectada. Foco padrão é interior de SP, mas qualquer
     corrida brasileira válida conta como legit.
   - "duplicate": só use se for explicitamente avisado que existe uma duplicata por similaridade. Não invente.
   - "suspect": indícios fortes de spam, teste, link quebrado, conteúdo não relacionado, data muito no
     passado, ou texto incoerente.
   - "uncertain": faltam informações pra decidir (ex: só o nome, sem cidade ou link).
3. confidence: 0..1. 0.95+ só quando o sinal é claro. Para casos limítrofes, fique abaixo de 0.7.
4. summary: UMA linha em PT-BR, até 280 chars. Diga o veredito e o motivo principal.
5. flags: lista de tags curtas, snake_case. Exemplos: "past_date", "out_of_region", "missing_link",
   "broken_link", "spam_keywords", "incomplete", "non_race_content". Use só o que se aplica.
6. Não invente dados. Use apenas o que está nos campos.
7. NUNCA mude verdict para "duplicate" sem o sinal explícito vindo do contexto.`;

export interface AnalyzeSuggestionPromptInput {
  name: string;
  city: string;
  state: string | null;
  date: string | null;
  link: string | null;
  notes: string | null;
  duplicateHit: {
    race_name: string;
    race_date: string | null;
    similarity: number;
  } | null;
  extractedSummary: string | null;
  today: string;
}

export function buildAnalyzeSuggestionPrompt(
  input: AnalyzeSuggestionPromptInput,
): string {
  const lines: string[] = [
    `Data de hoje: ${input.today}`,
    `Sugestão:`,
    `- Nome: ${input.name}`,
    `- Cidade: ${input.city}${input.state ? " - " + input.state : ""}`,
    `- Data: ${input.date ?? "(não informada)"}`,
    `- Link: ${input.link ?? "(nenhum)"}`,
    `- Observações do usuário: ${input.notes ?? "(nenhuma)"}`,
  ];
  if (input.duplicateHit) {
    lines.push(
      "",
      `Possível duplicata detectada por similaridade semântica (${(input.duplicateHit.similarity * 100).toFixed(1)}%):`,
      `- ${input.duplicateHit.race_name}${input.duplicateHit.race_date ? " (" + input.duplicateHit.race_date + ")" : ""}`,
      `Se esta correspondência for plausível, retorne verdict="duplicate".`,
    );
  }
  if (input.extractedSummary) {
    lines.push("", `Pré-extração do link:`, input.extractedSummary);
  }
  return lines.join("\n");
}

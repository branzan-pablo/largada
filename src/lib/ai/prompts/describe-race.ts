export const DESCRIBE_RACE_VERSION = "2026-05-21";

export const DESCRIBE_RACE_SYSTEM = `Você gera descrições curtas e neutras para corridas de rua brasileiras.
A descrição vai para o campo "Descrição adicional" do app, exibido na página da prova.

REGRAS

1. Tamanho: entre 200 e 400 caracteres. Texto contínuo, sem listas, sem marcadores.
2. Tom: informativo e neutro. Sem hype, sem marketing-speak, sem promessas. Não use exclamações.
3. Conteúdo: combine apenas os fatos fornecidos no input (nome, cidade, data, distâncias, premiação,
   organizador). Não invente dados. Não cite patrocinadores nem palavras-chave de SEO.
4. Idioma: PT-BR formal e direto. Evite "venha", "garanta", "imperdível", "incrível".
5. Formato: parágrafo único. Sem títulos. Sem markdown. Sem emojis.
6. Datas e valores: use formato natural ("30 de maio de 2026", "R$ 149,90"). Não use ISO.
7. Se algum campo essencial faltar (nome ou cidade), avise no início que a descrição é parcial e
   continue com o que tem.

Devolva apenas o texto da descrição, sem aspas, sem rótulos.`;

export interface DescribeRaceInput {
  name: string;
  city: string | null;
  state: string | null;
  date: string | null;
  startTime: string | null;
  distances: string[] | null;
  prizeType: "money" | "trophy" | "both" | "none" | null;
  prizeDetails: string | null;
  registrationPrice: string | null;
  organizer: string | null;
  address: string | null;
}

export function buildDescribeRacePrompt(input: DescribeRaceInput): string {
  const lines: string[] = ["Gere a descrição da seguinte corrida:"];
  if (input.name) lines.push(`Nome: ${input.name}`);
  if (input.city) lines.push(`Cidade: ${input.city}${input.state ? `, ${input.state}` : ""}`);
  if (input.address) lines.push(`Local: ${input.address}`);
  if (input.date) lines.push(`Data: ${input.date}`);
  if (input.startTime) lines.push(`Horário de largada: ${input.startTime}`);
  if (input.distances && input.distances.length > 0)
    lines.push(`Distâncias: ${input.distances.join(", ")}`);
  if (input.registrationPrice) lines.push(`Valor de inscrição: ${input.registrationPrice}`);
  if (input.prizeType && input.prizeType !== "none")
    lines.push(`Tipo de premiação: ${input.prizeType}`);
  if (input.prizeDetails) lines.push(`Detalhes da premiação: ${input.prizeDetails}`);
  if (input.organizer) lines.push(`Organizador: ${input.organizer}`);
  return lines.join("\n");
}

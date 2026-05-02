import { ChevronDown } from "lucide-react";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "O Largada é grátis para atleta?",
    a: "Sim, 100% grátis. Cobramos apenas quando o organizador quer destacar a corrida na listagem.",
  },
  {
    q: "Como vocês descobrem as corridas?",
    a: "Monitoramos automaticamente os principais sites de eventos do Noroeste Paulista (Equilíbrio, Rax, TNV, TV Com Running e outros) e acrescentamos sugestões enviadas pela própria comunidade de corredores.",
  },
  {
    q: "Atende qual região hoje?",
    a: "Noroeste Paulista — São José do Rio Preto, Araçatuba, Catanduva, Votuporanga, Birigui e cidades vizinhas, em raio de até 200km.",
  },
  {
    q: "Vocês fazem a inscrição na corrida?",
    a: "Não. Levamos você direto ao site oficial do organizador para você se inscrever lá. O Largada é o calendário e a alavanca de descoberta — a inscrição você faz no organizador.",
  },
  {
    q: 'Como funciona o "Vou Nessa"?',
    a: 'Você marca presença no card da corrida. A turma vê quem confirmou e cada um decide se inscreve. É um sinal social — não é a inscrição.',
  },
  {
    q: "Tenho que instalar app?",
    a: "Funciona no navegador. Se quiser, instala como PWA — abre da tela inicial, sem precisar de App Store ou Google Play.",
  },
  {
    q: "Os alertas chegam por email?",
    a: "Por push notification (web/PWA). Sem spam — só quando o prazo de inscrição está fechando ou aparece corrida nova na sua região.",
  },
  {
    q: "Sou organizador. Como destaco minha corrida?",
    a: "Tem uma página dedicada para organizadores com pacotes a partir de R$49. Acesse Para Organizadores no menu.",
  },
];

export function LandingFaq() {
  return (
    <section className="relative bg-white py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#6B7280]">
            Perguntas frequentes
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0D1B2A] md:text-4xl">
            Dúvidas? A gente responde.
          </h2>
        </div>

        <div className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
                <span className="text-sm font-semibold text-[#0D1B2A] md:text-base">
                  {item.q}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#6B7280] transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

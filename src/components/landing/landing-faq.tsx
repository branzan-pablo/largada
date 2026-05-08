import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
  cta?: { label: string; href: string };
}

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "O Largada é grátis para atleta?",
    a: "Sim, 100% grátis. Cobramos apenas quando o organizador quer destacar a corrida na listagem.",
  },
  {
    q: "Vocês fazem a inscrição na corrida?",
    a: "Não. Levamos você direto ao site oficial do organizador para você se inscrever lá. O Largada é o calendário e a alavanca de descoberta. A inscrição você faz no organizador.",
  },
  {
    q: 'Como funciona o "Vou Nessa"?',
    a: 'Você marca presença no card da corrida. A turma vê quem confirmou e cada um decide se inscreve. É um sinal social, não é a inscrição.',
  },
  {
    q: "Tenho que instalar app?",
    a: "Funciona no navegador. Se quiser, instala como PWA: abre da tela inicial, sem precisar de App Store ou Google Play.",
  },
  {
    q: "Os alertas chegam por e-mail?",
    a: "Não. Chegam por push notification (web/PWA). Sem spam: só quando o prazo de inscrição está fechando ou aparece corrida nova na sua região.",
  },
  {
    q: "Sou organizador. Como destaco minha corrida?",
    a: "Temos uma página dedicada com pacotes a partir de R$49. Pagamento único, sem assinatura recorrente.",
    cta: { label: "Ver pacotes para organizadores", href: "/para-organizadores" },
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

        <div className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              className="group [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-gray-50 active:bg-gray-100 group-open:bg-gray-50/50 sm:px-6">
                <span className="text-sm font-semibold text-[#0D1B2A] md:text-base">
                  {item.q}
                </span>
                <ChevronDown className="h-5 w-5 shrink-0 text-[#FF4D00] transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5 sm:px-6">
                <p className="text-sm leading-relaxed text-[#6B7280]">
                  {item.a}
                </p>
                {item.cta && (
                  <Link
                    href={item.cta.href}
                    className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#FF4D00] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#E04400] active:scale-[0.98]"
                  >
                    {item.cta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

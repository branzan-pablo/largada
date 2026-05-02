import type { Metadata } from "next";
import Link from "next/link";
import { Check, Star, ArrowLeft, Megaphone, Trophy, Users } from "lucide-react";
import { LandingHeader } from "@/components/landing/landing-header";
import { Footer } from "@/components/footer/footer";

export const metadata: Metadata = {
  title: "Para Organizadores — Largada",
  description:
    "Coloque sua corrida no topo do calendário do Noroeste Paulista. Pacotes a partir de R$49.",
  alternates: {
    canonical: "/para-organizadores",
  },
};

const TIERS = [
  {
    name: "Express",
    slug: "express",
    price: "R$ 49",
    period: "pagamento único",
    credits: "1 corrida em destaque por 7 dias",
    discount: null,
    popular: false,
    benefits: [
      "Topo do calendário por 7 dias",
      "Badge ⭐ Destaque na listagem",
      "Ideal para testar a plataforma",
    ],
  },
  {
    name: "Total",
    slug: "standard",
    price: "R$ 149",
    period: "pagamento único",
    credits: "1 corrida em destaque por 30 dias",
    discount: null,
    popular: true,
    benefits: [
      "Topo do calendário por 30 dias",
      "Badge ⭐ Destaque na listagem",
      "Cobertura completa até a data da prova",
    ],
  },
  {
    name: "Organizador",
    slug: "organizador",
    price: "R$ 349",
    period: "pagamento único",
    credits: "3 corridas em destaque",
    discount: "~22% off",
    popular: false,
    benefits: [
      "3 destaques de 30 dias",
      "Créditos válidos por 60 dias",
      "Para quem organiza várias provas/temporada",
    ],
  },
  {
    name: "Pro",
    slug: "organizador_pro",
    price: "R$ 699",
    period: "pagamento único",
    credits: "8 corridas em destaque",
    discount: "~41% off",
    popular: false,
    benefits: [
      "8 destaques de 30 dias",
      "Créditos válidos por 90 dias",
      "Melhor custo por destaque",
    ],
  },
] as const;

export default function ParaOrganizadoresPage() {
  return (
    <main className="text-[#6B7280] antialiased min-h-screen bg-white pt-16">
      <LandingHeader />

      {/* Hero */}
      <section className="bg-[#0D1B2A] text-white">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a home
          </Link>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF4D00]">
            Para organizadores de corrida
          </p>
          <h1 className="mb-5 text-4xl font-extrabold tracking-tight md:text-5xl">
            Coloque sua corrida no topo do calendário
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/70 leading-relaxed">
            Apareça primeiro para os corredores que estão decidindo a próxima
            prova. Pague só pela visibilidade — sem assinatura recorrente.
          </p>
        </div>
      </section>

      {/* Benefits strip */}
      <section className="bg-[#F7F8FA] py-10 border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <BenefitCard
            icon={Star}
            title="Topo da listagem"
            text="Sua corrida aparece primeiro, com badge ⭐ Destaque."
          />
          <BenefitCard
            icon={Megaphone}
            title="Push para a região"
            text="Notificação automática para corredores na sua área quando a corrida é cadastrada."
          />
          <BenefitCard
            icon={Users}
            title="Audiência local engajada"
            text="Atletas do Noroeste Paulista que confirmam presença antes de se inscrever."
          />
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mb-10 text-center md:mb-12">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#6B7280]">
              Planos
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#0D1B2A] sm:text-3xl md:text-4xl">
              Escolha como destacar
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-[#6B7280] md:text-base">
              Quer testar primeiro? Comece pelo Express. Quer cobertura
              completa? Vai de Total. Tem várias provas? Pacotes têm desconto.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
            {TIERS.map((tier) => {
              const isCheckout =
                tier.slug === "express" || tier.slug === "standard";
              const ctaLabel = isCheckout
                ? "Destacar minha corrida"
                : "Comprar pacote";
              const ctaHref = isCheckout
                ? "/corridas"
                : `/perfil/assinatura?tier=${tier.slug}`;

              return (
                <div
                  key={tier.slug}
                  className={`relative flex flex-col rounded-2xl border p-6 transition-shadow ${
                    tier.popular
                      ? "order-first border-[#FF4D00] bg-gradient-to-b from-[#FF4D00]/5 to-white shadow-xl ring-1 ring-[#FF4D00]/20 md:order-none md:scale-[1.02]"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FF4D00] px-3 py-1 text-xs font-semibold text-white shadow-md">
                        <Star className="h-3 w-3 fill-current" />
                        Mais escolhido
                      </span>
                    </div>
                  )}

                  <div className="mb-4 flex items-baseline justify-between gap-2">
                    <h3
                      className={`text-base font-semibold ${
                        tier.popular ? "text-[#FF4D00]" : "text-[#6B7280]"
                      }`}
                    >
                      {tier.name}
                    </h3>
                    {tier.discount && (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                        {tier.discount}
                      </span>
                    )}
                  </div>

                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-[#0D1B2A]">
                      {tier.price}
                    </span>
                  </div>
                  <p className="mb-5 text-xs text-[#6B7280]">{tier.period}</p>

                  <p className="mb-5 text-sm font-semibold text-[#0D1B2A]">
                    {tier.credits}
                  </p>

                  <ul className="mb-6 flex-1 space-y-3">
                    {tier.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="flex items-start gap-2 text-sm text-[#6B7280]"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4D00]" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={ctaHref}
                    className={`flex min-h-12 w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                      tier.popular
                        ? "bg-[#FF4D00] text-white hover:bg-[#E04400]"
                        : "border border-[#0D1B2A] bg-white text-[#0D1B2A] hover:bg-[#0D1B2A] hover:text-white"
                    }`}
                  >
                    {ctaLabel}
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="mt-10 text-center text-xs text-[#6B7280]">
            Pagamento único via PIX ou cartão. Sem assinatura recorrente.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#F7F8FA] py-20 border-t border-gray-200">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-12 text-center text-3xl font-extrabold tracking-tight text-[#0D1B2A] md:text-4xl">
            Como funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Step
              number="1"
              title="Cadastre sua corrida"
              text="Crie a conta e cadastre os dados da prova (data, local, distâncias, link de inscrição)."
            />
            <Step
              number="2"
              title="Compre o destaque"
              text="Escolha Express, Total ou um pacote. Pagamento único via PIX ou cartão."
            />
            <Step
              number="3"
              title="Acompanhe analytics"
              text="Veja em tempo real quantos atletas viram, clicaram em inscrever e confirmaram presença."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Trophy className="mx-auto mb-4 h-10 w-10 text-[#FF4D00]" />
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-[#0D1B2A] md:text-4xl">
            Pronto para encher sua prova?
          </h2>
          <p className="mb-8 text-base text-[#6B7280]">
            Crie sua conta gratuitamente e cadastre sua corrida em menos de 5
            minutos. Você só paga quando decidir destacar.
          </p>
          <Link
            href="/corridas"
            className="inline-flex items-center justify-center rounded-full bg-[#FF4D00] px-8 py-4 text-base font-semibold text-white hover:bg-[#E04400] transition-colors"
          >
            Começar agora
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF4D00]/10">
        <Icon className="h-5 w-5 text-[#FF4D00]" />
      </div>
      <p className="mb-1 text-sm font-semibold text-[#0D1B2A]">{title}</p>
      <p className="text-sm text-[#6B7280] leading-relaxed">{text}</p>
    </div>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF4D00] text-white text-lg font-extrabold">
        {number}
      </div>
      <p className="mb-2 text-base font-semibold text-[#0D1B2A]">{title}</p>
      <p className="text-sm leading-relaxed text-[#6B7280]">{text}</p>
    </div>
  );
}

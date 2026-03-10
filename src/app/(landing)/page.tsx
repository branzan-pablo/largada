/* eslint-disable react-hooks/purity */
import type { Metadata } from "next";
import Image from "next/image";
import { LandingHeader } from "@/components/landing/landing-header";
import { CtaButtons } from "@/components/landing/cta-buttons";
import { REGION_CITIES } from "@/lib/constants";
import {
  Filter,
  Users,
  Bell,
  CalendarDays,
  Trophy,
  Search,
  Award,
  UserPlus,
  Check,
  Star,
} from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/footer/footer";

export const metadata: Metadata = {
  title: "Largada — Calendário de Corridas de Rua",
  description:
    "Encontre corridas de rua perto de você. Filtre por distância, premiação e data. Receba alertas antes dos prazos fecharem.",
  alternates: {
    canonical: "/",
  },
};

export default async function LandingPage() {
  const cities = [...REGION_CITIES]
    .sort(() => Math.random() - 0.5)
    .map((c) => `${c.name} - ${c.state}`);
  return (
    <main className="text-[#6B7280] antialiased overflow-x-hidden min-h-screen scroll-smooth bg-white pt-16">
      <LandingHeader />

      {/* ==================== Hero Section ==================== */}
      <section className="relative min-h-[620px] md:min-h-[700px] flex items-center overflow-hidden">
        {/* Background photo — Ken Burns zoom */}
        <Image
          src="/background-hero.jpg"
          alt="Corredores em prova de rua"
          fill
          className="object-cover object-center hero-bg"
          priority
          fetchPriority="high"
        />
        {/* Overlay: base escuro + gradiente vertical */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center text-center py-24 md:py-32">
          {/* Headline */}
          <h1
            className="font-[family-name:var(--font-logo)] text-4xl sm:text-5xl md:text-7xl tracking-wide text-white mb-6 leading-tight"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.85)" }}
          >
            Vai ter corrida.
            <br />
            <span className="text-[#FF4D00]">Você vai ficar sabendo.</span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-lg md:text-xl text-white max-w-2xl mb-10 font-normal leading-relaxed"
            style={{ textShadow: "0 1px 12px rgba(0,0,0,0.9)" }}
          >
            Descubra provas perto de você, filtre por distância ou cidade e seja avisado antes das inscrições encerrarem.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <CtaButtons />
          </div>
        </div>
      </section>

      <div className="h-px bg-gray-200" />

      {/* ==================== Problem → Solution Section ==================== */}
      <section className="relative bg-[#F7F8FA] py-12 md:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0D1B2A] tracking-tight mb-3">
              Por que o Largada existe
            </h2>
            <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
              Corridas espalhadas, inscrições encerradas, turma sem avisar. Soa familiar?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "Corrida boa é aquela que você fica sabendo a tempo.",
                problem: "Eventos divulgados em grupos de WhatsApp, perfis de Instagram e sites de organizadores. Você precisa acompanhar tudo e ainda assim perde prova.",
              },
              {
                icon: Bell,
                title: "Abriu inscrição. Você ficou sabendo 1 semana depois.",
                problem: "Quando a corrida aparece no feed, o primeiro lote já fechou e o valor subiu. O Largada te avisa antes disso acontecer.",
              },
              {
                icon: Users,
                title: "Correr com a turma é diferente de correr sozinho.",
                problem: "Antes de se inscrever, você quer saber se alguém do grupo vai. O Largada mostra quem confirmou participação sem precisar perguntar em cada grupo.",
              },
            ].map(({ icon: Icon, title, problem }) => (
              <div key={title} className="border border-gray-200 rounded-lg bg-white p-6 hover:border-[#FF4D00]/30 transition-colors flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#FF4D00]" />
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A2E] mb-2">{title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gray-200" />

      {/* ==================== Features ==================== */}
      <section id="features" className="relative bg-white bg-grid py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-center text-xs font-semibold text-[#6B7280] uppercase tracking-[0.2em] mb-5">
              Funcionalidades
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0D1B2A] tracking-tight mb-4">
              Tudo que você precisa para planejar sua temporada
            </h2>
            <p className="text-lg text-[#6B7280] max-w-xl mx-auto">
              Detalhes que fazem a diferença na hora de planejar sua temporada.
            </p>
          </div>

          {/* Bento grid — row 1: large + 2 small | row 2: 2 small + large */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* 01 — large */}
            <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm p-8 flex flex-col hover:border-[#FF4D00]/30 transition-colors relative overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center">
                  <Filter className="w-6 h-6 text-[#FF4D00]" />
                </div>
                <span className="text-xs font-mono font-black text-gray-400">01</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A2E] mb-3">Filtros na medida certa</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Filtre por raio de km a partir da sua cidade, distância da prova, tipo de premiação e data. Encontre o que procura sem ver o que não importa.
              </p>
            </div>

            {/* 02 — small */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col hover:border-[#FF4D00]/30 transition-colors">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#FF4D00]" />
                </div>
                <span className="text-xs font-mono font-black text-gray-400">02</span>
              </div>
              <h3 className="text-base font-semibold text-[#1A1A2E] mb-2">Só corridas que valem</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">Quer dinheiro, troféu ou os dois? Um toque filtra só as provas que fazem sentido pra você.</p>
            </div>

            {/* 03 — small */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col hover:border-[#FF4D00]/30 transition-colors">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center">
                  <Search className="w-5 h-5 text-[#FF4D00]" />
                </div>
                <span className="text-xs font-mono font-black text-gray-400">03</span>
              </div>
              <h3 className="text-base font-semibold text-[#1A1A2E] mb-2">Busca direta</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">Pesquise pelo nome da corrida, cidade ou organizador. Resultado na hora.</p>
            </div>

            {/* 04 — small */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col hover:border-[#FF4D00]/30 transition-colors">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-[#FF4D00]" />
                </div>
                <span className="text-xs font-mono font-black text-gray-400">04</span>
              </div>
              <h3 className="text-base font-semibold text-[#1A1A2E] mb-2">Informação completa</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">Categorias, local de largada, percurso, valores por lote e prazo de inscrição tudo na mesma tela.</p>
            </div>

            {/* 05 — small */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col hover:border-[#FF4D00]/30 transition-colors">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#FF4D00]" />
                </div>
                <span className="text-xs font-mono font-black text-gray-400">05</span>
              </div>
              <h3 className="text-base font-semibold text-[#1A1A2E] mb-2">Aviso antes do prazo fechar</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">Receba notificação quando surgir uma corrida nova na sua região e lembrete 3 dias antes do prazo de inscrição encerrar.</p>
            </div>

            {/* 06 — large */}
            <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm p-8 flex flex-col hover:border-[#FF4D00]/30 transition-colors relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-bl from-[#FF4D00]/5 to-transparent pointer-events-none" />
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-[#FF4D00]" />
                </div>
                <span className="text-xs font-mono font-black text-gray-400">06</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A2E] mb-3">Instala como app, sem a loja</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Adicione direto do navegador, sem App Store nem Google Play. Abre na tela inicial e funciona igual a um app nativo.
              </p>
            </div>

          </div>
        </div>
      </section>

      <div className="h-px bg-gray-200" />

      {/* ==================== How It Works ==================== */}
      <section className="relative bg-[#F7F8FA] py-12 md:py-20 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0D1B2A] tracking-tight mb-3">
              Três minutos. Uma conta. Nenhuma corrida perdida.
            </h2>
            <p className="text-lg text-[#6B7280]">
              Sem tutorial, sem configuração complicada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { step: "1", icon: UserPlus, title: "Crie sua conta", desc: "Cadastro com email, Google ou Strava. Selecione sua cidade e o quanto você topa viajar para uma prova." },
              { step: "2", icon: Search, title: "Encontre sua próxima prova", desc: "Use os filtros para achar provas na distância certa, com o nível de premiação que você quer sem rolar por dezenas de eventos irrelevantes." },
              { step: "3", icon: Bell, title: "Marque e deixa com a gente", desc: "Clique em 'Vou Nessa', veja quem da sua rede também vai correr e deixa o Largada te avisar quando o prazo de inscrição estiver chegando." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-[#FF4D00]" />
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A2E] mb-2">{title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gray-200" />

      {/* ==================== Cobertura Regional ==================== */}
      <section id="cobertura" className="relative bg-white bg-grid py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-xs font-semibold text-[#6B7280] uppercase tracking-[0.2em] mb-10">
            Corridas do Noroeste Paulista
          </h2>

          <div className="ticker-mask">
            <div className="ticker-track">
              {[...cities, ...cities].map((city, i) => (
                <span
                  key={i}
                  className="ticker-item text-lg md:text-xl font-medium text-[#1A1A2E]"
                >
                  {city}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gray-200" />

      {/* ==================== Para Organizadores ==================== */}
      <section className="relative bg-[#F7F8FA] py-16 md:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-[0.2em] mb-5">
              Para Organizadores
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0D1B2A] tracking-tight mb-3">
              Destaque suas corridas e alcance mais atletas
            </h2>
            <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
              Coloque seus eventos no topo do calendário e seja visto por quem está procurando a próxima prova.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Avulso",
                slug: "avulso",
                price: "R$ 149",
                period: "pagamento único",
                credits: "1 corrida em destaque",
                discount: null,
                popular: false,
                benefits: [
                  "Corrida no topo do calendário",
                  "Badge de destaque na listagem",
                  "Mais visibilidade para inscrições",
                ],
              },
              {
                name: "Organizador",
                slug: "organizador",
                price: "R$ 349",
                period: "30 dias",
                credits: "3 corridas em destaque",
                discount: "~22% de desconto",
                popular: false,
                benefits: [
                  "Tudo do plano Avulso",
                  "3 créditos para destacar corridas",
                  "Use quando quiser dentro de 30 dias",
                ],
              },
              {
                name: "Organizador Pro",
                slug: "organizador_pro",
                price: "R$ 699",
                period: "30 dias",
                credits: "8 corridas em destaque",
                discount: "~41% de desconto",
                popular: true,
                benefits: [
                  "Tudo do plano Organizador",
                  "8 créditos para destacar corridas",
                  "Melhor custo por corrida destacada",
                ],
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border bg-white p-6 md:p-8 flex flex-col ${tier.popular
                    ? "border-[#FF4D00] shadow-lg ring-1 ring-[#FF4D00]/20"
                    : "border-gray-200"
                  }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-[#FF4D00] text-white text-xs font-semibold px-3 py-1 rounded-full">
                      <Star className="w-3 h-3 fill-current" />
                      Mais popular
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-semibold text-[#0D1B2A] mb-1">{tier.name}</h3>
                <p className="text-sm text-[#6B7280] mb-4">{tier.credits}</p>

                <div className="mb-6">
                  <span className="text-3xl font-extrabold text-[#0D1B2A]">{tier.price}</span>
                  <span className="text-sm text-[#6B7280] ml-1">/ {tier.period}</span>
                </div>

                {tier.discount && (
                  <p className="text-xs font-medium text-green-600 bg-green-50 rounded-full px-3 py-1 w-fit mb-4">
                    {tier.discount}
                  </p>
                )}

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm text-[#6B7280]">
                      <Check className="w-4 h-4 text-[#FF4D00] mt-0.5 shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/perfil/assinatura?tier=${tier.slug}`}
                  className={`block w-full text-center py-3 px-4 rounded-lg font-semibold text-sm transition-colors ${tier.popular
                      ? "bg-[#FF4D00] text-white hover:bg-[#E04400]"
                      : "bg-[#0D1B2A] text-white hover:bg-[#1a2d42]"
                    }`}
                >
                  Começar agora
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-[#6B7280] mt-8">
            Pagamento único via PIX ou cartão. Sem assinatura recorrente.
          </p>
        </div>
      </section>

      <div className="h-px bg-gray-200" />

      {/* ==================== CTA Final ==================== */}
      <section className="relative bg-white py-24 md:py-32 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#0D1B2A] tracking-tight mb-4">
            Pronto para a largada?
          </h2>
          <p className="text-[#6B7280] mb-10 max-w-md mx-auto">
            Crie sua conta em menos de 2 minutos. Gratuito. Sem cartão de crédito. Sem pegadinha.
          </p>
          <CtaButtons />
        </div>
      </section>

      {/* ==================== Footer ==================== */}
      <Footer />
    </main>
  );
}

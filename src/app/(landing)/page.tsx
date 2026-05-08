/* eslint-disable react-hooks/purity */
import type { Metadata } from "next";
import Image from "next/image";
import { LandingHeader } from "@/components/landing/landing-header";
import { CtaButtons } from "@/components/landing/cta-buttons";
import { LandingFaq } from "@/components/landing/landing-faq";
import { StickyMobileCta } from "@/components/landing/sticky-mobile-cta";
import { getLandingStats } from "@/components/landing/landing-stats";
import { REGION_CITIES } from "@/lib/constants";
import {
  Filter,
  Users,
  Bell,
  CalendarDays,
  Trophy,
  Search,
  Award,
  Check,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/footer/footer";

// Revalida stats a cada hora — landing nao precisa de tempo real.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Largada | Calendário de Corridas de Rua",
  description:
    "Encontre corridas de rua perto de você. Filtre por distância, premiação e data. Receba alertas antes dos prazos fecharem.",
  alternates: {
    canonical: "/",
  },
};

export default async function LandingPage() {
  const stats = await getLandingStats();
  const cities = [...REGION_CITIES]
    .sort(() => Math.random() - 0.5)
    .map((c) => `${c.name} - ${c.state}`);

  return (
    <main className="text-[#6B7280] antialiased overflow-x-hidden min-h-screen scroll-smooth bg-white pt-16 pb-20 md:pb-0">
      <LandingHeader />

      {/* ==================== Hero Section ==================== */}
      <section className="relative flex min-h-[520px] items-center overflow-hidden md:min-h-[720px]">
        <Image
          src="/background-hero.jpg"
          alt="Corredores em prova de rua"
          fill
          sizes="100vw"
          className="object-cover object-center hero-bg"
          priority
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/65" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-5 py-12 text-center sm:px-6 md:py-32">
          <h1
            className="font-[family-name:var(--font-logo)] text-[2.25rem] leading-[1.05] tracking-wide text-white mb-4 sm:text-5xl md:mb-6 md:text-7xl md:leading-tight"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.85)" }}
          >
            Vai ter corrida.
            <br />
            <span className="text-[#FF4D00]">Você vai ficar sabendo.</span>
          </h1>

          <p
            className="mx-auto mb-6 max-w-xl text-base font-normal leading-relaxed text-white sm:text-lg md:mb-10 md:text-xl"
            style={{ textShadow: "0 1px 12px rgba(0,0,0,0.9)" }}
          >
            Descubra provas perto de você e seja avisado antes das inscrições
            encerrarem.
          </p>

          <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
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
              Corridas espalhadas, inscrições encerradas, turma sem avisar. Soa
              familiar?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "Corrida boa é aquela que você fica sabendo a tempo.",
                problem:
                  "Eventos divulgados em grupos de WhatsApp, perfis de Instagram e sites de organizadores. Você precisa acompanhar tudo e ainda assim perde prova.",
              },
              {
                icon: Bell,
                title: "Abriu inscrição. Você ficou sabendo 1 semana depois.",
                problem:
                  "Quando a corrida aparece no feed, o primeiro lote já fechou e o valor subiu. O Largada te avisa antes disso acontecer.",
              },
              {
                icon: Users,
                title: "Correr com a turma é diferente de correr sozinho.",
                problem:
                  "Antes de se inscrever, você quer saber se alguém do grupo vai. O Largada mostra quem confirmou participação sem precisar perguntar em cada grupo.",
              },
            ].map(({ icon: Icon, title, problem }) => (
              <div
                key={title}
                className="border border-gray-200 rounded-lg bg-white p-6 hover:border-[#FF4D00]/30 transition-colors flex flex-col"
              >
                <div className="w-10 h-10 rounded-lg bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#FF4D00]" />
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A2E] mb-2">
                  {title}
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  {problem}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gray-200" />

      {/* ==================== Features ==================== */}
      <section
        id="features"
        className="relative bg-white bg-grid py-24 overflow-hidden"
      >
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm p-8 flex flex-col hover:border-[#FF4D00]/30 transition-colors relative overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center">
                  <Filter className="w-6 h-6 text-[#FF4D00]" />
                </div>
                <span className="text-xs font-mono font-black text-gray-400">
                  01
                </span>
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A2E] mb-3">
                Filtros na medida certa
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Filtre por raio de km a partir da sua cidade, distância da
                prova, tipo de premiação e data. Encontre o que procura sem ver
                o que não importa.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col hover:border-[#FF4D00]/30 transition-colors">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#FF4D00]" />
                </div>
                <span className="text-xs font-mono font-black text-gray-400">
                  02
                </span>
              </div>
              <h3 className="text-base font-semibold text-[#1A1A2E] mb-2">
                Só corridas que valem
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Quer dinheiro, troféu ou os dois? Um toque filtra só as provas
                que fazem sentido pra você.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col hover:border-[#FF4D00]/30 transition-colors">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center">
                  <Search className="w-5 h-5 text-[#FF4D00]" />
                </div>
                <span className="text-xs font-mono font-black text-gray-400">
                  03
                </span>
              </div>
              <h3 className="text-base font-semibold text-[#1A1A2E] mb-2">
                Busca direta
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Pesquise pelo nome da corrida, cidade ou organizador. Resultado
                na hora.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col hover:border-[#FF4D00]/30 transition-colors">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-[#FF4D00]" />
                </div>
                <span className="text-xs font-mono font-black text-gray-400">
                  04
                </span>
              </div>
              <h3 className="text-base font-semibold text-[#1A1A2E] mb-2">
                Informação completa
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Categorias, local de largada, percurso, valores por lote e
                prazo de inscrição tudo na mesma tela.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col hover:border-[#FF4D00]/30 transition-colors">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#FF4D00]" />
                </div>
                <span className="text-xs font-mono font-black text-gray-400">
                  05
                </span>
              </div>
              <h3 className="text-base font-semibold text-[#1A1A2E] mb-2">
                Aviso antes do prazo fechar
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Receba notificação quando surgir uma corrida nova na sua região
                e lembrete 3 dias antes do prazo de inscrição encerrar.
              </p>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm p-8 flex flex-col hover:border-[#FF4D00]/30 transition-colors relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-bl from-[#FF4D00]/5 to-transparent pointer-events-none" />
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-[#FF4D00]" />
                </div>
                <span className="text-xs font-mono font-black text-gray-400">
                  06
                </span>
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A2E] mb-3">
                Instala como app, sem a loja
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Adicione direto do navegador, sem App Store nem Google Play.
                Abre na tela inicial e funciona igual a um app nativo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gray-200" />

      {/* ==================== Cobertura Regional ==================== */}
      <section
        id="cobertura"
        className="relative bg-white bg-grid py-16 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-xs font-semibold text-[#6B7280] uppercase tracking-[0.2em] mb-3">
            Corridas do Noroeste Paulista
          </h2>
          <p className="text-center text-sm text-[#6B7280] mb-10">
            Atendemos hoje cidades em raio de 200km a partir de São José do Rio Preto.
          </p>

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

      {/* ==================== FAQ ==================== */}
      <LandingFaq />

      <div className="h-px bg-gray-200" />

      {/* ==================== Para Organizadores (link compacto) ==================== */}
      <section className="bg-[#0D1B2A] py-14">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF4D00]">
            Para organizadores
          </p>
          <h2 className="mb-3 text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Quer destacar sua corrida?
          </h2>
          <p className="mb-6 text-sm md:text-base text-white/70 max-w-2xl mx-auto">
            Pacotes a partir de R$ 49 (Express, 7 dias). Pague só pela
            visibilidade. Sem assinatura recorrente.
          </p>
          <Link
            href="/para-organizadores"
            className="inline-flex items-center gap-2 rounded-full bg-[#FF4D00] px-6 py-3 text-sm font-semibold text-white hover:bg-[#E04400] transition-colors"
          >
            Ver pacotes para organizadores
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ==================== CTA Final ==================== */}
      <section className="relative bg-[#F7F8FA] py-24 md:py-32 overflow-hidden border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="rounded-[2.5rem] bg-white border border-gray-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-linear-to-bl from-[#FF4D00]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-linear-to-tr from-[#0D1B2A]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-block py-1.5 px-4 rounded-full bg-orange-50 text-[#FF4D00] border border-orange-100 text-xs font-bold uppercase tracking-widest mb-6">
                Comece a usar grátis
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#0D1B2A] tracking-tight mb-5">
                Pronto para a largada?
              </h2>
              <p className="text-[#6B7280] font-medium mb-10 max-w-xl mx-auto text-lg leading-relaxed">
                Crie sua conta no Largada agora e centralize todo o seu
                calendário de corridas em um só lugar.
              </p>

              <div className="flex flex-col items-center justify-center">
                <CtaButtons swapActions />
              </div>

              <div className="mt-10 flex items-center justify-center gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-500" /> Gratuito para Atletas
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-500" /> Sem Cadastro de Cartão
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== Footer ==================== */}
      <Footer />

      {/* ==================== Sticky CTA mobile ==================== */}
      <StickyMobileCta
        racesOpenThisWeek={stats.racesOpenThisWeek}
        firstOpenSlug={stats.firstOpenSlug}
      />
    </main>
  );
}

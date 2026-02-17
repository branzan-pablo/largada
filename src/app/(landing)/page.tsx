import Link from "next/link";
import { LandingHeader } from "@/components/landing/landing-header";
import { CtaButtons } from "@/components/landing/cta-buttons";
import {
  Filter,
  Users,
  Bell,
  CalendarDays,
  Trophy,
  Search,
  Instagram,
  Award,
  UserPlus,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="text-zinc-300 antialiased overflow-x-hidden min-h-screen scroll-smooth">
      <LandingHeader />

      {/* ==================== Hero Section ==================== */}
      <section className="relative bg-black bg-grid pt-40 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-zinc-300">
              Disponível em Rio Preto e região
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-[1.1]">
            Encontre seu ritmo.
            <br />
            <span className="text-zinc-400">Descubra sua próxima prova.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mb-10 font-normal leading-relaxed">
            Centralizamos todas as corridas de rua do interior de SP. Filtre por
            distância, premiação e data. Planeje seu calendário em um só lugar.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <CtaButtons />
          </div>
        </div>
      </section>

      <div className="h-px bg-zinc-800" />

      {/* ==================== Problem → Solution Section ==================== */}
      <section className="relative bg-zinc-950 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-3">
              O problema que todo corredor conhece
            </h2>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
              Informação espalhada, descoberta tardia e falta de conexão com outros atletas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "Informação espalhada",
                problem: "Corridas divulgadas em dezenas de grupos de WhatsApp, perfis do Instagram e sites diferentes. Você nunca sabe se está vendo tudo.",
              },
              {
                icon: Bell,
                title: "Descoberta tardia",
                problem: "Quando você fica sabendo de uma corrida, as inscrições já encerraram ou o valor subiu para o último lote.",
              },
              {
                icon: Users,
                title: "Sem saber quem vai",
                problem: "Quer participar com amigos? Não tem como saber quem vai sem perguntar em cada grupo separadamente.",
              },
            ].map(({ icon: Icon, title, problem }) => (
              <div key={title} className="border border-zinc-800 rounded-lg bg-zinc-900/20 p-6 hover:border-zinc-700 transition-colors flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-zinc-800" />

      {/* ==================== Features ==================== */}
      <section id="features" className="relative bg-black bg-grid py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-3">
              Feito para quem corre
            </h2>
            <p className="text-lg text-zinc-500 max-w-xl mx-auto">
              Detalhes que fazem a diferença na hora de planejar sua temporada.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Filter, title: "Filtros Inteligentes", desc: "Raio em km, tipo de premiação, distância e data." },
              { icon: Trophy, title: "Filtro de Premiação", desc: "Encontre corridas com dinheiro, troféu ou ambos." },
              { icon: Search, title: "Busca por Texto", desc: "Pesquise por nome da corrida, cidade ou organizador." },
              { icon: CalendarDays, title: "Info Completa", desc: "Categorias, valores, percurso e local de largada." },
              { icon: Bell, title: "Push Notifications", desc: "Novas corridas e lembretes de prazo no celular." },
              { icon: Award, title: "PWA Instalável", desc: "Instale como app direto do navegador, sem loja." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="border border-zinc-800 rounded-lg bg-black p-6 hover:border-zinc-700 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-zinc-300" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-zinc-800" />

      {/* ==================== How It Works ==================== */}
      <section className="relative bg-zinc-950 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-3">
              Simples assim
            </h2>
            <p className="text-lg text-zinc-500">
              Três passos para nunca mais perder uma corrida.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", icon: UserPlus, title: "Crie sua conta", desc: "Cadastro rápido com email, Google ou Strava. Selecione sua cidade." },
              { step: "2", icon: Search, title: "Encontre corridas", desc: "Use os filtros para encontrar provas na sua região, com a distância e premiação ideais." },
              { step: "3", icon: Bell, title: "Marque e receba alertas", desc: "Clique em 'Vou Nessa', veja quem mais vai e receba lembretes de prazo." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#e53300]/10 border border-[#e53300]/20 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-[#e53300]" />
                </div>
                <div className="text-xs font-bold text-[#e53300] uppercase tracking-wider mb-2">
                  Passo {step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-zinc-800" />

      {/* ==================== Cobertura Regional ==================== */}
      <section id="cobertura" className="relative bg-black bg-grid py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-xs font-semibold text-zinc-500 uppercase tracking-[0.2em] mb-10">
            Cobertura Regional
          </h2>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 md:gap-x-16">
            {[
              "São José do Rio Preto",
              "Votuporanga",
              "Araçatuba",
              "Catanduva",
              "Fernandópolis",
            ].map((city) => (
              <span
                key={city}
                className="text-lg md:text-xl font-medium text-zinc-300 hover:text-white transition-colors cursor-default"
              >
                {city}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-zinc-800" />

      {/* ==================== CTA Final ==================== */}
      <section className="relative bg-zinc-950 py-24 md:py-32 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-medium text-white tracking-tight mb-4">
            Pronto para a largada?
          </h2>
          <p className="text-zinc-500 mb-10 max-w-md mx-auto">
            Crie sua conta gratuitamente, marque suas provas e receba
            notificações personalizadas.
          </p>
          <CtaButtons />
        </div>
      </section>

      {/* ==================== Footer ==================== */}
      <footer className="relative border-t border-zinc-800 bg-black py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center">
                  <span className="text-zinc-400 font-semibold text-xs">L</span>
                </div>
                <span className="text-white font-medium">Largada</span>
              </div>
              <p className="text-sm text-zinc-500 max-w-xs">
                O hub de corridas do interior paulista.
              </p>
            </div>

            {/* Plataforma */}
            <div>
              <p className="text-sm font-semibold text-white mb-4">Plataforma</p>
              <nav className="flex flex-col gap-2.5 text-sm text-zinc-400">
                <Link href="/corridas" className="hover:text-zinc-200 transition-colors">
                  Corridas
                </Link>
                <a href="#features" className="hover:text-zinc-200 transition-colors">
                  Funcionalidades
                </a>
                <Link href="/sugerir" className="hover:text-zinc-200 transition-colors">
                  Sugerir Evento
                </Link>
              </nav>
            </div>

            {/* Legal */}
            <div>
              <p className="text-sm font-semibold text-white mb-4">Legal</p>
              <nav className="flex flex-col gap-2.5 text-sm text-zinc-500">
                <span>Termos de Uso</span>
                <span>Privacidade</span>
                <span>Contato</span>
              </nav>
            </div>

            {/* Social */}
            <div>
              <p className="text-sm font-semibold text-white mb-4">Social</p>
              <div className="flex gap-3">
                <a
                  href="https://instagram.com/largadaoficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg border border-zinc-800 bg-zinc-900/50 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-zinc-500">
              &copy; {new Date().getFullYear()} Largada. Todos os direitos reservados.
            </p>
            <p className="text-xs text-zinc-500">
              Feito para corredores do interior de SP
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

import Link from "next/link";
import { LandingHeader } from "@/components/landing/landing-header";
import { CtaButtons } from "@/components/landing/cta-buttons";
import { createClient } from "@/lib/supabase/server";
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

export default async function LandingPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .rpc("get_random_cities", { p_limit: 60 });

  const cities = (data ?? []).map((c: { name: string; state_code: string }) => `${c.name} - ${c.state_code}`);
  return (
    <main className="text-zinc-300 antialiased overflow-x-hidden min-h-screen scroll-smooth">
      <LandingHeader />

      {/* ==================== Hero Section ==================== */}
      <section className="relative bg-black bg-grid pt-40 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-[1.1]">
            Nunca mais perca uma corrida
            <br />
            <span className="text-zinc-400">por falta de informação.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mb-10 font-normal leading-relaxed">
            Largada reúne corridas de rua de todo o Brasil em um calendário só. Filtre por cidade, distância e premiação. Receba alertas antes que os prazos vençam.
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
              Por que o Largada existe
            </h2>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
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
      <section id="features" className="relative bg-black bg-grid py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-emerald-500 uppercase tracking-[0.2em] mb-4">
              Funcionalidades
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-4">
              Tudo que você precisa para planejar sua temporada
            </h2>
            <p className="text-lg text-zinc-500 max-w-xl mx-auto">
              Detalhes que fazem a diferença na hora de planejar sua temporada.
            </p>
          </div>

          {/* Bento grid — row 1: large + 2 small | row 2: 2 small + large */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* 01 — large */}
            <div className="md:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 flex flex-col hover:border-zinc-700 transition-colors relative overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center">
                  <Filter className="w-6 h-6 text-zinc-300" />
                </div>
                <span className="text-xs font-mono font-bold text-zinc-700">01</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Filtros na medida certa</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Filtre por raio de km a partir da sua cidade, distância da prova, tipo de premiação e data. Encontre o que procura sem ver o que não importa.
              </p>
            </div>

            {/* 02 — small */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 flex flex-col hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-zinc-300" />
                </div>
                <span className="text-xs font-mono font-bold text-zinc-700">02</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Só corridas que valem</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">Quer dinheiro, troféu ou os dois? Um toque filtra só as provas que fazem sentido pra você.</p>
            </div>

            {/* 03 — small */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 flex flex-col hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center">
                  <Search className="w-5 h-5 text-zinc-300" />
                </div>
                <span className="text-xs font-mono font-bold text-zinc-700">03</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Busca direta</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">Pesquise pelo nome da corrida, cidade ou organizador. Resultado na hora.</p>
            </div>

            {/* 04 — small */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 flex flex-col hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-zinc-300" />
                </div>
                <span className="text-xs font-mono font-bold text-zinc-700">04</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Informação completa</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">Categorias, local de largada, percurso, valores por lote e prazo de inscrição tudo na mesma tela.</p>
            </div>

            {/* 05 — small */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 flex flex-col hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-zinc-300" />
                </div>
                <span className="text-xs font-mono font-bold text-zinc-700">05</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Aviso antes do prazo fechar</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">Receba notificação quando surgir uma corrida nova na sua região e lembrete 3 dias antes do prazo de inscrição encerrar.</p>
            </div>

            {/* 06 — large */}
            <div className="md:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 flex flex-col hover:border-zinc-700 transition-colors relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-bl from-zinc-700/10 to-transparent pointer-events-none" />
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <Award className="w-6 h-6 text-zinc-300" />
                </div>
                <span className="text-xs font-mono font-bold text-zinc-700">06</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Instala como app, sem a loja</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Adicione direto do navegador, sem App Store nem Google Play. Abre na tela inicial e funciona igual a um app nativo.
              </p>
            </div>

          </div>
        </div>
      </section>

      <div className="h-px bg-zinc-800" />

      {/* ==================== How It Works ==================== */}
      <section className="relative bg-zinc-950 py-20 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-3">
              Três minutos. Uma conta. Nenhuma corrida perdida.
            </h2>
            <p className="text-lg text-zinc-500">
              Sem tutorial, sem configuração complicada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", icon: UserPlus, title: "Crie sua conta", desc: "Cadastro com email, Google ou Strava. Selecione sua cidade e o quanto você topa viajar para uma prova." },
              { step: "2", icon: Search, title: "Encontre sua próxima prova", desc: "Use os filtros para achar provas na distância certa, com o nível de premiação que você quer sem rolar por dezenas de eventos irrelevantes." },
              { step: "3", icon: Bell, title: "Marque e deixa com a gente", desc: "Clique em 'Vou Nessa', veja quem da sua rede também vai correr e deixa o Largada te avisar quando o prazo de inscrição estiver chegando." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#fc5200]/10 border border-[#fc5200]/20 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-[#fc5200]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-zinc-800" />

      {/* ==================== Cobertura Nacional ==================== */}
      <section id="cobertura" className="relative bg-black bg-grid py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-xs font-semibold text-zinc-500 uppercase tracking-[0.2em] mb-10">
            Corridas de todo o Brasil
          </h2>

          <div className="ticker-mask">
            <div className="ticker-track">
              {[...cities, ...cities].map((city, i) => (
                <span
                  key={i}
                  className="ticker-item text-lg md:text-xl font-medium text-zinc-300"
                >
                  {city}
                </span>
              ))}
            </div>
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
            Crie sua conta em menos de 2 minutos. Gratuito. Sem cartão de crédito. Sem pegadinha.
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
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                  <span className="text-black font-semibold text-xs">L</span>
                </div>
                <span className="text-white font-medium">Largada</span>
              </div>
              <p className="text-sm text-zinc-500 max-w-xs">
                O calendário de corridas de rua do Brasil.
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
              Nasceu no interior de SP. Chegou ao Brasil.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

import Link from "next/link";
import { LandingHeader } from "@/components/landing/landing-header";
import { CtaButtons } from "@/components/landing/cta-buttons";
import {
  Filter,
  Users,
  Bell,
  CalendarDays,
  MapPin,
  Trophy,
  Search,
  CheckCircle,
  Instagram,
  Award,
  AlertCircle,
  Clock,
  UserPlus,
  Zap,
  ArrowRight,
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

      {/* ==================== Problem Section ==================== */}
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
            <div className="border border-zinc-800 rounded-lg bg-zinc-900/20 p-6 hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-red-900/20 border border-red-900/30 flex items-center justify-center mb-4">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Informação espalhada
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Corridas divulgadas em dezenas de grupos de WhatsApp, perfis do Instagram e
                sites diferentes. Você nunca sabe se está vendo tudo.
              </p>
            </div>

            <div className="border border-zinc-800 rounded-lg bg-zinc-900/20 p-6 hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-yellow-900/20 border border-yellow-900/30 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Descoberta tardia
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Quando você fica sabendo de uma corrida, as inscrições já encerraram
                ou o valor subiu para o último lote.
              </p>
            </div>

            <div className="border border-zinc-800 rounded-lg bg-zinc-900/20 p-6 hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-900/20 border border-blue-900/30 flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Sem saber quem vai
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Quer participar com amigos? Não tem como saber quem vai sem perguntar
                em cada grupo separadamente.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-zinc-800" />

      {/* ==================== Solution Section ==================== */}
      <section className="relative bg-black bg-grid py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-3">
              Uma solução para cada problema
            </h2>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
              O Largada resolve os três maiores desafios dos corredores do interior paulista.
            </p>
          </div>

          <div className="space-y-12">
            {/* Solution 1 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E85D2A]/10 border border-[#E85D2A]/20 mb-4">
                  <Filter className="w-3.5 h-3.5 text-[#E85D2A]" />
                  <span className="text-xs font-medium text-[#E85D2A]">Calendário centralizado</span>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">
                  Todas as corridas em um só lugar
                </h3>
                <p className="text-zinc-500 leading-relaxed">
                  Chega de vasculhar grupos e perfis. Filtre por cidade, distância, raio em km,
                  tipo de premiação e data. Encontre a prova ideal em segundos.
                </p>
              </div>
              <div className="flex-1 w-full border border-zinc-800 rounded-lg bg-zinc-900/20 p-5">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-md text-xs font-medium text-white">
                    <MapPin className="w-3 h-3 text-zinc-400" /> Rio Preto + 50km
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-md text-xs font-medium text-white">
                    <Trophy className="w-3 h-3 text-zinc-400" /> Premiação em $
                  </span>
                </div>
                <div className="space-y-2">
                  {["Corrida da Virada — Rio Preto", "Meia de Votuporanga", "Night Run Araçatuba"].map((name) => (
                    <div key={name} className="flex items-center justify-between p-2.5 rounded-md bg-black/30 border border-zinc-800/50">
                      <span className="text-sm text-zinc-300">{name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Solution 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E85D2A]/10 border border-[#E85D2A]/20 mb-4">
                  <Bell className="w-3.5 h-3.5 text-[#E85D2A]" />
                  <span className="text-xs font-medium text-[#E85D2A]">Notificações push</span>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">
                  Nunca mais perca um prazo
                </h3>
                <p className="text-zinc-500 leading-relaxed">
                  Receba alertas de novas corridas na sua região e lembretes 3 dias antes do
                  encerramento das inscrições das provas que você marcou.
                </p>
              </div>
              <div className="flex-1 w-full border border-zinc-800 rounded-lg bg-zinc-900/20 p-5">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-md bg-black/30 border border-zinc-800/50">
                    <div className="w-8 h-8 rounded-md bg-[#E85D2A]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="w-4 h-4 text-[#E85D2A]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Nova corrida na sua região!</p>
                      <p className="text-xs text-zinc-500">Night Run Araçatuba — 3km e 5km</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-md bg-black/30 border border-zinc-800/50">
                    <div className="w-8 h-8 rounded-md bg-yellow-900/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Inscrição encerrando!</p>
                      <p className="text-xs text-zinc-500">Corrida da Virada — faltam 3 dias</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Solution 3 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E85D2A]/10 border border-[#E85D2A]/20 mb-4">
                  <Users className="w-3.5 h-3.5 text-[#E85D2A]" />
                  <span className="text-xs font-medium text-[#E85D2A]">Vou Nessa</span>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">
                  Saiba quem vai correr com você
                </h3>
                <p className="text-zinc-500 leading-relaxed">
                  Marque &ldquo;Vou Nessa&rdquo; e veja quais atletas da região já confirmaram presença.
                  Organize caronas e motive seu grupo de treino.
                </p>
              </div>
              <div className="flex-1 w-full border border-zinc-800 rounded-lg bg-zinc-900/20 p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-white">14 confirmados</span>
                  <span className="flex items-center gap-1.5 text-xs bg-emerald-900/20 text-emerald-400 border border-emerald-900/50 px-3 py-1.5 rounded-md font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Eu vou
                  </span>
                </div>
                <div className="flex -space-x-2">
                  {["R", "M", "A", "C", "L"].map((initial, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-zinc-700 border-2 border-black flex items-center justify-center text-[10px] text-white font-medium">
                      {initial}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-[10px] text-zinc-400 font-medium">
                    +9
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-zinc-800" />

      {/* ==================== Features ==================== */}
      <section id="features" className="relative bg-zinc-950 py-20 overflow-hidden">
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
              <div key={title} className="border border-zinc-800 rounded-lg bg-zinc-900/20 p-6 hover:border-zinc-700 transition-colors">
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
      <section className="relative bg-black bg-grid py-20 overflow-hidden">
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
                <div className="mx-auto w-12 h-12 rounded-full bg-[#E85D2A]/10 border border-[#E85D2A]/20 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-[#E85D2A]" />
                </div>
                <div className="text-xs font-bold text-[#E85D2A] uppercase tracking-wider mb-2">
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

      <div className="h-px bg-zinc-800" />

      {/* ==================== Cobertura Regional ==================== */}
      <section id="cobertura" className="relative bg-zinc-950 py-16">
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
      <section className="relative bg-black bg-grid py-24 md:py-32 overflow-hidden">
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

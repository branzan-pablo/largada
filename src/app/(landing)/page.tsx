import Link from "next/link";
import { LandingHeader } from "@/components/landing/landing-header";
import { FloatingNotificationBar } from "@/components/landing/floating-notification-bar";
import { CtaButtons } from "@/components/landing/cta-buttons";
import {
  Filter,
  Users,
  Bell,
  CalendarDays,
  MapPin,
  Ruler,
  Coins,
  Trophy,
  Moon,
  Search,
  CheckCircle,
  PersonStanding,
  PlusCircle,
  Instagram,
  Award,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="text-zinc-300 antialiased overflow-x-hidden min-h-screen">
      <LandingHeader />

      {/* ==================== Hero Section ==================== */}
      <section className="relative bg-[#0a0a0a] pt-40 pb-20 overflow-hidden">
        {/* Background Grid & Glow Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 landing-bg-grid h-[800px]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-zinc-800/20 blur-[120px] rounded-full opacity-50 mix-blend-screen" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
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
          <h1 className="text-5xl md:text-7xl font-medium text-white tracking-tight mb-6 leading-[1.1]">
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
            <Link
              href="/corridas"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors"
            >
              <PersonStanding className="w-5 h-5" />
              Explorar Corridas
            </Link>
            <Link
              href="/sugerir"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900/50 border border-zinc-800 text-white px-6 py-3 rounded-full font-medium hover:bg-zinc-800 transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              Sugerir Evento
            </Link>
          </div>
        </div>
      </section>

      {/* Section Separator */}
      <div className="h-px bg-zinc-800" />

      {/* ==================== Dashboard Preview ==================== */}
      <section className="relative bg-[#111111] py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-3">
              Tudo em um único lugar
            </h2>
            <p className="text-lg text-zinc-500">
              Do amador ao elite, filtros poderosos para encontrar a prova
              ideal.
            </p>
          </div>

          {/* Dashboard Container */}
          <div className="border border-zinc-800 rounded-2xl bg-zinc-900/10 overflow-hidden relative">
            {/* Dashboard Header */}
            <div className="flex flex-col lg:flex-row justify-between gap-4 p-3 md:p-4">
              {/* Search */}
              <div className="relative w-full lg:w-96 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300" />
                <input
                  type="text"
                  placeholder="Buscar corridas..."
                  readOnly
                  className="w-full bg-black/40 border border-zinc-800 text-sm text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none placeholder:text-zinc-600 cursor-default"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-xs font-medium text-white">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  Rio Preto + 50km
                </span>
                <span className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-xs font-medium text-white">
                  <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
                  Este Mês
                </span>
                <span className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-xs font-medium text-white">
                  <Trophy className="w-3.5 h-3.5 text-zinc-400" />
                  Premiação em $
                </span>
              </div>
            </div>

            {/* Border separator */}
            <div className="h-px bg-zinc-800" />

            {/* Race Cards Grid - flush, no gaps, shared borders */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-zinc-800">
              {/* Card 1 */}
              <div className="bg-black/50 p-5 group cursor-pointer flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">
                      Confirmada
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-zinc-600 transition-colors">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-4">
                    Corrida da Virada
                  </h3>
                  <div className="space-y-2.5 mb-6">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-zinc-600" />
                      <span className="text-sm text-zinc-400">
                        São José do Rio Preto, SP
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Ruler className="w-4 h-4 text-zinc-600" />
                      <span className="text-sm text-zinc-400">
                        5km &bull; 10km &bull; 15km
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Coins className="w-4 h-4 text-yellow-600/80" />
                      <span className="text-sm text-yellow-500/90 font-medium">
                        Premiação R$ 5.000,00
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-900 pt-4 mt-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-700 border border-black flex items-center justify-center text-[9px] text-white font-medium">
                      R
                    </div>
                    <div className="w-6 h-6 rounded-full bg-zinc-600 border border-black flex items-center justify-center text-[9px] text-white font-medium">
                      M
                    </div>
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-black flex items-center justify-center text-[9px] text-zinc-400 font-medium">
                      +12
                    </div>
                  </div>
                  <span className="text-xs bg-zinc-800 text-white px-3 py-1.5 rounded-md font-medium">
                    Vou nessa
                  </span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-black/50 p-5 group cursor-pointer flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">
                      Confirmada
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-zinc-600 transition-colors">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-4">
                    Meia de Votuporanga
                  </h3>
                  <div className="space-y-2.5 mb-6">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-zinc-600" />
                      <span className="text-sm text-zinc-400">
                        Votuporanga, SP
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Ruler className="w-4 h-4 text-zinc-600" />
                      <span className="text-sm text-zinc-400">
                        5km &bull; 21km
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Trophy className="w-4 h-4 text-zinc-600" />
                      <span className="text-sm text-zinc-500">
                        Troféus p/ categoria
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-900 pt-4 mt-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-700 border border-black flex items-center justify-center text-[9px] text-white font-medium">
                      A
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs bg-emerald-900/20 text-emerald-400 border border-emerald-900/50 px-3 py-1.5 rounded-md font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Eu vou
                  </span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-black/50 p-5 group cursor-pointer flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider">
                      Últimos dias
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-zinc-600 transition-colors">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-4">
                    Night Run Araçatuba
                  </h3>
                  <div className="space-y-2.5 mb-6">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-zinc-600" />
                      <span className="text-sm text-zinc-400">
                        Araçatuba, SP
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Ruler className="w-4 h-4 text-zinc-600" />
                      <span className="text-sm text-zinc-400">
                        3km &bull; 5km
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Moon className="w-4 h-4 text-zinc-600" />
                      <span className="text-sm text-zinc-500">
                        Largada 19:30
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-900 pt-4 mt-2">
                  <span className="text-[10px] text-orange-500 font-medium">
                    Inscrições encerram hoje
                  </span>
                  <span className="text-xs bg-zinc-800 text-white px-3 py-1.5 rounded-md font-medium">
                    Vou nessa
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Separator */}
      <div className="h-px bg-zinc-800" />

      {/* ==================== Features ==================== */}
      <section id="features" className="relative bg-[#0a0a0a] py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-3">
              Feito para quem corre.
            </h2>
            <p className="text-lg text-zinc-500 max-w-xl">
              Detalhes que fazem a diferença na hora de planejar sua temporada
              competitiva ou de lazer.
            </p>
          </div>

          {/* Row 1: Filtros (wider) + Quem vai? */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="md:col-span-3 border border-zinc-800 rounded-2xl bg-zinc-900/20 p-6 md:p-8 hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-5">
                <Filter className="w-5 h-5 text-zinc-300" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">
                Filtros Inteligentes
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-5">
                Não perca tempo em grupos de WhatsApp. Filtre por raio de
                distância da sua cidade, tipo de premiação (dinheiro/troféu) ou
                distância da prova.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400">
                  5km
                </span>
                <span className="px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400">
                  21km
                </span>
                <span className="px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400">
                  Dinheiro
                </span>
              </div>
            </div>

            <div className="md:col-span-2 border border-zinc-800 rounded-2xl bg-zinc-900/20 p-6 md:p-8 hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-5">
                <Users className="w-5 h-5 text-zinc-300" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">
                Quem vai?
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Veja quais amigos e atletas da região marcaram presença.
                Organize a carona e motive seu grupo de corrida.
              </p>
            </div>
          </div>

          {/* Row 2: Alertas + Detalhes (wider) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 border border-zinc-800 rounded-2xl bg-zinc-900/20 p-6 md:p-8 hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-5">
                <Bell className="w-5 h-5 text-zinc-300" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">
                Alertas de Prazo
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Nunca mais pague o valor do último lote. Receba lembretes antes
                da virada de lote ou encerramento das inscrições.
              </p>
            </div>

            <div className="md:col-span-3 border border-zinc-800 rounded-2xl bg-zinc-900/20 p-6 md:p-8 hover:border-zinc-700 transition-colors relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-5">
                <CalendarDays className="w-5 h-5 text-zinc-300" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">
                Detalhes que Importam
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Para a elite: categorias e valores de premiação detalhados. Para
                iniciantes: percurso, kit e local de largada claros.
              </p>
              {/* Decorative trophy */}
              <div className="absolute -bottom-4 -right-4 opacity-[0.06]">
                <Award className="w-32 h-32 text-white" strokeWidth={1} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Separator */}
      <div className="h-px bg-zinc-800" />

      {/* ==================== Cobertura Regional ==================== */}
      <section id="cobertura" className="relative bg-[#111111] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-zinc-600 uppercase tracking-[0.2em] mb-10">
            Cobertura Regional
          </p>
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

      {/* Section Separator */}
      <div className="h-px bg-zinc-800" />

      {/* ==================== CTA Final ==================== */}
      <section className="relative bg-[#0a0a0a] py-24 md:py-32 overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-zinc-600 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-zinc-700/10 blur-[80px] rounded-full" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
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
      <footer className="relative border-t border-zinc-800 bg-[#0a0a0a] py-12 md:py-16">
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
              <p className="text-sm text-zinc-600 max-w-xs">
                O hub de corridas do interior paulista.
              </p>
            </div>

            {/* Plataforma */}
            <div>
              <p className="text-sm font-semibold text-white mb-4">Plataforma</p>
              <nav className="flex flex-col gap-2.5 text-sm text-zinc-600">
                <Link href="/corridas" className="hover:text-zinc-400 transition-colors">
                  Corridas
                </Link>
                <a href="#features" className="hover:text-zinc-400 transition-colors">
                  Funcionalidades
                </a>
                <Link href="/sugerir" className="hover:text-zinc-400 transition-colors">
                  Sugerir Evento
                </Link>
              </nav>
            </div>

            {/* Legal */}
            <div>
              <p className="text-sm font-semibold text-white mb-4">Legal</p>
              <nav className="flex flex-col gap-2.5 text-sm text-zinc-600">
                <Link href="/termos" className="hover:text-zinc-400 transition-colors">
                  Termos de Uso
                </Link>
                <Link href="/privacidade" className="hover:text-zinc-400 transition-colors">
                  Privacidade
                </Link>
                <Link href="/contato" className="hover:text-zinc-400 transition-colors">
                  Contato
                </Link>
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
            <p className="text-xs text-zinc-700">
              &copy; {new Date().getFullYear()} Largada. Todos os direitos reservados.
            </p>
            <p className="text-xs text-zinc-700">
              Feito para corredores &hearts;
            </p>
          </div>
        </div>
      </footer>

      {/* ==================== Floating Notification Bar ==================== */}
      <FloatingNotificationBar />
    </main>
  );
}
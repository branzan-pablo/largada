import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/landing/landing-header";
import {
  ArrowRight,
  ChevronDown,
  Globe,
  Bell,
  CalendarDays,
  MapPin,
  Users,
  Filter,
  Smartphone,
  Award,
  CheckCircle,
  Instagram,
  Mail,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <LandingHeader />

      {/* ==================== Seção 1: Hero ==================== */}
      <section className="px-4 pt-16 pb-10 md:pt-24 md:pb-14">
        <div className="mx-auto grid max-w-screen-xl items-center gap-12 md:grid-cols-2">
          {/* Text */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Todas as corridas da sua região em{" "}
              <span className="text-primary">um só lugar</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Encontre corridas de rua no interior de São Paulo, veja quem vai
              participar e nunca mais perca uma inscrição.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/login">
                  Criar conta grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/corridas">Explorar corridas</Link>
              </Button>
            </div>
          </div>
          {/* App mockup */}
          <div className="hidden md:block">
            <div className="mx-auto w-72 rounded-3xl border-2 border-border bg-background p-3 shadow-xl">
              <div className="rounded-2xl bg-muted/50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">
                    Largada
                  </span>
                  <div className="h-6 w-6 rounded-full bg-primary/20" />
                </div>
                <div className="mb-3 rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">
                  Buscar corridas...
                </div>
                {[
                  {
                    name: "Corrida Noturna",
                    city: "Rio Preto",
                    dist: "5K / 10K",
                    count: 12,
                  },
                  {
                    name: "Maratona do Interior",
                    city: "Votuporanga",
                    dist: "21K / 42K",
                    count: 34,
                  },
                  {
                    name: "Trail Run Serra",
                    city: "Catanduva",
                    dist: "10K",
                    count: 8,
                  },
                ].map((race) => (
                  <div
                    key={race.name}
                    className="mb-2 rounded-lg border bg-background p-3"
                  >
                    <p className="text-xs font-semibold">{race.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {race.city}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {race.dist}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Users className="h-2.5 w-2.5" />
                        {race.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-center md:mt-10">
          <a
            href="#problema"
            className="flex flex-col items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Saiba mais
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </a>
        </div>
      </section>

      {/* ==================== Seção 2: Problema ==================== */}
      <section
        id="problema"
        className="scroll-mt-14 bg-muted/30 px-4 py-12 md:py-16"
      >
        <div className="mx-auto max-w-screen-xl">
          <h2 className="mb-4 text-center text-2xl font-bold md:text-3xl">
            Conhece essa situação?
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-center text-muted-foreground">
            Todo corredor do interior já passou por isso.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
            {[
              {
                icon: Globe,
                title: "Informação espalhada",
                desc: "Corridas divulgadas em Instagram, WhatsApp, sites de assessorias... cada lugar com uma informação diferente.",
              },
              {
                icon: CalendarDays,
                title: "Descobre tarde demais",
                desc: "Ficou sabendo daquela corrida incrível quando as inscrições já tinham encerrado.",
              },
              {
                icon: Users,
                title: "Vai sozinho?",
                desc: "Queria participar mas não sabia se algum conhecido também iria. Correr acompanhado é outra experiência.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border bg-background p-5 text-center sm:p-6"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <item.icon className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== Seção 3: Features ==================== */}
      <section id="features" className="px-4 py-12 md:py-16">
        <div className="mx-auto max-w-screen-xl">
          <h2 className="mb-4 text-center text-2xl font-bold md:text-3xl">
            Tudo que você precisa
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-center text-muted-foreground">
            Ferramentas pensadas para facilitar a vida do corredor.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
            {[
              {
                icon: Filter,
                title: "Calendário com filtros",
                desc: "Filtre por cidade, distância, data e tipo de premiação.",
              },
              {
                icon: MapPin,
                title: "Filtro por raio",
                desc: "Encontre corridas em até 10, 25, 50 ou 100 km de você.",
              },
              {
                icon: Bell,
                title: "Notificações inteligentes",
                desc: "Alertas de novas corridas e lembretes antes do prazo acabar.",
              },
              {
                icon: CheckCircle,
                title: '"Vou nessa!"',
                desc: "Marque presença e veja quem mais vai participar.",
              },
              {
                icon: Award,
                title: "Detalhes completos",
                desc: "Distâncias, percurso, valor, prazo, organizador e mais.",
              },
              {
                icon: Smartphone,
                title: "Instala como app",
                desc: "Adicione à tela inicial e use como um app nativo (PWA).",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-background p-4 sm:p-5"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-[18px] w-[18px] text-primary" />
                </div>
                <h3 className="mb-1 text-sm font-semibold">{feature.title}</h3>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== Seção 4: Números ==================== */}
      <section className="bg-muted/30 px-4 py-10 md:py-14">
        <div className="mx-auto max-w-screen-xl">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: "12+", label: "Corridas cadastradas" },
              { value: "3", label: "Cidades da região" },
              { value: "100%", label: "Gratuito para corredores" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-primary sm:text-3xl md:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== Seção 5: CTA Final ==================== */}
      <section className="bg-primary px-4 py-12 text-center text-white md:py-16">
        <div className="mx-auto max-w-screen-lg">
          <h2 className="text-2xl font-bold md:text-3xl">
            Pronto para encontrar sua próxima corrida?
          </h2>
          <p className="mt-3 text-sm text-white/80 sm:text-base">
            Gratuito. Sem pegadinha. Feito por corredores, para corredores.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="font-semibold text-primary"
            >
              <Link href="/login">
                Criar conta grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              asChild
              className="border border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/corridas">Explorar corridas</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ==================== Footer ==================== */}
      <footer className="border-t bg-muted/40 px-4 py-10 md:py-12">
        <div className="mx-auto max-w-screen-xl">
          <div className="grid gap-8 sm:grid-cols-3">
            {/* Brand */}
            <div>
              <p className="text-lg font-bold text-primary">LARGADA</p>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Todas as corridas da sua região em um só lugar. Feito para
                corredores do interior de SP.
              </p>
              {/* Social */}
              <div className="mt-4 flex gap-3">
                <a
                  href="https://instagram.com/largadaoficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="mailto:contato@largada.com.br"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-label="Email"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <p className="mb-3 text-sm font-semibold">Navegação</p>
              <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link href="/corridas" className="hover:text-foreground">
                  Ver corridas
                </Link>
                <Link href="/login" className="hover:text-foreground">
                  Entrar
                </Link>
                <Link href="/login" className="hover:text-foreground">
                  Criar conta
                </Link>
              </nav>
            </div>

            {/* Legal / Info */}
            <div>
              <p className="mb-3 text-sm font-semibold">Informações</p>
              <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link href="/termos" className="hover:text-foreground">
                  Termos de uso
                </Link>
                <Link href="/privacidade" className="hover:text-foreground">
                  Política de privacidade
                </Link>
                <Link href="/contato" className="hover:text-foreground">
                  Contato
                </Link>
              </nav>
            </div>
          </div>

          <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} LARGADA. Feito com ❤️ por corredores, para corredores!
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

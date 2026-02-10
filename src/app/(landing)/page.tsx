import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/landing/landing-header";
import {
  ArrowRight,
  ChevronDown,
  Search,
  Globe,
  Bell,
  CalendarDays,
  MapPin,
  Users,
  Filter,
  Smartphone,
  Award,
  UserPlus,
  CheckCircle,
  Quote,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <LandingHeader />

      {/* ==================== Seção 1: Hero ==================== */}
      <section className="px-4 py-20 md:py-28">
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
                  <span className="text-sm font-bold text-primary">Largada</span>
                  <div className="h-6 w-6 rounded-full bg-primary/20" />
                </div>
                <div className="mb-3 rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">
                  Buscar corridas...
                </div>
                {[
                  { name: "Corrida Noturna", city: "Rio Preto", dist: "5K / 10K", count: 12 },
                  { name: "Maratona do Interior", city: "Votuporanga", dist: "21K / 42K", count: 34 },
                  { name: "Trail Run Serra", city: "Catanduva", dist: "10K", count: 8 },
                ].map((race) => (
                  <div key={race.name} className="mb-2 rounded-lg border bg-background p-3">
                    <p className="text-xs font-semibold">{race.name}</p>
                    <p className="text-[10px] text-muted-foreground">{race.city}</p>
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
        <div className="mt-12 flex justify-center">
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
      <section id="problema" className="bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-screen-xl">
          <h2 className="mb-4 text-center text-2xl font-bold md:text-3xl">
            Conhece essa situação?
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-muted-foreground">
            Todo corredor do interior já passou por isso.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
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
                className="rounded-xl border bg-background p-6 text-center"
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
      <section id="features" className="px-4 py-20">
        <div className="mx-auto max-w-screen-xl">
          <h2 className="mb-4 text-center text-2xl font-bold md:text-3xl">
            Tudo que você precisa
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-muted-foreground">
            Ferramentas pensadas para facilitar a vida do corredor.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                title: "\"Vou nessa!\"",
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
                className="rounded-xl border bg-background p-5"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <h3 className="mb-1 font-semibold text-sm">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== Seção 4: Como Funciona ==================== */}
      <section id="como-funciona" className="bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-screen-xl">
          <h2 className="mb-12 text-center text-2xl font-bold md:text-3xl">
            Simples de usar
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: 1,
                icon: UserPlus,
                title: "Crie sua conta",
                desc: "Rápido, com Google ou email. Sem burocracia.",
              },
              {
                step: 2,
                icon: Search,
                title: "Encontre corridas",
                desc: "Filtre por cidade, distância e data na sua região.",
              },
              {
                step: 3,
                icon: CheckCircle,
                title: "Marque presença",
                desc: "Clique em \"Vou nessa\" e receba lembretes automáticos.",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background text-xs font-bold border-2 border-primary text-primary">
                    {item.step}
                  </span>
                </div>
                <h3 className="mb-1 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== Seção 5: Social Proof ==================== */}
      <section id="depoimentos" className="px-4 py-20">
        <div className="mx-auto max-w-screen-xl">
          <h2 className="mb-12 text-center text-2xl font-bold md:text-3xl">
            O que dizem os corredores
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                name: "Ana Carolina",
                city: "São José do Rio Preto",
                text: "Finalmente um lugar só pra ver as corridas da região. Não perco mais inscrição!",
              },
              {
                name: "Marcos Oliveira",
                city: "Votuporanga",
                text: "O melhor é ver quem vai participar. Sempre combino com os amigos pelo app.",
              },
              {
                name: "Fernanda Lima",
                city: "Araçatuba",
                text: "Os filtros são incríveis. Consigo achar corridas de 5K perto de casa em segundos.",
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-xl border bg-background p-6"
              >
                <Quote className="mb-3 h-5 w-5 text-primary/40" />
                <p className="mb-4 text-sm text-muted-foreground">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.city}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== Seção 6: CTA Final ==================== */}
      <section className="bg-primary px-4 py-20 text-center text-white">
        <h2 className="text-2xl font-bold md:text-3xl">
          Pronto para encontrar sua próxima corrida?
        </h2>
        <p className="mt-3 text-white/80">
          Gratuito. Sem pegadinha. Feito por corredores, para corredores.
        </p>
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="text-primary font-semibold"
          >
            <Link href="/login">
              Criar conta grátis
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ==================== Seção 7: Footer ==================== */}
      <footer className="bg-muted/50 px-4 py-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div>
              <p className="text-lg font-bold text-primary">Largada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Todas as corridas da sua região em um só lugar.
              </p>
            </div>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/corridas" className="hover:text-foreground">
                Corridas
              </Link>
              <Link href="/login" className="hover:text-foreground">
                Entrar
              </Link>
            </nav>
          </div>
          <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Largada. Feito para corredores do interior de SP.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

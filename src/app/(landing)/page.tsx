import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trophy, MapPin, Users, ArrowRight, ChevronDown } from "lucide-react";
import { LandingHeader } from "@/components/landing/landing-header";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <LandingHeader />

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Todas as corridas da sua região em{" "}
          <span className="text-primary">um só lugar</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Encontre corridas de rua no interior de São Paulo, veja quem vai
          participar e nunca mais perca uma inscrição.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/corridas">
              Explorar corridas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Criar conta grátis</Link>
          </Button>
        </div>
        <a
          href="#features"
          className="mt-12 flex flex-col items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Saiba mais
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </a>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-screen-xl">
          <h2 className="mb-12 text-center text-2xl font-bold md:text-3xl">
            Por que usar o Largada?
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">Calendário centralizado</h3>
              <p className="text-sm text-muted-foreground">
                Chega de procurar em Instagram, grupos de WhatsApp e sites
                espalhados. Todas as corridas em um lugar só.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">Filtros por região</h3>
              <p className="text-sm text-muted-foreground">
                Filtre por cidade, distância, data e tipo de premiação. Encontre
                a corrida perfeita perto de você.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">Veja quem vai</h3>
              <p className="text-sm text-muted-foreground">
                Marque presença e veja quais amigos também vão participar.
                Correr acompanhado é melhor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-4 py-20 text-center">
        <h2 className="text-2xl font-bold md:text-3xl">
          Pronto para encontrar sua próxima corrida?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Crie sua conta e comece a explorar as corridas da região.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/corridas">
              Ver corridas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Largada. Feito para corredores do interior de SP.</p>
      </footer>
    </main>
  );
}

import { LandingHeader } from "@/components/landing/landing-header";
import { Footer } from "@/components/footer/footer";
import { Instagram, Mail } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato",
};

export default function ContatoPage() {
  return (
    <main className="text-[#6B7280] antialiased overflow-x-hidden min-h-screen bg-white pt-16 flex flex-col">
      <LandingHeader />

      <section className="max-w-3xl mx-auto px-6 py-16 md:py-24 flex-1">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#0D1B2A] tracking-tight mb-4">
          Contato
        </h1>
        <p className="text-lg text-[#6B7280] mb-10 max-w-xl leading-relaxed">
          Tem alguma dúvida, sugestão ou precisa de ajuda? Fale com a gente
          por um dos canais abaixo.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* E-mail */}
          <div className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#FF4D00]/10 flex items-center justify-center mb-4">
              <Mail className="w-5 h-5 text-[#FF4D00]" />
            </div>
            <h2 className="text-lg font-semibold text-[#0D1B2A] mb-1">
              E-mail
            </h2>
            <a
              href="mailto:contato.largadas@gmail.com"
              className="text-[#FF4D00] hover:underline text-sm"
            >
              contato.largadas@gmail.com
            </a>
            <p className="text-sm text-gray-400 mt-2">
              Respondemos em até 48 horas.
            </p>
          </div>

          {/* Instagram */}
          <div className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#FF4D00]/10 flex items-center justify-center mb-4">
              <Instagram className="w-5 h-5 text-[#FF4D00]" />
            </div>
            <h2 className="text-lg font-semibold text-[#0D1B2A] mb-1">
              Instagram
            </h2>
            <a
              href="https://instagram.com/largada.run"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF4D00] hover:underline text-sm"
            >
              @largada.run
            </a>
            <p className="text-sm text-gray-400 mt-2">
              Nos mande uma DM!
            </p>
          </div>
        </div>

        <div className="mt-12 p-6 bg-gray-50 rounded-xl">
          <p className="text-sm text-[#6B7280]">
            <strong className="text-[#0D1B2A]">
              Proteção de dados (LGPD):
            </strong>{" "}
            Para exercer seus direitos como titular de dados pessoais
            (acesso, correção, exclusão ou portabilidade), envie um e-mail
            para{" "}
            <a
              href="mailto:contato.largadas@gmail.com"
              className="text-[#FF4D00] hover:underline"
            >
              contato.largadas@gmail.com
            </a>{" "}
            com o assunto &quot;Direitos LGPD&quot;.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

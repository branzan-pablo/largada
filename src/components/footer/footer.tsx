import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-[#0D1B2A] py-6 md:py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:gap-5 md:px-8">
        <Link href="/" className="flex items-center gap-1 text-white">
          <Image src="/logo_120.png" alt="" width={36} height={36} />
          <span className="font-[family-name:var(--font-logo)] text-xl tracking-wide">LARGADA</span>
        </Link>
        <div className="flex flex-col items-center gap-2.5 text-center sm:items-end sm:gap-3 sm:text-right">
          <p className="max-w-[280px] text-[11px] leading-relaxed text-gray-400 sm:max-w-none sm:text-xs">Calendário de corridas de rua do Noroeste Paulista.</p>
          <address className="not-italic">
            <a
              href="https://wa.me/5517988282542"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar com Pablo Ferreira pelo WhatsApp"
              className="group inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1.5 text-[11px] text-gray-300 transition-colors hover:border-[#FF4D00]/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1B2A] min-[360px]:gap-2 min-[360px]:px-3 min-[360px]:text-xs"
            >
              <MessageCircle aria-hidden="true" className="size-3.5 text-[#FF4D00]" />
              <span>Pablo Ferreira</span>
              <span aria-hidden="true" className="text-white/25">•</span>
              <span>(17) 9 8828-2542</span>
            </a>
          </address>
        </div>
      </div>
    </footer>
  );
}

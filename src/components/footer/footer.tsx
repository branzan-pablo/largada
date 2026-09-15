import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-[#0D1B2A] py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 sm:flex-row md:px-8">
        <Link href="/corridas" className="flex items-center gap-1 text-white">
          <Image src="/logo_120.png" alt="" width={36} height={36} />
          <span className="font-[family-name:var(--font-logo)] text-xl tracking-wide">LARGADA</span>
        </Link>
        <div className="flex flex-col items-center gap-3 text-center sm:items-end sm:text-right">
          <p className="text-xs text-gray-400">Calendário de corridas de rua do Noroeste Paulista.</p>
          <address className="not-italic">
            <a
              href="https://wa.me/5517988282542"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar com Pablo Ferreira pelo WhatsApp"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-[#FF4D00]/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1B2A]"
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

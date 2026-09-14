import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-[#0D1B2A] py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row md:px-8">
        <Link href="/corridas" className="flex items-center gap-1 text-white">
          <Image src="/logo_120.png" alt="" width={36} height={36} />
          <span className="font-[family-name:var(--font-logo)] text-xl tracking-wide">LARGADA</span>
        </Link>
        <p className="text-xs text-gray-400">Calendário de corridas de rua do Noroeste Paulista.</p>
      </div>
    </footer>
  );
}

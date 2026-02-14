import Link from "next/link";
import { LandingHeader } from "@/components/landing/landing-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { NotificationPrompt } from "@/components/pwa/notification-prompt";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-[#0a0a0a] text-zinc-300 flex flex-col">
      <LandingHeader />
      <div className="flex-1 pb-16 md:pb-0 pt-16">{children}</div>
      <BottomNav />

      {/* Footer */}
      <footer className="hidden md:block border-t border-zinc-800 bg-[#0a0a0a] py-8">
        <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center">
              <span className="text-zinc-400 font-semibold text-xs">L</span>
            </div>
            <span className="text-xs text-zinc-600">
              &copy; {new Date().getFullYear()} Largada
            </span>
          </div>
          <nav className="flex items-center gap-6 text-xs text-zinc-600">
            <Link href="/termos" className="hover:text-zinc-400 transition-colors">
              Termos
            </Link>
            <Link href="/privacidade" className="hover:text-zinc-400 transition-colors">
              Privacidade
            </Link>
            <Link href="/contato" className="hover:text-zinc-400 transition-colors">
              Contato
            </Link>
          </nav>
        </div>
      </footer>

      <NotificationPrompt />
      <InstallPrompt />
    </div>
  );
}

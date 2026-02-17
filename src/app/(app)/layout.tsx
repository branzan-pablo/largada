import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { NotificationPrompt } from "@/components/pwa/notification-prompt";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-black bg-grid text-zinc-300 flex flex-col">
      <Header />
      <div className="flex-1 pb-16 md:pb-0 pt-16">{children}</div>
      <BottomNav />

      {/* Footer */}
      <footer className="hidden md:block border-t border-zinc-800 bg-background py-8">
        <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center">
              <span className="text-zinc-400 font-semibold text-xs">L</span>
            </div>
            <span className="text-xs text-zinc-600">
              &copy; {new Date().getFullYear()} Largada
            </span>
          </div>
        </div>
      </footer>

      <NotificationPrompt />
      <InstallPrompt />
    </div>
  );
}

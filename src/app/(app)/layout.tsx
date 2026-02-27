import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { NotificationPrompt } from "@/components/pwa/notification-prompt";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { Footer } from "@/components/footer/footer";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white bg-grid text-[#6B7280] flex flex-col overflow-x-hidden">
      <Header />
      <div className="flex-1 pb-16 md:pb-0">{children}</div>
      <BottomNav />

      <Footer />
      <NotificationPrompt />
      <InstallPrompt />
    </div>
  );
}

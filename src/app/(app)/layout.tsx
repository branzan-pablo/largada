import { Header } from "@/components/layout/header";
import { Footer } from "@/components/footer/footer";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-[#F4F6F8] text-[#6B7280]">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-8 md:px-8 md:pb-20 md:pt-12">{children}</main>
      <Footer />
    </div>
  );
}

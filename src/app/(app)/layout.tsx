import { Header } from "@/components/layout/header";
import { Footer } from "@/components/footer/footer";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white bg-grid text-[#6B7280] flex flex-col overflow-x-clip">
      <Header />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 md:px-8 md:pt-12">{children}</div>
      <Footer />
    </div>
  );
}

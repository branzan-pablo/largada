import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { LoginModalProvider } from "@/contexts/login-modal-context";
import { LoginModal } from "@/components/auth/login-modal";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#E85D2A",
};

export const metadata: Metadata = {
  title: {
    default: "Largada — Corridas de rua do interior de SP",
    template: "%s | Largada",
  },
  description:
    "Encontre todas as corridas de rua da sua região em um só lugar. Calendário completo com filtros, detalhes de provas e notificações.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "Largada — Corridas de rua do interior de SP",
    description:
      "Encontre todas as corridas de rua da sua região em um só lugar.",
    siteName: "Largada",
    locale: "pt_BR",
    type: "website",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <Suspense>
            <LoginModalProvider>
              {children}
              <LoginModal />
            </LoginModalProvider>
          </Suspense>
        </AuthProvider>
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}

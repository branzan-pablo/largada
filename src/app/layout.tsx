import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { LoginModalProvider, LoginModalUrlHandler } from "@/contexts/login-modal-context";
import { LoginModal } from "@/components/auth/login-modal";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#fc5200",
};

export const metadata: Metadata = {
  title: {
    default: "Largada — Corridas de rua em todo o Brasil",
    template: "%s | Largada",
  },
  description:
    "Calendário de corridas de rua com mais de 5.000 cidades. Filtre por distância, premiação e data. Receba alertas antes dos prazos fecharem.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "Largada — Corridas de rua em todo o Brasil",
    description:
      "Calendário de corridas de rua com mais de 5.000 cidades. Filtre por distância, premiação e data.",
    siteName: "Largada",
    locale: "pt_BR",
    type: "website",
  },
  manifest: "/manifest.json",
  icons: {
    apple: "/icons/icon-192.png",
  },
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
          <LoginModalProvider>
            <Suspense>
              <LoginModalUrlHandler />
            </Suspense>
            {children}
            <LoginModal />
          </LoginModalProvider>
        </AuthProvider>
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}

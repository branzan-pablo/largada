import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter, Bebas_Neue } from "next/font/google";
import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "@/contexts/auth-context";
import { LoginModalProvider, LoginModalUrlHandler } from "@/contexts/login-modal-context";
import { LoginModal } from "@/components/auth/login-modal";
import { SwRegister } from "@/components/pwa/sw-register";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: "400",
});

export const viewport: Viewport = {
  themeColor: "#FF4D00",
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
    images: [{ url: "/logo_120.png", width: 1080, height: 1080, alt: "Largada" }],
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
      <body
        className={`${inter.variable} ${bebasNeue.variable} font-sans antialiased`}
        style={{
          backgroundColor: "#f5f0f2",
        }}
      >
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
        <SwRegister />
        <SpeedInsights />
      </body>
    </html>
  );
}

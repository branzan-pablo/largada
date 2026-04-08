import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter, Bebas_Neue } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/contexts/auth-context";
import { LoginModalProvider, LoginModalUrlHandler } from "@/contexts/login-modal-context";
import { ClientLoginModal, ClientToaster } from "@/components/layout/client-shell";
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
    default: "Largada",
    template: "%s | Largada",
  },
  description:
    "Calendário de corridas de rua do Noroeste Paulista. Filtre por distância, premiação e data. Receba alertas antes dos prazos fecharem.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "Largada",
    description:
      "Calendário de corridas de rua do Noroeste Paulista. Filtre por distância, premiação e data.",
    siteName: "Largada",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Largada — Calendário de Corridas de Rua" }],
  },
  manifest: "/manifest.json",
  icons: {
    apple: [
      { url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Largada",
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
      >
        <AuthProvider>
          <LoginModalProvider>
            <Suspense>
              <LoginModalUrlHandler />
            </Suspense>
            {children}
            <ClientLoginModal />
          </LoginModalProvider>
        </AuthProvider>
        <ClientToaster />
        <SwRegister />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

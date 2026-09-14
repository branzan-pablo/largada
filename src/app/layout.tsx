import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import { ClientToaster } from "@/components/layout/client-shell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: "400",
  display: "optional",
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
    "Calendário de corridas de rua do Noroeste Paulista. Consulte provas por cidade, distância, premiação e data.",
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
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Largada | Calendário de Corridas de Rua" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
      </head>
      <body
        className={`${inter.variable} ${bebasNeue.variable} font-sans antialiased`}
      >
        {children}
        <ClientToaster />
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { useLoginModal } from "@/contexts/login-modal-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MobileMenu } from "@/components/layout/mobile-menu";

export function LandingHeader() {
  const { user, profile, isLoading } = useAuth();
  const { openLogin, openRegister } = useLoginModal();

  return (
    <header className="fixed top-0 w-full z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1">
          <Image
            src="/logo_120.png"
            alt="Largada"
            width={60}
            height={60}
            className="w-10 h-10 sm:w-[60px] sm:h-[60px]"
          />
          <span className="font-[family-name:var(--font-logo)] text-2xl sm:text-3xl tracking-wide text-[#0D1B2A]">LARGADA</span>
        </Link>

        {/* Nav links - desktop */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/radar-de-podio" className="text-sm text-[#6B7280] hover:text-[#0D1B2A] transition-colors">
            Radar de Pódio
          </Link>
          <a href="#features" className="text-sm text-[#6B7280] hover:text-[#0D1B2A] transition-colors">
            Funcionalidades
          </a>
          <Link href="/corridas" className="text-sm text-[#6B7280] hover:text-[#0D1B2A] transition-colors">
            Corridas
          </Link>
        </nav>

        {/* Auth area */}
        <div className="flex items-center gap-6">
          <MobileMenu variant="landing" />
          <div className="hidden md:flex md:items-center md:gap-6">
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            ) : user ? (
              <>
                <button className="text-sm text-[#6B7280] hover:text-[#0D1B2A] transition-colors">
                  <Link href="/corridas">Ir para corridas</Link>
                </button>

                <Link href="/perfil">
                  <Avatar className="h-8 w-8">
                    {profile?.avatar_url && (
                      <AvatarImage src={profile.avatar_url} />
                    )}
                    <AvatarFallback className="bg-gray-200 text-[#6B7280]">
                      {profile?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={openLogin}
                  className="cursor-pointer text-sm text-[#6B7280] hover:text-[#0D1B2A] transition-colors"
                >
                  Entrar
                </button>
                <button
                  onClick={openRegister}
                  className="cursor-pointer inline-flex items-center justify-center gap-2 bg-[#FF4D00] text-white text-sm px-6 py-3 rounded-full font-semibold hover:bg-[#E04400] transition-colors"
                >
                  Criar conta
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

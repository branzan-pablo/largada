"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useLoginModal } from "@/contexts/login-modal-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function LandingHeader() {
  const { user, profile, isLoading } = useAuth();
  const { openLogin, openRegister } = useLoginModal();

  return (
    <header className="fixed top-0 w-full z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FF4D00] rounded flex items-center justify-center">
            <span className="text-white font-semibold text-lg">L</span>
          </div>
          <Link href="/" className="text-[#0D1B2A] font-medium text-lg tracking-tight">
            Largada
          </Link>
        </div>

        {/* Nav links - desktop */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-[#6B7280] hover:text-[#0D1B2A] transition-colors">
            Funcionalidades
          </a>
          <Link href="/corridas" className="text-sm text-[#6B7280] hover:text-[#0D1B2A] transition-colors">
            Corridas
          </Link>
        </nav>

        {/* Auth area */}
        <div className="flex items-center gap-6">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
          ) : user ? (
            <>
              <Button
                size="sm"
                asChild
                className="bg-[#FF4D00] text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#E04400] border-0"
              >
                <Link href="/corridas">Ir para corridas</Link>
              </Button>
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
                className="text-sm text-[#6B7280] hover:text-[#0D1B2A] transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={openRegister}
                className="hidden sm:inline-flex items-center justify-center gap-2 bg-[#FF4D00] text-white text-sm px-6 py-3 rounded-full font-semibold hover:bg-[#E04400] transition-colors"
              >
                Criar conta
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

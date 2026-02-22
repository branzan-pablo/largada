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
    <header className="fixed top-0 w-full z-50 border-b border-zinc-900 bg-black/50 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-black font-semibold text-lg">L</span>
          </div>
          <Link href="/" className="text-white font-medium text-lg tracking-tight">
            Largada
          </Link>
        </div>

        {/* Nav links - desktop */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Funcionalidades
          </a>
          <Link href="/corridas" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Corridas
          </Link>
        </nav>

        {/* Auth area */}
        <div className="flex items-center gap-6">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-800" />
          ) : user ? (
            <>
              <Button
                size="sm"
                asChild
                className="bg-[#fc5200] text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#c94100] border-0"
              >
                <Link href="/corridas">Ir para corridas</Link>
              </Button>
              <Link href="/perfil">
                <Avatar className="h-8 w-8">
                  {profile?.avatar_url && (
                    <AvatarImage src={profile.avatar_url} />
                  )}
                  <AvatarFallback className="bg-zinc-800 text-zinc-300">
                    {profile?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={openLogin}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={openRegister}
                className="hidden sm:inline-flex items-center justify-center gap-2 bg-[#fc5200] text-white text-sm px-6 py-3 rounded-full font-semibold hover:bg-[#c94100] transition-colors"
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

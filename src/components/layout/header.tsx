"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLoginModal } from "@/contexts/login-modal-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, LogOut, Shield, Heart } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function Header() {
  const { user, profile, isLoading, signOut } = useAuth();
  const { openLogin } = useLoginModal();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isCorridasPage = pathname === "/corridas";

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo-largada.jpeg"
            alt="Largada"
            width={60}
            height={60}
          />
          <span className="font-[family-name:var(--font-logo)] text-2xl tracking-wide text-[#0D1B2A]">ARGADA</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {!isCorridasPage && (
            <Link
              href="/corridas"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Corridas
            </Link>
          )}
          {user && (
            <>
              <Link
                href="/sugerir"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sugerir Corrida
              </Link>
              <Link
                href="/perfil/minhas-corridas"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Minhas Corridas
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {profile?.avatar_url && (
                      <AvatarImage src={profile.avatar_url} />
                    )}
                    <AvatarFallback>
                      {profile?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-2">
                <div className="space-y-1">
                  <Link
                    href="/perfil"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    <User className="h-4 w-4" />
                    Perfil
                  </Link>
                  <Link
                    href="/perfil/minhas-corridas"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Heart className="h-4 w-4" />
                    Minhas Corridas
                  </Link>
                  {profile?.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                    >
                      <Shield className="h-4 w-4" />
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <button
              onClick={openLogin}
              className="text-sm text-[#6B7280] hover:text-[#0D1B2A] transition-colors"
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

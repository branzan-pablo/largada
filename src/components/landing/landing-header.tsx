"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function LandingHeader() {
  const { user, profile, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-primary">
          Largada
        </Link>
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <>
              <Button size="sm" asChild>
                <Link href="/corridas">Ir para corridas</Link>
              </Button>
              <Link href="/perfil">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {profile?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/corridas">Ver corridas</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

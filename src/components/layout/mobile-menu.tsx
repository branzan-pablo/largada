"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { useLoginModal } from "@/contexts/login-modal-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Menu,
  Crosshair,
  Trophy,
  MessageSquarePlus,
  Heart,
  User,
  LogOut,
  Hash,
  Shield,
  ChevronRight,
} from "lucide-react";

interface MobileMenuProps {
  variant: "app" | "landing";
}

const appLinks = [
  { href: "/radar-de-podio", icon: Crosshair, label: "Radar de Pódio", description: "Suas chances de pódio" },
  { href: "/corridas", icon: Trophy, label: "Corridas", description: "Calendário de provas" },
  { href: "/sugerir", icon: MessageSquarePlus, label: "Sugerir Corrida", description: "Indicar nova prova", requiresAuth: true },
  { href: "/perfil/minhas-corridas", icon: Heart, label: "Minhas Corridas", description: "Provas salvas", requiresAuth: true },
  { href: "/perfil", icon: User, label: "Perfil", description: "Seus dados", requiresAuth: true },
];

const landingLinks = [
  { href: "/radar-de-podio", icon: Crosshair, label: "Radar de Pódio", description: "Suas chances de pódio" },
  { href: "#features", icon: Hash, label: "Funcionalidades", description: "O que oferecemos", isAnchor: true },
  { href: "/corridas", icon: Trophy, label: "Corridas", description: "Calendário de provas" },
];

export function MobileMenu({ variant }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { openLogin, openRegister } = useLoginModal();

  const links = variant === "app" ? appLinks : landingLinks;

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  };

  function renderLink(item: (typeof appLinks)[number] & { isAnchor?: boolean }) {
    if ("requiresAuth" in item && item.requiresAuth && !user) {
      return null;
    }

    const isActive =
      !item.isAnchor &&
      (pathname === item.href || pathname.startsWith(item.href + "/"));

    const content = (
      <>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
            isActive
              ? "bg-[#FF4D00]/15"
              : "bg-gray-100"
          )}
        >
          <item.icon
            className={cn(
              "h-4 w-4",
              isActive ? "text-[#FF4D00]" : "text-[#6B7280]"
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm",
              isActive ? "font-semibold text-[#FF4D00]" : "font-medium text-[#0D1B2A]"
            )}
          >
            {item.label}
          </p>
          <p className="text-[11px] text-[#6B7280]">{item.description}</p>
        </div>
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            isActive ? "text-[#FF4D00]/50" : "text-gray-300"
          )}
        />
      </>
    );

    const className = cn(
      "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
      isActive ? "bg-[#FF4D00]/5" : "hover:bg-gray-50"
    );

    if (item.isAnchor) {
      return (
        <a
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={className}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setOpen(false)}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#6B7280] transition-colors hover:bg-gray-100 hover:text-[#0D1B2A]"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" showCloseButton={false} className="w-[300px] p-0 flex flex-col">
          {/* Header */}
          <div className="relative overflow-hidden px-5 pb-4 pt-5">
            <div className="absolute inset-0 bg-gradient-to-b from-[#FF4D00]/8 to-transparent" />
            <SheetHeader className="relative p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Image
                    src="/logo_120.png"
                    alt="Largada"
                    width={50}
                    height={50}
                  />
                </div>
                <SheetClose className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-black/5 hover:text-[#0D1B2A]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                  <span className="sr-only">Fechar</span>
                </SheetClose>
              </div>
            </SheetHeader>
          </div>

          {/* Admin link (first, with separator) */}
          {profile?.role === "admin" && (
            <div className="px-3 pb-2">
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                  pathname.startsWith("/admin") ? "bg-[#FF4D00]/5" : "hover:bg-gray-50"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                    pathname.startsWith("/admin") ? "bg-[#FF4D00]/15" : "bg-gray-100"
                  )}
                >
                  <Shield
                    className={cn(
                      "h-4 w-4",
                      pathname.startsWith("/admin") ? "text-[#FF4D00]" : "text-[#6B7280]"
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm",
                      pathname.startsWith("/admin") ? "font-semibold text-[#FF4D00]" : "font-medium text-[#0D1B2A]"
                    )}
                  >
                    Admin
                  </p>
                  <p className="text-[11px] text-[#6B7280]">Painel administrativo</p>
                </div>
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    pathname.startsWith("/admin") ? "text-[#FF4D00]/50" : "text-gray-300"
                  )}
                />
              </Link>
              <div className="mx-3 mt-2 border-b border-gray-100" />
            </div>
          )}

          {/* Nav */}
          <nav className="flex flex-col gap-1 px-3 py-1">
            <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-[#6B7280]/60">
              Navegação
            </p>
            {links.map((item) => renderLink(item))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User area */}
          <div className="border-t border-gray-100 px-3 py-4">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-3">
                  <Avatar className="h-9 w-9">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                    <AvatarFallback className="bg-[#FF4D00]/10 text-xs font-semibold text-[#FF4D00]">
                      {profile?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#0D1B2A]">
                      {profile?.full_name ?? "Corredor"}
                    </p>
                    <p className="truncate text-[11px] text-[#6B7280]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sair da conta
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setOpen(false);
                    openRegister();
                  }}
                  className="w-full rounded-xl bg-[#FF4D00] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#E04500]"
                >
                  Criar conta grátis
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    openLogin();
                  }}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-[#6B7280] transition-colors hover:bg-gray-50 hover:text-[#0D1B2A]"
                >
                  Já tenho conta
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

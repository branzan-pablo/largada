"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Heart, MessageSquarePlus, User, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useLoginModal } from "@/contexts/login-modal-context";

const navItems = [
  { href: "/corridas", icon: Trophy, label: "Corridas" },
  { href: "/radar-de-podio", icon: Crosshair, label: "Radar" },
  { href: "/perfil/minhas-corridas", icon: Heart, label: "Minhas", requiresAuth: true },
  { href: "/sugerir", icon: MessageSquarePlus, label: "Sugerir", requiresAuth: true },
  { href: "/perfil", icon: User, label: "Perfil", requiresAuth: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { openLogin } = useLoginModal();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md md:hidden">
      <div className="flex justify-around pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          if (item.requiresAuth && !user) {
            return (
              <button
                key={item.href}
                onClick={openLogin}
                aria-label={item.label}
                className="flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[11px] font-medium text-gray-400 transition-colors active:text-[#FF4D00]"
              >
                <item.icon className="h-6 w-6" />
                {item.label}
              </button>
            );
          }

          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[11px] font-medium transition-colors",
                isActive ? "text-[#FF4D00]" : "text-gray-400 active:text-[#FF4D00]"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive && "text-[#FF4D00]")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

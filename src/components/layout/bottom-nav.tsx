"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Heart, MessageSquarePlus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useLoginModal } from "@/contexts/login-modal-context";

const navItems = [
  { href: "/corridas", icon: Trophy, label: "Corridas" },
  { href: "/perfil/minhas-corridas", icon: Heart, label: "Minhas", requiresAuth: true },
  { href: "/sugerir", icon: MessageSquarePlus, label: "Sugerir", requiresAuth: true },
  { href: "/perfil", icon: User, label: "Perfil", requiresAuth: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { openLogin } = useLoginModal();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-black/95 backdrop-blur-md md:hidden">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          if (item.requiresAuth && !user) {
            return (
              <button
                key={item.href}
                onClick={openLogin}
                className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-zinc-500"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          }

          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs",
                isActive
                  ? "text-white"
                  : "text-zinc-500"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-white")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { tabsListVariants } from "@/components/ui/tabs";

const tabs = [
  { href: "/admin", label: "Corridas", icon: Trophy },
  { href: "/admin/sugestoes", label: "Sugestões", icon: MessageSquarePlus },
] as const;

export function AdminNav({ pendingSuggestions }: { pendingSuggestions: number }) {
  const pathname = usePathname();

  return (
    <nav role="tablist" className={cn(tabsListVariants({ variant: "line" }), "w-full justify-start")}>
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/admin"
          ? pathname === "/admin" || pathname.startsWith("/admin/corridas")
          : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              "after:absolute after:inset-x-0 after:bottom-[-4px] after:h-0.5 after:bg-foreground after:transition-opacity",
              isActive
                ? "text-foreground after:opacity-100"
                : "text-muted-foreground hover:text-foreground after:opacity-0"
            )}
          >
            <Icon className="size-4" />
            {label}
            {href === "/admin/sugestoes" && pendingSuggestions > 0 && (
              <span className="ml-0.5 text-xs text-muted-foreground">({pendingSuggestions})</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

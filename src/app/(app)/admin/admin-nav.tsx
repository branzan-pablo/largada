"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AdminNav() {
  const router = useRouter();
  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <nav className="flex items-center justify-between py-2">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium"><Trophy className="h-4 w-4" /> Corridas</Link>
      <button onClick={signOut} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" /> Sair</button>
    </nav>
  );
}

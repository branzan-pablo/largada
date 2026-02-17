"use client";

import Link from "next/link";
import { useLoginModal } from "@/contexts/login-modal-context";
import { useAuth } from "@/contexts/auth-context";

import { Footprints, CirclePlus } from "lucide-react";

export function CtaButtons() {
  const { openRegister } = useLoginModal();
  const { user } = useAuth();

  if (user) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/corridas"
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#E85D2A] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#d4522a] transition-colors"
        >
          <Footprints className="w-5 h-5" />
          Ver corridas
        </Link>
        <Link
          href="/sugerir"
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900/50 border border-zinc-700 text-white px-6 py-3 rounded-full font-medium hover:bg-zinc-800 transition-colors"
        >
          <CirclePlus className="w-5 h-5" />
          Sugerir Evento
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <Link
        href="/corridas"
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#E85D2A] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#d4522a] transition-colors"
      >
        <Footprints className="w-5 h-5" />
        Explorar Corridas
      </Link>
      <button
        type="button"
        onClick={openRegister}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900/50 border border-zinc-700 text-white px-6 py-3 rounded-full font-medium hover:bg-zinc-800 transition-colors"
      >
        <CirclePlus className="w-5 h-5" />
        Sugerir Evento
      </button>
    </div>
  );
}
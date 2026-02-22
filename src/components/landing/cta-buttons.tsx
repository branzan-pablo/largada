"use client";

import Link from "next/link";
import { useLoginModal } from "@/contexts/login-modal-context";
import { useAuth } from "@/contexts/auth-context";

import { Footprints, CirclePlus } from "lucide-react";

const primaryClass =
  "w-full sm:w-auto flex items-center justify-center gap-2 bg-[#FF4D00] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#E04400] transition-colors";
const secondaryClass =
  "w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-gray-300 text-[#0D1B2A] px-6 py-3 rounded-full font-medium hover:bg-gray-50 shadow-sm transition-colors";

export function CtaButtons() {
  const { openRegister } = useLoginModal();
  const { user } = useAuth();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <Link href="/corridas" className={primaryClass}>
        <Footprints className="w-5 h-5" />
        {user ? "Ver corridas" : "Explorar Corridas"}
      </Link>
      {user ? (
        <Link href="/sugerir" className={secondaryClass}>
          <CirclePlus className="w-5 h-5" />
          Sugerir Evento
        </Link>
      ) : (
        <button type="button" onClick={openRegister} className={secondaryClass}>
          <CirclePlus className="w-5 h-5" />
          Sugerir Evento
        </button>
      )}
    </div>
  );
}

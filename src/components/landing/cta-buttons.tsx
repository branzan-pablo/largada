"use client";

import Link from "next/link";
import { useLoginModal } from "@/contexts/login-modal-context";
import { useAuth } from "@/contexts/auth-context";
import { Footprints, UserPlus, CirclePlus } from "lucide-react";

const primaryClass =
  "w-full sm:w-auto flex items-center justify-center gap-2 bg-[#FF4D00] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#E04400] transition-colors";
const secondaryClass =
  "w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-gray-300 text-[#0D1B2A] px-6 py-3 rounded-full font-medium hover:bg-gray-50 shadow-sm transition-colors";

interface CtaButtonsProps {
  /**
   * Quando false (padrão — Hero):
   *   Primário (laranja) → /corridas  |  Secundário → abre registro / sugerir
   * Quando true (CTA Final):
   *   Primário (laranja) → abre registro  |  Secundário → /corridas
   */
  swapActions?: boolean;
  /** Variante visual para o botão secundário em fundos escuros */
  darkSecondary?: boolean;
}

export function CtaButtons({
  swapActions = false,
  darkSecondary = false,
}: CtaButtonsProps) {
  const { openRegister } = useLoginModal();
  const { user } = useAuth();

  const resolvedSecondaryClass = darkSecondary
    ? "w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-6 py-3 rounded-full font-medium hover:bg-white/20 transition-colors backdrop-blur-sm"
    : secondaryClass;

  if (swapActions) {
    // CTA Final: laranja = criar conta | branco = ver corridas
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {user ? (
          <Link href="/corridas" className={primaryClass}>
            <Footprints className="w-5 h-5" />
            Ver as corridas
          </Link>
        ) : (
          <button type="button" onClick={openRegister} className={primaryClass}>
            <UserPlus className="w-5 h-5" />
            Criar minha conta grátis
          </button>
        )}
        {user ? (
          <Link href="/sugerir" className={resolvedSecondaryClass}>
            <CirclePlus className="w-5 h-5" />
            Sugerir Evento
          </Link>
        ) : (
          <Link href="/corridas" className={resolvedSecondaryClass}>
            <Footprints className="w-5 h-5" />
            Ver as corridas
          </Link>
        )}
      </div>
    );
  }

  // Hero padrão: laranja = ver corridas | branco = sugerir / criar conta
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <Link href="/corridas" className={primaryClass}>
        <Footprints className="w-5 h-5" />
        Ver as corridas
      </Link>
      {user ? (
        <Link href="/sugerir" className={resolvedSecondaryClass}>
          <CirclePlus className="w-5 h-5" />
          Sugerir Evento
        </Link>
      ) : (
        <button
          type="button"
          onClick={openRegister}
          className={resolvedSecondaryClass}
        >
          <UserPlus className="w-5 h-5" />
          Criar conta grátis
        </button>
      )}
    </div>
  );
}

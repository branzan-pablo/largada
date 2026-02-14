"use client";

import { useLoginModal } from "@/contexts/login-modal-context";

export function CtaButtons() {
  const { openRegister, openLogin } = useLoginModal();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <button
        onClick={openRegister}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors"
      >
        Criar conta grátis
      </button>
      <button
        onClick={openLogin}
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-800/50 border border-zinc-700 text-white px-6 py-3 rounded-full font-medium hover:bg-zinc-700 transition-colors"
      >
        Entrar com Strava
      </button>
    </div>
  );
}

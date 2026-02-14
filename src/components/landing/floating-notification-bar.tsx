"use client";

import { useState } from "react";
import { Bell, X } from "lucide-react";

export function FloatingNotificationBar() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="bg-zinc-800/80 backdrop-blur-md border border-zinc-700 rounded-full p-2 pl-4 flex items-center justify-between shadow-2xl shadow-black/50">
        <div className="flex items-center gap-3">
          <Bell className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-200">
            Notificar novas corridas na minha região
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle (visual only on landing) */}
          <div className="relative w-11 h-6 bg-emerald-500 rounded-full cursor-pointer">
            <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
          </div>
          <button
            onClick={() => setVisible(false)}
            className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors"
            aria-label="Fechar notificação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

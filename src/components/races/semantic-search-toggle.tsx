"use client";

import { Sparkles } from "lucide-react";

interface SemanticSearchToggleProps {
  enabled: boolean;
  /**
   * When true, the toggle is rendered as inert/invisible. The listing only
   * supports semantic search alongside a free-text query, so we hide the
   * control entirely while the input is empty.
   */
  hidden: boolean;
  onToggle: (next: boolean) => void;
  /**
   * Optional className for layout-level tweaks (margin/spacing) by callers.
   */
  className?: string;
}

/**
 * Compact pill toggle next to the listing search input that flips between
 * literal ILIKE search and semantic search (query embedded with Gemini and
 * ranked against race embeddings). Stateless: the parent owns the boolean
 * and reflects it back via `enabled`.
 */
export function SemanticSearchToggle({
  enabled,
  hidden,
  onToggle,
  className = "",
}: SemanticSearchToggleProps) {
  if (hidden) return null;

  const base =
    "inline-flex items-center gap-1.5 h-10 px-3 rounded-md border text-xs font-semibold uppercase tracking-wide transition-colors whitespace-nowrap";
  const active =
    "border-[#FF4D00] bg-[#FF4D00]/10 text-[#FF4D00] hover:bg-[#FF4D00]/15";
  const inactive =
    "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700";

  return (
    <button
      type="button"
      onClick={() => onToggle(!enabled)}
      className={`${base} ${enabled ? active : inactive} ${className}`}
      aria-pressed={enabled}
      title={
        enabled
          ? "Desativar busca inteligente (volta para busca literal)"
          : "Ativar busca inteligente (busca por intenção, ex: 'corrida fácil pra iniciante perto de mim')"
      }
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Busca inteligente</span>
      <span className="sm:hidden">IA</span>
    </button>
  );
}

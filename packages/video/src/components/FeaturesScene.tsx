import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../lib/theme";

export const FEATURES_DURATION = 10 * 30; // 10s at 30fps

const features = [
  {
    number: "01",
    title: "Filtros na medida certa",
    desc: "Filtre por raio de km, distância da prova, premiação e data.",
    icon: "⚡",
  },
  {
    number: "02",
    title: "Aviso antes do prazo fechar",
    desc: "Notificação quando surgir corrida nova e lembrete 3 dias antes.",
    icon: "🔔",
  },
  {
    number: "03",
    title: "Veja quem vai correr",
    desc: "Saiba quem da sua rede confirmou participação.",
    icon: "👥",
  },
  {
    number: "04",
    title: "Instala como app",
    desc: "Direto do navegador, sem App Store. Funciona igual app nativo.",
    icon: "📱",
  },
];

export function FeaturesScene() {
  const frame = useCurrentFrame();

  // Title
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Each card appears in sequence
  const cardDuration = 60; // 2s visible per card
  const cardOverlap = 20;

  // Fade out
  const fadeOut = interpolate(
    frame,
    [FEATURES_DURATION - 15, FEATURES_DURATION],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.white,
        padding: 80,
        opacity: fadeOut,
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 24,
          fontWeight: 600,
          color: theme.colors.text,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          textAlign: "center",
          marginTop: 120,
          opacity: titleOpacity,
        }}
      >
        Funcionalidades
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 56,
          fontWeight: 900,
          color: theme.colors.dark,
          textAlign: "center",
          marginTop: 24,
          marginBottom: 80,
          lineHeight: 1.2,
          opacity: titleOpacity,
        }}
      >
        Tudo que você precisa
      </div>

      {/* Feature cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          flex: 1,
          justifyContent: "center",
        }}
      >
        {features.map((feature, i) => {
          const start = 20 + i * (cardDuration - cardOverlap);
          const cardOpacity = interpolate(frame, [start, start + 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const cardY = interpolate(frame, [start, start + 15], [50, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          // Highlight effect — card border goes orange briefly
          const highlightProgress = interpolate(
            frame,
            [start + 10, start + 25, start + 50],
            [0, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                backgroundColor: theme.colors.white,
                borderRadius: 24,
                padding: "32px 40px",
                border: `2px solid`,
                borderColor: interpolateColor(highlightProgress),
                boxShadow:
                  highlightProgress > 0.1
                    ? `0 0 30px ${theme.colors.primary}20`
                    : "none",
                transform: `translateY(${cardY}px)`,
                opacity: cardOpacity,
              }}
            >
              {/* Icon container */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  backgroundColor: `${theme.colors.primary}15`,
                  border: `2px solid ${theme.colors.primary}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  flexShrink: 0,
                }}
              >
                {feature.icon}
              </div>

              <div style={{ flex: 1 }}>
                {/* Number + Title */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                  <span
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: 20,
                      fontWeight: 900,
                      color: theme.colors.text,
                      opacity: 0.4,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {feature.number}
                  </span>
                  <span
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: 34,
                      fontWeight: 700,
                      color: theme.colors.dark,
                    }}
                  >
                    {feature.title}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 28,
                    color: theme.colors.text,
                    lineHeight: 1.4,
                  }}
                >
                  {feature.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function interpolateColor(progress: number): string {
  // From gray border to orange
  if (progress <= 0) return "#E5E7EB";
  if (progress >= 1) return theme.colors.primary;
  return theme.colors.primary + Math.round(progress * 255).toString(16).padStart(2, "0");
}

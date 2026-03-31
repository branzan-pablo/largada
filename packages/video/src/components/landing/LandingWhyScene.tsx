import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  useCurrentFrame,
} from "remotion";
import { theme } from "../../lib/theme";

export const LANDING_WHY_DURATION = 150; // 5s at 30fps

const problems = [
  {
    icon: "🔍",
    title: "Corrida boa é aquela que você fica sabendo a tempo.",
    desc: "Eventos divulgados em grupos de WhatsApp, perfis de Instagram e sites de organizadores. Você precisa acompanhar tudo e ainda assim perde corrida.",
  },
  {
    icon: "⏰",
    title: "Abriu inscrição. Você ficou sabendo 1 semana depois.",
    desc: "Quando a corrida aparece no feed, o primeiro lote já fechou e o valor subiu. O Largada te avisa antes disso acontecer.",
  },
  {
    icon: "👥",
    title: "Correr com a turma é diferente de correr sozinho.",
    desc: "Antes de se inscrever, veja quem da sua rede vai. O Largada mostra quem confirmou participação sem precisar perguntar em cada grupo.",
  },
];

export function LandingWhyScene() {
  const frame = useCurrentFrame();

  // Section label
  const labelOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelY = interpolate(frame, [0, 12], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title
  const titleOpacity = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [8, 22], [25, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out
  const fadeOut = interpolate(
    frame,
    [LANDING_WHY_DURATION - 15, LANDING_WHY_DURATION],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.white,
        padding: 72,
        opacity: fadeOut,
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 22,
          fontWeight: 600,
          color: theme.colors.text,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          textAlign: "center",
          marginTop: 160,
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
        }}
      >
        Por que?
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 52,
          fontWeight: 900,
          color: theme.colors.dark,
          textAlign: "center",
          marginTop: 20,
          lineHeight: 1.2,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        Por que o Largada existe
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 28,
          color: theme.colors.text,
          textAlign: "center",
          marginTop: 16,
          opacity: titleOpacity,
        }}
      >
        Corridas espalhadas, inscrições encerradas, turma sem avisar. Sua
        familiar?
      </div>

      {/* Problem cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          marginTop: 60,
          flex: 1,
          justifyContent: "center",
        }}
      >
        {problems.map((problem, i) => {
          const start = 28 + i * 22;

          const cardOpacity = interpolate(frame, [start, start + 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const cardX = interpolate(frame, [start, start + 15], [-80, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          // Border color animation
          const borderColor = interpolateColors(
            frame,
            [start + 10, start + 30, start + 55],
            ["#E5E7EB", theme.colors.primary, "#E5E7EB"]
          );

          // Glow intensity
          const glowIntensity = interpolate(
            frame,
            [start + 15, start + 30, start + 50],
            [0, 0.35, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 24,
                backgroundColor: theme.colors.white,
                borderRadius: 24,
                padding: "28px 32px",
                border: "2px solid",
                borderColor,
                transform: `translateX(${cardX}px)`,
                opacity: cardOpacity,
                boxShadow:
                  glowIntensity > 0
                    ? `0 0 35px ${theme.colors.primary}${Math.round(glowIntensity * 255)
                        .toString(16)
                        .padStart(2, "0")}`
                    : "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              {/* Orange circle icon */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: `${theme.colors.primary}15`,
                  border: `2px solid ${theme.colors.primary}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  flexShrink: 0,
                }}
              >
                {problem.icon}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 30,
                    fontWeight: 700,
                    color: theme.colors.dark,
                    lineHeight: 1.3,
                    marginBottom: 8,
                  }}
                >
                  {problem.title}
                </div>
                <div
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 24,
                    color: theme.colors.text,
                    lineHeight: 1.4,
                  }}
                >
                  {problem.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

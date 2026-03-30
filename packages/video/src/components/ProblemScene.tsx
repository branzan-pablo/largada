import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../lib/theme";

export const PROBLEM_DURATION = 5 * 30; // 5s at 30fps

const problems = [
  { icon: "🔍", text: "Corridas espalhadas em dezenas de sites" },
  { icon: "⏰", text: "Inscrições que encerram sem você saber" },
  { icon: "👥", text: "Turma sem avisar que vai correr" },
];

export function ProblemScene() {
  const frame = useCurrentFrame();

  // Title animation
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 15], [40, 0], {
    extrapolateRight: "clamp",
  });

  // Fade out
  const fadeOut = interpolate(
    frame,
    [PROBLEM_DURATION - 15, PROBLEM_DURATION],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bgLight,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        opacity: fadeOut,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 52,
          fontWeight: 900,
          color: theme.colors.dark,
          textAlign: "center",
          marginBottom: 80,
          lineHeight: 1.2,
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
        }}
      >
        Soa familiar?
      </div>

      {/* Problem cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 32, width: "100%" }}>
        {problems.map((problem, i) => {
          const delay = 20 + i * 20;
          const cardOpacity = interpolate(frame, [delay, delay + 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const cardX = interpolate(frame, [delay, delay + 15], [-80, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 32,
                backgroundColor: theme.colors.white,
                borderRadius: 24,
                padding: "36px 48px",
                border: `2px solid #E5E7EB`,
                transform: `translateX(${cardX}px)`,
                opacity: cardOpacity,
              }}
            >
              <div style={{ fontSize: 56 }}>{problem.icon}</div>
              <div
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: 36,
                  fontWeight: 600,
                  color: theme.colors.dark,
                  lineHeight: 1.3,
                }}
              >
                {problem.text}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../../lib/theme";

export const LANDING_WHY_DURATION = 150; // 5s at 30fps

const problems = [
  {
    icon: "🔍",
    text: "Corrida boa é aquela que você fica sabendo a tempo.",
    detail:
      "Você precisa acompanhar tudo e ainda assim perde corrida.",
  },
  {
    icon: "⏰",
    text: "Abriu inscrição. Você ficou sabendo 1 semana depois.",
    detail: "O primeiro lote já fechou e o valor subiu.",
  },
  {
    icon: "👥",
    text: "Correr com a turma é diferente de correr sozinho.",
    detail:
      "Veja quem da sua rede vai sem perguntar em cada grupo.",
  },
];

export function LandingWhyScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title wipe — horizontal bar reveals text
  const titleReveal = interpolate(frame, [0, 20], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Fade out
  const fadeOut = interpolate(
    frame,
    [LANDING_WHY_DURATION - 15, LANDING_WHY_DURATION],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.dark,
        opacity: fadeOut,
        overflow: "hidden",
      }}
    >
      {/* Diagonal orange accent stripe */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -200,
          width: 600,
          height: 1200,
          background: `linear-gradient(135deg, ${theme.colors.primary}06 0%, ${theme.colors.primary}12 50%, transparent 100%)`,
          transform: "rotate(15deg)",
        }}
      />

      {/* Title area */}
      <div
        style={{
          padding: "0 72px",
          marginTop: 180,
          position: "relative",
        }}
      >
        {/* Orange bar that reveals the title */}
        <div
          style={{
            position: "absolute",
            left: 72,
            top: 0,
            width: 5,
            height: `${titleReveal}%`,
            backgroundColor: theme.colors.primary,
            borderRadius: 3,
            maxHeight: 100,
          }}
        />

        <div style={{ paddingLeft: 28 }}>
          <div
            style={{
              fontFamily: theme.fonts.body,
              fontSize: 22,
              fontWeight: 600,
              color: theme.colors.primary,
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              opacity: interpolate(frame, [5, 15], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            Por que o Largada existe
          </div>
          <div
            style={{
              fontFamily: theme.fonts.body,
              fontSize: 48,
              fontWeight: 900,
              color: theme.colors.white,
              lineHeight: 1.25,
              marginTop: 12,
              clipPath: `inset(0 ${100 - titleReveal}% 0 0)`,
            }}
          >
            Corridas espalhadas.
            <br />
            <span style={{ color: theme.colors.primary }}>Inscrições perdidas.</span>
          </div>
        </div>
      </div>

      {/* Problem strips — full-width bands from alternating sides */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          marginTop: 80,
          flex: 1,
          justifyContent: "center",
        }}
      >
        {problems.map((problem, i) => {
          const delay = 30 + i * 25;
          const fromLeft = i % 2 === 0;

          // Strip slides in
          const stripX = interpolate(
            frame,
            [delay, delay + 18],
            [fromLeft ? -1100 : 1100, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            }
          );

          // Icon spring
          const iconSpring = spring({
            frame,
            fps,
            delay: delay + 12,
            config: { damping: 8, stiffness: 150, mass: 0.5 },
          });

          // Detail text fades in after strip arrives
          const detailOpacity = interpolate(
            frame,
            [delay + 18, delay + 30],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={i}
              style={{
                transform: `translateX(${stripX}px)`,
                backgroundColor:
                  i % 2 === 0
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(255,255,255,0.06)",
                padding: "28px 72px",
                borderLeft:
                  i % 2 === 0
                    ? `4px solid ${theme.colors.primary}`
                    : "4px solid transparent",
                borderRight:
                  i % 2 !== 0
                    ? `4px solid ${theme.colors.primary}`
                    : "4px solid transparent",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  flexDirection: i % 2 === 0 ? "row" : "row-reverse",
                }}
              >
                {/* Icon with bounce */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    backgroundColor: `${theme.colors.primary}20`,
                    border: `2px solid ${theme.colors.primary}50`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    flexShrink: 0,
                    transform: `scale(${iconSpring}) rotate(${(1 - iconSpring) * 180}deg)`,
                  }}
                >
                  {problem.icon}
                </div>

                <div
                  style={{
                    flex: 1,
                    textAlign: i % 2 === 0 ? "left" : "right",
                  }}
                >
                  <div
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: 30,
                      fontWeight: 700,
                      color: theme.colors.white,
                      lineHeight: 1.3,
                    }}
                  >
                    {problem.text}
                  </div>
                  <div
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: 24,
                      color: "rgba(255,255,255,0.5)",
                      lineHeight: 1.4,
                      marginTop: 6,
                      opacity: detailOpacity,
                    }}
                  >
                    {problem.detail}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

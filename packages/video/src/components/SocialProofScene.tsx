import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolateColors,
} from "remotion";
import { theme } from "../lib/theme";

export const SOCIAL_PROOF_DURATION = 6 * 30; // 6s at 30fps

const stats = [
  { value: 500, suffix: "+", label: "corridas indexadas", icon: "🏃" },
  { value: 40, suffix: "+", label: "cidades cobertas", icon: "📍" },
  { value: 100, suffix: "%", label: "grátis pra corredores", icon: "💰" },
];

function AnimatedCounter({
  target,
  suffix,
  frame,
  startFrame,
  duration,
}: {
  target: number;
  suffix: string;
  frame: number;
  startFrame: number;
  duration: number;
}) {
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Ease out for snappy counter feel
  const eased = 1 - Math.pow(1 - progress, 3);
  const current = Math.round(eased * target);

  return (
    <span>
      {current}
      {suffix}
    </span>
  );
}

export function SocialProofScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 15], [30, 0], {
    extrapolateRight: "clamp",
  });

  // Fade out
  const fadeOut = interpolate(
    frame,
    [SOCIAL_PROOF_DURATION - 15, SOCIAL_PROOF_DURATION],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.dark,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        opacity: fadeOut,
      }}
    >
      {/* Background accent */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, ${theme.colors.primary}12 0%, transparent 55%)`,
        }}
      />

      {/* Title */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 28,
          fontWeight: 600,
          color: theme.colors.text,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          textAlign: "center",
          marginBottom: 80,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          position: "relative",
        }}
      >
        Por que o Largada?
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 56,
          width: "100%",
          position: "relative",
        }}
      >
        {stats.map((stat, i) => {
          const statStart = 15 + i * 25;
          const statSpring = spring({
            frame: frame - statStart,
            fps,
            config: { damping: 12, stiffness: 80 },
          });
          const statOpacity = interpolate(
            frame,
            [statStart, statStart + 12],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // Glow pulse on the number
          const glowIntensity = interpolate(
            frame,
            [statStart + 30, statStart + 50, statStart + 70],
            [0, 0.3, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // Border color animation
          const borderColor = interpolateColors(
            frame,
            [statStart, statStart + 30, statStart + 60],
            ["rgba(255,255,255,0.08)", theme.colors.primary, "rgba(255,255,255,0.08)"]
          );

          return (
            <div
              key={stat.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 32,
                backgroundColor: "rgba(255,255,255,0.03)",
                borderRadius: 28,
                padding: "36px 44px",
                border: `2px solid`,
                borderColor,
                opacity: statOpacity,
                transform: `scale(${statSpring})`,
                boxShadow:
                  glowIntensity > 0
                    ? `0 0 40px ${theme.colors.primary}${Math.round(glowIntensity * 255).toString(16).padStart(2, "0")}`
                    : "none",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  backgroundColor: `${theme.colors.primary}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                  flexShrink: 0,
                }}
              >
                {stat.icon}
              </div>

              {/* Number + Label */}
              <div>
                <div
                  style={{
                    fontFamily: theme.fonts.logo,
                    fontSize: 72,
                    color: theme.colors.primary,
                    lineHeight: 1,
                    marginBottom: 4,
                  }}
                >
                  <AnimatedCounter
                    target={stat.value}
                    suffix={stat.suffix}
                    frame={frame}
                    startFrame={statStart}
                    duration={35}
                  />
                </div>
                <div
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 28,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.7)",
                    lineHeight: 1.2,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

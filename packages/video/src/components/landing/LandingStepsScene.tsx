import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../../lib/theme";

export const LANDING_STEPS_DURATION = 135; // 4.5s at 30fps

const steps = [
  {
    number: "1",
    title: "Crie sua conta",
    desc: "Cadastre com email, Google ou Strava. Selecione sua cidade e o quanto você topa viajar para uma prova.",
  },
  {
    number: "2",
    title: "Encontre sua próxima prova",
    desc: "Use os filtros para achar provas na distância certa, com o nível de premiação que você quer ser visto por dezenas de irrelevantes.",
  },
  {
    number: "3",
    title: "Marque e deixa com a gente",
    desc: 'Clique em "Vou Nessa", veja quem da sua rede também vai correr e deixa o Largada te avisar quando o prazo de inscrição estiver chegando.',
  },
];

const STEP_SPACING = 280;
const CIRCLE_SIZE = 56;
const LINE_HEIGHT_PX = STEP_SPACING - CIRCLE_SIZE - 24;

export function LandingStepsScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 15], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out
  const fadeOut = interpolate(
    frame,
    [LANDING_STEPS_DURATION - 15, LANDING_STEPS_DURATION],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const stepStarts = [18, 43, 68];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.dark,
        padding: "80px 72px",
        opacity: fadeOut,
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, ${theme.colors.primary}10 0%, transparent 55%)`,
        }}
      />

      {/* Title area */}
      <div
        style={{
          textAlign: "center",
          marginTop: 140,
          marginBottom: 60,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 48,
            fontWeight: 900,
            color: theme.colors.white,
            lineHeight: 1.3,
          }}
        >
          Três minutos. Uma conta.
        </div>
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 48,
            fontWeight: 900,
            color: theme.colors.primary,
            lineHeight: 1.3,
          }}
        >
          Nenhuma corrida perdida.
        </div>
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 26,
            color: theme.colors.text,
            marginTop: 16,
          }}
        >
          Sem tutorial, sem configuração complicada.
        </div>
      </div>

      {/* Steps */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          position: "relative",
          flex: 1,
          justifyContent: "center",
        }}
      >
        {steps.map((step, i) => {
          const start = stepStarts[i];

          // Circle spring
          const circleSpring = spring({
            frame: frame - start,
            fps,
            config: { damping: 12, stiffness: 100 },
          });
          const circleOpacity = interpolate(
            frame,
            [start, start + 10],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // Text slide
          const textOpacity = interpolate(
            frame,
            [start + 5, start + 18],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const textX = interpolate(
            frame,
            [start + 5, start + 18],
            [-40, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // Connecting line grows (not for last step)
          const lineHeight =
            i < steps.length - 1
              ? interpolate(
                  frame,
                  [start + 12, start + 30],
                  [0, LINE_HEIGHT_PX],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                )
              : 0;

          // Check flash after all steps
          const flashStart = 95 + i * 10;
          const flashScale = interpolate(
            frame,
            [flashStart, flashStart + 6, flashStart + 12],
            [1, 1.18, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 28,
                marginBottom: i < steps.length - 1 ? 40 : 0,
                position: "relative",
              }}
            >
              {/* Circle + connecting line */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                {/* Numbered circle */}
                <div
                  style={{
                    width: CIRCLE_SIZE,
                    height: CIRCLE_SIZE,
                    borderRadius: "50%",
                    backgroundColor: `${theme.colors.primary}20`,
                    border: `2px solid ${theme.colors.primary}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: theme.fonts.logo,
                    fontSize: 28,
                    color: theme.colors.primary,
                    opacity: circleOpacity,
                    transform: `scale(${circleSpring * flashScale})`,
                    boxShadow:
                      flashScale > 1.05
                        ? `0 0 20px ${theme.colors.primary}60`
                        : "none",
                  }}
                >
                  {step.number}
                </div>

                {/* Connecting line */}
                {i < steps.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      height: lineHeight,
                      backgroundColor: `${theme.colors.primary}30`,
                      marginTop: 8,
                    }}
                  />
                )}
              </div>

              {/* Text content */}
              <div
                style={{
                  opacity: textOpacity,
                  transform: `translateX(${textX}px)`,
                  paddingTop: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 32,
                    fontWeight: 700,
                    color: theme.colors.white,
                    lineHeight: 1.2,
                    marginBottom: 8,
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 24,
                    color: "rgba(255,255,255,0.6)",
                    lineHeight: 1.4,
                  }}
                >
                  {step.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

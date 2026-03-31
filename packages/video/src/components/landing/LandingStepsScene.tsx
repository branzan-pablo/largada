import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../../lib/theme";

export const LANDING_STEPS_DURATION = 135; // 4.5s at 30fps

const steps = [
  { title: "Crie sua conta", desc: "Rápido, grátis, sem cartão de crédito." },
  {
    title: "Encontre sua prova",
    desc: "Filtre por distância, data e localização.",
  },
  {
    title: "Marque e deixa com a gente",
    desc: "Lembrete antes do prazo de inscrição fechar.",
  },
];

// Animated progress road config
const ROAD_WIDTH = 800;
const NODE_SIZE = 60;

export function LandingStepsScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 90, mass: 0.8 },
  });
  const titleOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Road fill progress — left to right
  const roadFill = interpolate(frame, [18, 95], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Fade out
  const fadeOut = interpolate(
    frame,
    [LANDING_STEPS_DURATION - 15, LANDING_STEPS_DURATION],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    }
  );

  const stepActivationFrames = [25, 52, 78];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.dark,
        padding: "80px 60px",
        opacity: fadeOut,
        overflow: "hidden",
      }}
    >
      {/* Background accent */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 65%, ${theme.colors.primary}0A 0%, transparent 60%)`,
        }}
      />

      {/* Title */}
      <div
        style={{
          textAlign: "center",
          marginTop: 120,
          opacity: titleOpacity,
          transform: `scale(${titleSpring})`,
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 46,
            fontWeight: 900,
            color: theme.colors.white,
            lineHeight: 1.3,
          }}
        >
          Três minutos.
          <br />
          Uma conta.
        </div>
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 46,
            fontWeight: 900,
            color: theme.colors.primary,
            lineHeight: 1.3,
          }}
        >
          Nenhuma corrida perdida.
        </div>
      </div>

      {/* Horizontal progress road */}
      <div
        style={{
          position: "relative",
          marginTop: 100,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Road track background */}
        <div
          style={{
            width: ROAD_WIDTH,
            height: 6,
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 3,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Orange fill */}
          <div
            style={{
              width: `${roadFill}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.primary}CC)`,
              borderRadius: 3,
              boxShadow: `0 0 20px ${theme.colors.primary}40`,
            }}
          />
        </div>

        {/* Step nodes along the road */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: ROAD_WIDTH,
            marginTop: -33,
            position: "relative",
          }}
        >
          {steps.map((step, i) => {
            const activationFrame = stepActivationFrames[i];
            const isActive = roadFill >= ((i + 0.3) / 3) * 100;

            // Node spring — number flips with 3D rotateX
            const nodeSpring = spring({
              frame,
              fps,
              delay: activationFrame,
              config: { damping: 10, stiffness: 120, mass: 0.6 },
            });

            // 3D flip
            const flipAngle = interpolate(nodeSpring, [0, 1], [90, 0]);

            // Text appears below
            const textOpacity = interpolate(
              frame,
              [activationFrame + 8, activationFrame + 20],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const textY = interpolate(
              frame,
              [activationFrame + 8, activationFrame + 20],
              [15, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              }
            );

            // Pulse ring when activated
            const pulseRing = interpolate(
              frame,
              [
                activationFrame + 5,
                activationFrame + 20,
                activationFrame + 35,
              ],
              [0, 1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 260,
                }}
              >
                {/* Pulse ring */}
                <div
                  style={{
                    position: "absolute",
                    width: NODE_SIZE + 30,
                    height: NODE_SIZE + 30,
                    borderRadius: "50%",
                    border: `2px solid ${theme.colors.primary}`,
                    transform: `scale(${1 + pulseRing * 0.5})`,
                    opacity: pulseRing * 0.5,
                    marginTop: -15,
                  }}
                />

                {/* Node circle — 3D flip */}
                <div
                  style={{
                    width: NODE_SIZE,
                    height: NODE_SIZE,
                    borderRadius: "50%",
                    backgroundColor: isActive
                      ? theme.colors.primary
                      : "rgba(255,255,255,0.08)",
                    border: `3px solid ${isActive ? theme.colors.primary : "rgba(255,255,255,0.15)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `perspective(200px) rotateX(${flipAngle}deg)`,
                    boxShadow: isActive
                      ? `0 0 20px ${theme.colors.primary}50`
                      : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: theme.fonts.logo,
                      fontSize: 28,
                      color: isActive
                        ? theme.colors.white
                        : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {i + 1}
                  </span>
                </div>

                {/* Step text below */}
                <div
                  style={{
                    marginTop: 20,
                    textAlign: "center",
                    opacity: textOpacity,
                    transform: `translateY(${textY}px)`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: 26,
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
                      fontSize: 22,
                      color: "rgba(255,255,255,0.5)",
                      lineHeight: 1.3,
                    }}
                  >
                    {step.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

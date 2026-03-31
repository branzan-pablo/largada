import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../../lib/theme";

export const LANDING_FEATURES_DURATION = 180; // 6s at 30fps

const features = [
  { icon: "⚡", title: "Filtros na medida certa", angle: -60 },
  { icon: "🎯", title: "Só corridas que valem", angle: -20 },
  { icon: "🔎", title: "Busca direta", angle: 20 },
  { icon: "📋", title: "Informação completa", angle: 60 },
  { icon: "🔔", title: "Aviso antes do prazo", angle: 100 },
  { icon: "📱", title: "Instala como app", angle: 140, highlighted: true },
];

// Phone mockup dimensions
const PHONE_W = 340;
const PHONE_H = 680;

export function LandingFeaturesScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone slides up with perspective tilt
  const phoneSpring = spring({
    frame,
    fps,
    delay: 5,
    config: { damping: 12, stiffness: 60, mass: 1.2 },
  });

  // Title
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleScale = interpolate(frame, [0, 15], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Feature orbit rotation
  const orbitRotation = interpolate(frame, [40, 170], [0, 15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Fade out
  const fadeOut = interpolate(
    frame,
    [LANDING_FEATURES_DURATION - 15, LANDING_FEATURES_DURATION],
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
      {/* Background grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle, ${theme.colors.primary}08 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          opacity: 0.5,
        }}
      />

      {/* Title */}
      <div
        style={{
          textAlign: "center",
          marginTop: 100,
          padding: "0 60px",
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 20,
            fontWeight: 600,
            color: theme.colors.primary,
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            marginBottom: 12,
          }}
        >
          Funcionalidades
        </div>
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 44,
            fontWeight: 900,
            color: theme.colors.white,
            lineHeight: 1.25,
          }}
        >
          Tudo que você precisa
        </div>
      </div>

      {/* Central phone mockup */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -45%) translateY(${(1 - phoneSpring) * 300}px)`,
          opacity: phoneSpring,
        }}
      >
        {/* Phone frame */}
        <div
          style={{
            width: PHONE_W,
            height: PHONE_H,
            borderRadius: 40,
            border: `2px solid rgba(255,255,255,0.12)`,
            backgroundColor: "#111827",
            overflow: "hidden",
            boxShadow: `0 0 80px ${theme.colors.primary}15, 0 30px 60px rgba(0,0,0,0.4)`,
          }}
        >
          {/* Notch */}
          <div
            style={{
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 8,
            }}
          >
            <div
              style={{
                width: 100,
                height: 26,
                backgroundColor: "#000",
                borderRadius: 13,
              }}
            />
          </div>

          {/* App header */}
          <div
            style={{
              padding: "10px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                fontFamily: theme.fonts.logo,
                fontSize: 24,
                color: theme.colors.primary,
              }}
            >
              LARGADA
            </div>
          </div>

          {/* Placeholder content lines */}
          {[0, 1, 2, 3, 4, 5].map((j) => (
            <div
              key={j}
              style={{
                margin: "12px 20px",
                height: j % 3 === 0 ? 60 : 40,
                backgroundColor: "rgba(255,255,255,0.04)",
                borderRadius: 12,
              }}
            />
          ))}
        </div>

        {/* Feature items radiating around phone */}
        {features.map((feat, i) => {
          const delay = 30 + i * 12;
          const featSpring = spring({
            frame,
            fps,
            delay,
            config: { damping: 11, stiffness: 90, mass: 0.7 },
          });

          const isHL = !!feat.highlighted;

          // Position around phone — using angle
          const angleRad =
            ((feat.angle + orbitRotation) * Math.PI) / 180;
          const radiusX = PHONE_W / 2 + 140;
          const radiusY = PHONE_H / 2 - 60;
          const x = Math.cos(angleRad) * radiusX;
          const y = Math.sin(angleRad) * radiusY * 0.7;

          // Connecting line
          const lineLength = Math.sqrt(x * x + y * y) - 40;
          const lineAngle = Math.atan2(y, x) * (180 / Math.PI);

          // Glow pulse for highlighted
          const hlPulse = isHL
            ? 1 +
              0.08 *
                Math.sin(((Math.max(0, frame - delay - 20)) / 25) * Math.PI * 2)
            : 1;

          return (
            <div key={i}>
              {/* Connecting line */}
              <div
                style={{
                  position: "absolute",
                  left: PHONE_W / 2,
                  top: PHONE_H / 2 - 20,
                  width: lineLength,
                  height: 1,
                  backgroundColor: isHL
                    ? `${theme.colors.primary}60`
                    : "rgba(255,255,255,0.08)",
                  transform: `rotate(${lineAngle}deg)`,
                  transformOrigin: "0 50%",
                  opacity: featSpring * 0.7,
                }}
              />

              {/* Feature bubble */}
              <div
                style={{
                  position: "absolute",
                  left: PHONE_W / 2 + x - 65,
                  top: PHONE_H / 2 - 20 + y - 35,
                  width: 130,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  opacity: featSpring,
                  transform: `scale(${featSpring * hlPulse})`,
                }}
              >
                {/* Icon circle */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    backgroundColor: isHL
                      ? theme.colors.primary
                      : `${theme.colors.primary}20`,
                    border: `2px solid ${isHL ? theme.colors.primaryHover : theme.colors.primary + "40"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    boxShadow: isHL
                      ? `0 0 25px ${theme.colors.primary}60`
                      : "none",
                  }}
                >
                  {feat.icon}
                </div>

                {/* Label */}
                <div
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 18,
                    fontWeight: 700,
                    color: isHL ? theme.colors.primary : theme.colors.white,
                    textAlign: "center",
                    lineHeight: 1.2,
                  }}
                >
                  {feat.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

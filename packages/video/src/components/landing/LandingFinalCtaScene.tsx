import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { theme } from "../../lib/theme";

export const LANDING_FINAL_CTA_DURATION = 120; // 4s at 30fps

// Concentric ring config
const RINGS = [
  { radius: 100, delay: 0, width: 3 },
  { radius: 180, delay: 4, width: 2 },
  { radius: 280, delay: 8, width: 2 },
  { radius: 400, delay: 12, width: 1 },
  { radius: 540, delay: 16, width: 1 },
];

export function LandingFinalCtaScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Headline — dramatic scale-up
  const headlineScale = interpolate(frame, [5, 22], [3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const headlineOpacity = interpolate(frame, [5, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle
  const subOpacity = interpolate(frame, [22, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [22, 32], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Buttons spring in
  const btn1Spring = spring({
    frame,
    fps,
    delay: 32,
    config: { damping: 10, stiffness: 80 },
  });
  const btn2Spring = spring({
    frame,
    fps,
    delay: 38,
    config: { damping: 12, stiffness: 80 },
  });

  // Continuous pulse
  const btnPulse =
    frame > 45
      ? 1 + 0.03 * Math.sin(((frame - 45) / 25) * Math.PI * 2)
      : 1;

  // Logo implodes into center
  const logoDelay = 55;
  const logoSpring = spring({
    frame,
    fps,
    delay: logoDelay,
    config: { damping: 12, stiffness: 80, mass: 0.8 },
  });
  const logoRotation = interpolate(logoSpring, [0, 1], [180, 0]);

  // URL
  const urlOpacity = interpolate(frame, [68, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Background breathing
  const breathe = 1 + 0.03 * Math.sin((frame / 40) * Math.PI * 2);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.dark,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Concentric orange rings pulsing outward */}
      {RINGS.map((ring, i) => {
        const ringProgress = interpolate(
          frame,
          [ring.delay, ring.delay + 20, ring.delay + 50],
          [0, 0.6, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const ringScale = interpolate(
          frame,
          [ring.delay, ring.delay + 50],
          [0.5, 1.2],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "40%",
              width: ring.radius * 2,
              height: ring.radius * 2,
              marginLeft: -ring.radius,
              marginTop: -ring.radius,
              borderRadius: "50%",
              border: `${ring.width}px solid ${theme.colors.primary}`,
              opacity: ringProgress,
              transform: `scale(${ringScale * breathe})`,
            }}
          />
        );
      })}

      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, ${theme.colors.primary}18 0%, transparent 45%)`,
          transform: `scale(${breathe})`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          position: "relative",
          padding: "0 60px",
        }}
      >
        {/* Headline — zoom in */}
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 62,
            fontWeight: 900,
            color: theme.colors.white,
            textAlign: "center",
            lineHeight: 1.2,
            opacity: headlineOpacity,
            transform: `scale(${headlineScale})`,
          }}
        >
          Pronto para a
          <br />
          <span
            style={{
              color: theme.colors.primary,
              textShadow: `0 0 40px ${theme.colors.primary}30`,
            }}
          >
            largada
          </span>
          ?
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 28,
            color: theme.colors.text,
            textAlign: "center",
            lineHeight: 1.4,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            marginTop: 8,
          }}
        >
          Crie sua conta em menos de 2 minutos.
          <br />
          Gratuito. Sem cartão. Sem pegadinha.
        </div>

        {/* CTA Buttons */}
        <div
          style={{
            display: "flex",
            gap: 18,
            marginTop: 36,
          }}
        >
          <div
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.white,
              fontFamily: theme.fonts.body,
              fontSize: 32,
              fontWeight: 700,
              padding: "22px 50px",
              borderRadius: 100,
              transform: `scale(${btn1Spring * btnPulse})`,
              opacity: btn1Spring,
              boxShadow: `0 0 50px ${theme.colors.primary}45`,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            🏃 Ver corridas
          </div>
          <div
            style={{
              border: "2px solid rgba(255,255,255,0.5)",
              color: theme.colors.white,
              fontFamily: theme.fonts.body,
              fontSize: 32,
              fontWeight: 700,
              padding: "22px 50px",
              borderRadius: 100,
              transform: `scale(${btn2Spring})`,
              opacity: btn2Spring,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            📋 Sugerir Evento
          </div>
        </div>

        {/* Logo — spins in */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            marginTop: 70,
            opacity: logoSpring,
            transform: `rotate(${logoRotation}deg) scale(${logoSpring})`,
          }}
        >
          <Img
            src={staticFile("logo_120.png")}
            style={{ width: 75, height: 75 }}
          />
          <div
            style={{
              fontFamily: theme.fonts.logo,
              fontSize: 44,
              color: theme.colors.white,
              letterSpacing: "0.05em",
              lineHeight: 1,
              transform: `rotate(${-logoRotation}deg)`,
            }}
          >
            LARGADA
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 26,
            fontWeight: 600,
            color: theme.colors.primary,
            opacity: urlOpacity,
            letterSpacing: "0.06em",
            marginTop: 8,
          }}
        >
          largadas.com.br
        </div>
      </div>
    </AbsoluteFill>
  );
}

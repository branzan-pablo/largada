import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { theme } from "../../lib/theme";

export const LANDING_FINAL_CTA_DURATION = 120; // 4s at 30fps

export function LandingFinalCtaScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Headline spring
  const headlineSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });
  const headlineOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle
  const subOpacity = interpolate(frame, [18, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Orange CTA button
  const btn1Spring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 10, stiffness: 80 },
  });
  const btn1Opacity = interpolate(frame, [30, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // White outline button
  const btn2Opacity = interpolate(frame, [38, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Continuous pulse on orange button
  const btnPulse =
    frame > 45
      ? 1 + 0.03 * Math.sin(((frame - 45) / 30) * Math.PI * 2)
      : 1;

  // Logo
  const logoOpacity = interpolate(frame, [55, 68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoY = interpolate(frame, [55, 68], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // URL
  const urlOpacity = interpolate(frame, [65, 78], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulsing glow on background
  const bgGlow =
    frame > 10
      ? 1 + 0.04 * Math.sin(((frame - 10) / 50) * Math.PI * 2)
      : 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.dark,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, ${theme.colors.primary}20 0%, transparent 50%)`,
          transform: `scale(${bgGlow})`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          position: "relative",
        }}
      >
        {/* Headline */}
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 64,
            fontWeight: 900,
            color: theme.colors.white,
            textAlign: "center",
            lineHeight: 1.2,
            opacity: headlineOpacity,
            transform: `scale(${headlineSpring})`,
          }}
        >
          Pronto para a{" "}
          <span style={{ color: theme.colors.primary }}>largada</span>?
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 30,
            color: theme.colors.text,
            textAlign: "center",
            lineHeight: 1.4,
            opacity: subOpacity,
            marginTop: 8,
          }}
        >
          Crie sua conta em menos de 2 minutos. Gratuito.
          <br />
          Sem cartão de crédito. Sem pegadinha.
        </div>

        {/* CTA Buttons */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 40,
            alignItems: "center",
          }}
        >
          {/* Orange button */}
          <div
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.white,
              fontFamily: theme.fonts.body,
              fontSize: 34,
              fontWeight: 700,
              padding: "24px 56px",
              borderRadius: 100,
              opacity: btn1Opacity,
              transform: `scale(${btn1Spring * btnPulse})`,
              boxShadow: `0 0 50px ${theme.colors.primary}50`,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 28 }}>🏃</span>
            Ver corridas
          </div>

          {/* White outline button */}
          <div
            style={{
              border: "2px solid rgba(255,255,255,0.6)",
              color: theme.colors.white,
              fontFamily: theme.fonts.body,
              fontSize: 34,
              fontWeight: 700,
              padding: "24px 56px",
              borderRadius: 100,
              opacity: btn2Opacity,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 28 }}>📋</span>
            Sugerir Evento
          </div>
        </div>

        {/* Logo + brand at bottom */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            marginTop: 80,
            opacity: logoOpacity,
            transform: `translateY(${logoY}px)`,
          }}
        >
          <Img
            src={staticFile("logo_120.png")}
            style={{
              width: 80,
              height: 80,
            }}
          />
          <div
            style={{
              fontFamily: theme.fonts.logo,
              fontSize: 48,
              color: theme.colors.white,
              letterSpacing: "0.05em",
              lineHeight: 1,
            }}
          >
            LARGADA
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 28,
            fontWeight: 600,
            color: theme.colors.primary,
            opacity: urlOpacity,
            letterSpacing: "0.05em",
            marginTop: 8,
          }}
        >
          largadas.com.br
        </div>
      </div>
    </AbsoluteFill>
  );
}

import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  staticFile,
} from "remotion";
import { theme } from "../lib/theme";

export const CTA_DURATION = 7 * 30; // 7s at 30fps

export function CtaScene() {
  const frame = useCurrentFrame();

  // Headline
  const headlineOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineY = interpolate(frame, [5, 20], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtext
  const subOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Button
  const btnOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const btnScale = interpolate(frame, [40, 55], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Button pulse
  const pulse = interpolate(
    frame,
    [60, 75, 90, 105, 120, 135, 150, 165, 180, 195],
    [1, 1.04, 1, 1.04, 1, 1.04, 1, 1.04, 1, 1.04],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Logo at bottom
  const logoOpacity = interpolate(frame, [55, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.dark,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      {/* Gradient accent */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 60%, ${theme.colors.primary}20 0%, transparent 50%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
          position: "relative",
        }}
      >
        {/* Headline */}
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 72,
            fontWeight: 900,
            color: theme.colors.white,
            textAlign: "center",
            lineHeight: 1.15,
            transform: `translateY(${headlineY}px)`,
            opacity: headlineOpacity,
          }}
        >
          Pronto para a{" "}
          <span style={{ color: theme.colors.primary }}>largada</span>?
        </div>

        {/* Subtext */}
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 36,
            color: theme.colors.text,
            textAlign: "center",
            opacity: subOpacity,
            lineHeight: 1.4,
          }}
        >
          Crie sua conta grátis.
          <br />
          Sem cartão. Sem pegadinha.
        </div>

        {/* CTA Button */}
        <div
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.white,
            fontFamily: theme.fonts.body,
            fontSize: 38,
            fontWeight: 700,
            padding: "28px 72px",
            borderRadius: 100,
            opacity: btnOpacity,
            transform: `scale(${btnScale * pulse})`,
          }}
        >
          Criar conta grátis
        </div>

        {/* Logo + URL */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            marginTop: 60,
            opacity: logoOpacity,
          }}
        >
          <Img
            src={staticFile("logo_120.png")}
            style={{ width: 80, height: 80 }}
          />
          <div
            style={{
              fontFamily: theme.fonts.logo,
              fontSize: 48,
              color: theme.colors.white,
              letterSpacing: "0.05em",
            }}
          >
            LARGADA
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

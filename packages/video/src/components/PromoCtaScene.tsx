import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { theme } from "../lib/theme";

export const PROMO_CTA_DURATION = 10 * 30; // 10s at 30fps

export function PromoCtaScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo bounce in
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  // Brand name
  const brandOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const brandY = interpolate(frame, [15, 30], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tagline
  const taglineOpacity = interpolate(frame, [35, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Divider
  const dividerWidth = interpolate(frame, [50, 65], [0, 300], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Headline
  const headlineOpacity = interpolate(frame, [60, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineY = interpolate(frame, [60, 75], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtext
  const subOpacity = interpolate(frame, [80, 95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // CTA Button with spring
  const btnSpring = spring({
    frame: frame - 100,
    fps,
    config: { damping: 10, stiffness: 80 },
  });
  const btnOpacity = interpolate(frame, [100, 112], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Button pulse (continuous after appearing)
  const pulse =
    frame > 120
      ? 1 + 0.03 * Math.sin(((frame - 120) / 30) * Math.PI * 2)
      : 1;

  // URL text
  const urlOpacity = interpolate(frame, [120, 135], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Glow ring behind logo — pulsing
  const glowScale =
    frame > 5 ? 1 + 0.05 * Math.sin(((frame - 5) / 45) * Math.PI * 2) : 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.dark,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 35%, ${theme.colors.primary}15 0%, transparent 50%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          position: "relative",
        }}
      >
        {/* Glow ring behind logo */}
        <div
          style={{
            position: "absolute",
            top: -40,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.colors.primary}20 0%, transparent 70%)`,
            transform: `scale(${glowScale})`,
          }}
        />

        {/* Logo */}
        <Img
          src={staticFile("logo_120.png")}
          style={{
            width: 160,
            height: 160,
            transform: `scale(${logoScale})`,
            position: "relative",
          }}
        />

        {/* Brand name */}
        <div
          style={{
            fontFamily: theme.fonts.logo,
            fontSize: 100,
            color: theme.colors.white,
            letterSpacing: "0.05em",
            lineHeight: 1,
            opacity: brandOpacity,
            transform: `translateY(${brandY}px)`,
          }}
        >
          LARGADA
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 30,
            color: theme.colors.text,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            opacity: taglineOpacity,
          }}
        >
          Corridas de rua
        </div>

        {/* Divider */}
        <div
          style={{
            width: dividerWidth,
            height: 2,
            backgroundColor: `${theme.colors.primary}40`,
            marginTop: 32,
            marginBottom: 32,
            borderRadius: 1,
          }}
        />

        {/* Headline */}
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 56,
            fontWeight: 900,
            color: theme.colors.white,
            textAlign: "center",
            lineHeight: 1.2,
            opacity: headlineOpacity,
            transform: `translateY(${headlineY}px)`,
          }}
        >
          Pronto pra próxima{" "}
          <span style={{ color: theme.colors.primary }}>corrida</span>?
        </div>

        {/* Subtext */}
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 32,
            color: theme.colors.text,
            textAlign: "center",
            lineHeight: 1.4,
            opacity: subOpacity,
            marginTop: 8,
          }}
        >
          Crie sua conta grátis.
          <br />
          Sem cartão. Sem pegadinha.
        </div>

        {/* CTA Button */}
        <div
          style={{
            marginTop: 32,
            backgroundColor: theme.colors.primary,
            color: theme.colors.white,
            fontFamily: theme.fonts.body,
            fontSize: 40,
            fontWeight: 700,
            padding: "28px 72px",
            borderRadius: 100,
            opacity: btnOpacity,
            transform: `scale(${btnSpring * pulse})`,
            boxShadow: `0 0 40px ${theme.colors.primary}40`,
          }}
        >
          Criar conta grátis
        </div>

        {/* URL */}
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 28,
            fontWeight: 600,
            color: theme.colors.primary,
            opacity: urlOpacity,
            marginTop: 16,
            letterSpacing: "0.05em",
          }}
        >
          largadas.com.br
        </div>
      </div>
    </AbsoluteFill>
  );
}

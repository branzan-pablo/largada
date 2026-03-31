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

export const LANDING_LOGO_DURATION = 75; // 2.5s at 30fps

export function LandingLogoScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo spring scale-in
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 80 },
  });

  // Pulsing glow ring behind logo
  const glowScale =
    frame > 5 ? 1 + 0.06 * Math.sin(((frame - 5) / 40) * Math.PI * 2) : 1;

  // "LARGADA" text slides up
  const brandOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const brandY = interpolate(frame, [10, 25], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tagline "Corridas de Rua"
  const taglineOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [20, 35], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Orange divider grows
  const dividerWidth = interpolate(frame, [25, 42], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out
  const fadeOut = interpolate(frame, [60, 75], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.dark,
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, ${theme.colors.primary}18 0%, transparent 55%)`,
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
        {/* Glow ring behind logo */}
        <div
          style={{
            position: "absolute",
            top: -50,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${theme.colors.primary}22 0%, transparent 70%)`,
            transform: `scale(${glowScale})`,
          }}
        />

        {/* Logo */}
        <Img
          src={staticFile("logo_120.png")}
          style={{
            width: 180,
            height: 180,
            transform: `scale(${logoScale})`,
            position: "relative",
          }}
        />

        {/* Brand name */}
        <div
          style={{
            fontFamily: theme.fonts.logo,
            fontSize: 120,
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
            fontSize: 28,
            fontWeight: 600,
            color: theme.colors.text,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          Corridas de Rua
        </div>

        {/* Divider */}
        <div
          style={{
            width: dividerWidth,
            height: 3,
            backgroundColor: `${theme.colors.primary}60`,
            marginTop: 16,
            borderRadius: 2,
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

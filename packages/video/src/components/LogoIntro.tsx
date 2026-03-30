import { AbsoluteFill, Img, interpolate, useCurrentFrame, staticFile } from "remotion";
import { theme } from "../lib/theme";

export const LOGO_INTRO_DURATION = 3 * 30; // 3s at 30fps

export function LogoIntro() {
  const frame = useCurrentFrame();

  // Logo scale: bounces in from 0 to 1
  const logoScale = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const logoOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Text slides up and fades in after logo
  const textY = interpolate(frame, [15, 35], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tagline fades in last
  const taglineOpacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineY = interpolate(frame, [35, 55], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out at the end
  const fadeOut = interpolate(frame, [LOGO_INTRO_DURATION - 15, LOGO_INTRO_DURATION], [1, 0], {
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
      {/* Subtle gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 40%, ${theme.colors.primary}15 0%, transparent 60%)`,
        }}
      />

      {/* Logo */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <Img
          src={staticFile("logo_120.png")}
          style={{
            width: 180,
            height: 180,
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
          }}
        />

        {/* LARGADA text */}
        <div
          style={{
            fontFamily: theme.fonts.logo,
            fontSize: 120,
            color: theme.colors.white,
            letterSpacing: "0.05em",
            transform: `translateY(${textY}px)`,
            opacity: textOpacity,
            lineHeight: 1,
          }}
        >
          LARGADA
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 36,
            color: theme.colors.text,
            transform: `translateY(${taglineY}px)`,
            opacity: taglineOpacity,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Corridas de Rua
        </div>
      </div>
    </AbsoluteFill>
  );
}

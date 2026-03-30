import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  staticFile,
} from "remotion";
import { theme } from "../lib/theme";

export const HERO_DURATION = 5 * 30; // 5s at 30fps

export function HeroScene() {
  const frame = useCurrentFrame();

  // Ken Burns effect on background
  const bgScale = interpolate(frame, [0, HERO_DURATION], [1, 1.1], {
    extrapolateRight: "clamp",
  });

  // "Vai ter corrida." slides in
  const line1Opacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line1Y = interpolate(frame, [10, 25], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "Você vai ficar sabendo." slides in (orange)
  const line2Opacity = interpolate(frame, [35, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line2Y = interpolate(frame, [35, 55], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtle pulse on orange text
  const pulse = interpolate(frame, [55, 70, 85], [1, 1.03, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out
  const fadeOut = interpolate(
    frame,
    [HERO_DURATION - 15, HERO_DURATION],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {/* Background image with Ken Burns */}
      <Img
        src={staticFile("background-hero.jpg")}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${bgScale})`,
        }}
      />

      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.55)",
        }}
      />

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent, rgba(0,0,0,0.6))",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          padding: 80,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.logo,
            fontSize: 110,
            color: theme.colors.white,
            letterSpacing: "0.02em",
            lineHeight: 1.1,
            transform: `translateY(${line1Y}px)`,
            opacity: line1Opacity,
            textShadow: "0 4px 30px rgba(0,0,0,0.8)",
          }}
        >
          Vai ter corrida.
        </div>

        <div
          style={{
            fontFamily: theme.fonts.logo,
            fontSize: 110,
            color: theme.colors.primary,
            letterSpacing: "0.02em",
            lineHeight: 1.1,
            marginTop: 16,
            transform: `translateY(${line2Y}px) scale(${pulse})`,
            opacity: line2Opacity,
            textShadow: "0 4px 30px rgba(0,0,0,0.8)",
          }}
        >
          Você vai ficar sabendo.
        </div>
      </div>
    </AbsoluteFill>
  );
}

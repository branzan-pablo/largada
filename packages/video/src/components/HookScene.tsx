import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../lib/theme";

export const HOOK_DURATION = 4 * 30; // 4s at 30fps

export function HookScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Line 1: "Você é" — spring bounce
  const line1Scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  // Line 2: "corredor de rua?" — spring with delay
  const line2Scale = spring({
    frame: frame - 12,
    fps,
    config: { damping: 12, stiffness: 80 },
  });
  const line2Opacity = interpolate(frame, [12, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Divider line grows
  const dividerWidth = interpolate(frame, [35, 50], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Impact line: "Então para de perder inscrição."
  const impactOpacity = interpolate(frame, [45, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const impactY = interpolate(frame, [45, 60], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out
  const fadeOut = interpolate(
    frame,
    [HOOK_DURATION - 15, HOOK_DURATION],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.dark,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        opacity: fadeOut,
      }}
    >
      {/* Accent glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 40%, ${theme.colors.primary}18 0%, transparent 55%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          position: "relative",
        }}
      >
        {/* "Você é" */}
        <div
          style={{
            fontFamily: theme.fonts.logo,
            fontSize: 84,
            color: theme.colors.white,
            letterSpacing: "0.03em",
            transform: `scale(${line1Scale})`,
            lineHeight: 1,
          }}
        >
          Você é
        </div>

        {/* "corredor de rua?" */}
        <div
          style={{
            fontFamily: theme.fonts.logo,
            fontSize: 96,
            color: theme.colors.primary,
            letterSpacing: "0.03em",
            transform: `scale(${line2Scale})`,
            opacity: line2Opacity,
            lineHeight: 1.1,
            textAlign: "center",
          }}
        >
          corredor de rua?
        </div>

        {/* Divider */}
        <div
          style={{
            width: dividerWidth,
            height: 3,
            backgroundColor: theme.colors.primary,
            marginTop: 48,
            marginBottom: 48,
            borderRadius: 2,
          }}
        />

        {/* Impact line */}
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 44,
            fontWeight: 700,
            color: theme.colors.white,
            textAlign: "center",
            opacity: impactOpacity,
            transform: `translateY(${impactY}px)`,
            lineHeight: 1.4,
          }}
        >
          Então para de perder
          <br />
          <span style={{ color: theme.colors.primary }}>inscrição.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme, VIDEO_FPS } from "../lib/theme";

export const SIGNUP_CTA_DURATION = 4 * VIDEO_FPS; // 4s

export function RaceSignupCta({ deadline }: { deadline: string }) {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleScale = interpolate(frame, [0, 15], [0.8, 1], {
    extrapolateRight: "clamp",
  });

  const deadlineOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const buttonOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const buttonY = interpolate(frame, [30, 45], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Button pulse
  const pulse = Math.sin(frame * 0.12) * 0.03 + 1;

  // Urgency bar width
  const barWidth = interpolate(frame, [40, 80], [0, 100], {
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
      {/* Radial accent */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 60%, ${theme.colors.primary}20 0%, transparent 60%)`,
        }}
      />

      {/* Headline */}
      <div
        style={{
          fontFamily: theme.fonts.logo,
          fontSize: 80,
          color: theme.colors.white,
          textAlign: "center",
          lineHeight: 1.1,
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
        }}
      >
        GARANTA SUA VAGA
      </div>

      {/* Deadline */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 30,
          color: theme.colors.primary,
          textAlign: "center",
          marginTop: 32,
          fontWeight: 700,
          opacity: deadlineOpacity,
        }}
      >
        Inscrições até {deadline}
      </div>

      {/* Urgency bar */}
      <div
        style={{
          width: 400,
          height: 6,
          backgroundColor: `${theme.colors.primary}30`,
          borderRadius: 3,
          marginTop: 24,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${barWidth}%`,
            height: "100%",
            backgroundColor: theme.colors.primary,
            borderRadius: 3,
          }}
        />
      </div>

      {/* CTA Button */}
      <div
        style={{
          marginTop: 60,
          opacity: buttonOpacity,
          transform: `translateY(${buttonY}px) scale(${pulse})`,
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 36,
            fontWeight: 700,
            color: theme.colors.white,
            backgroundColor: theme.colors.primary,
            padding: "28px 64px",
            borderRadius: 20,
            textAlign: "center",
          }}
        >
          Ver no Largada
        </div>
      </div>

      {/* Bottom branding */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          fontFamily: theme.fonts.logo,
          fontSize: 32,
          color: `${theme.colors.white}60`,
          letterSpacing: "0.15em",
        }}
      >
        LARGADA
      </div>
    </AbsoluteFill>
  );
}

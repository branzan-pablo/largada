import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme, VIDEO_FPS } from "../lib/theme";

export const COUNTDOWN_DURATION = 3 * VIDEO_FPS; // 3s

export function RaceCountdown() {
  const frame = useCurrentFrame();

  const digits = [3, 2, 1];
  const framesPerDigit = VIDEO_FPS; // 1s each

  // Determine which digit is showing
  const digitIndex = Math.min(Math.floor(frame / framesPerDigit), digits.length - 1);
  const localFrame = frame - digitIndex * framesPerDigit;

  // Digit scales in from large to normal
  const scale = interpolate(localFrame, [0, 8], [2.5, 1], {
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(localFrame, [0, 5, framesPerDigit - 5, framesPerDigit], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Circular progress ring
  const overallProgress = frame / COUNTDOWN_DURATION;
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference * (1 - overallProgress);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.dark,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Pulsing background glow */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.colors.primary}30 0%, transparent 70%)`,
          transform: `scale(${1 + Math.sin(frame * 0.15) * 0.1})`,
        }}
      />

      {/* Progress ring */}
      <svg
        width={320}
        height={320}
        style={{ position: "absolute" }}
        viewBox="0 0 320 320"
      >
        <circle
          cx={160}
          cy={160}
          r={140}
          fill="none"
          stroke={`${theme.colors.primary}30`}
          strokeWidth={6}
        />
        <circle
          cx={160}
          cy={160}
          r={140}
          fill="none"
          stroke={theme.colors.primary}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 160 160)"
        />
      </svg>

      {/* Digit */}
      <div
        style={{
          fontFamily: theme.fonts.logo,
          fontSize: 200,
          color: theme.colors.white,
          transform: `scale(${scale})`,
          opacity,
          lineHeight: 1,
        }}
      >
        {digits[digitIndex]}
      </div>
    </AbsoluteFill>
  );
}

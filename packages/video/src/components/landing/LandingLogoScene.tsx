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

export const LANDING_LOGO_DURATION = 90; // 3s at 30fps

// Pre-computed particle positions (orange dots that converge into a ring)
const PARTICLES = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * Math.PI * 2;
  const finalX = Math.cos(angle) * 120;
  const finalY = Math.sin(angle) * 120;
  // Random scatter positions
  const startX = (Math.cos(angle + i) * 500 + Math.sin(i * 7) * 200) | 0;
  const startY = (Math.sin(angle + i) * 600 + Math.cos(i * 5) * 300) | 0;
  return { startX, startY, finalX, finalY, delay: (i * 0.7) | 0 };
});

const BRAND_LETTERS = "LARGADA".split("");

export function LandingLogoScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Particles converge (frames 0-30)
  const particleProgress = interpolate(frame, [0, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Phase 2: Logo snaps in (frame 25+)
  const logoSpring = spring({
    frame,
    fps,
    delay: 22,
    config: { damping: 8, stiffness: 150, mass: 0.6 },
  });

  // Phase 3: Letters type in one by one (frame 35+)
  // Phase 4: Tagline + divider

  // Cursor blink
  const cursorVisible = Math.floor((frame - 35) / 8) % 2 === 0;

  // Fade out
  const fadeOut = interpolate(frame, [72, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  // Tagline
  const taglineOpacity = interpolate(frame, [58, 68], [0, 1], {
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
        overflow: "hidden",
      }}
    >
      {/* Animated background gradient — rotates */}
      <div
        style={{
          position: "absolute",
          inset: -200,
          background: `conic-gradient(from ${frame * 2}deg at 50% 50%, transparent 0deg, ${theme.colors.primary}08 90deg, transparent 180deg, ${theme.colors.primary}06 270deg, transparent 360deg)`,
        }}
      />

      {/* Converging particles */}
      {PARTICLES.map((p, i) => {
        const px = interpolate(
          particleProgress,
          [0, 1],
          [p.startX, p.finalX]
        );
        const py = interpolate(
          particleProgress,
          [0, 1],
          [p.startY, p.finalY]
        );
        const particleSize = interpolate(
          particleProgress,
          [0, 0.5, 1],
          [3, 6, 4]
        );
        const particleOpacity = interpolate(
          frame,
          [p.delay, p.delay + 5, 28, 35],
          [0, 0.8, 0.8, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "43%",
              width: particleSize,
              height: particleSize,
              borderRadius: "50%",
              backgroundColor: theme.colors.primary,
              transform: `translate(${px}px, ${py}px)`,
              opacity: particleOpacity,
              boxShadow: `0 0 ${particleSize * 2}px ${theme.colors.primary}`,
            }}
          />
        );
      })}

      {/* Logo — snaps in after particles converge */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Glowing ring behind logo */}
        <div
          style={{
            position: "absolute",
            top: -25,
            width: 240,
            height: 240,
            borderRadius: "50%",
            border: `2px solid ${theme.colors.primary}${Math.round(logoSpring * 40).toString(16).padStart(2, "0")}`,
            opacity: logoSpring,
            transform: `scale(${0.8 + logoSpring * 0.2})`,
          }}
        />

        <Img
          src={staticFile("logo_120.png")}
          style={{
            width: 190,
            height: 190,
            transform: `scale(${logoSpring}) rotate(${(1 - logoSpring) * -90}deg)`,
            opacity: logoSpring,
          }}
        />

        {/* Typed brand name — letters appear one by one */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 28,
            height: 120,
          }}
        >
          {BRAND_LETTERS.map((letter, i) => {
            const letterDelay = 35 + i * 3;
            const letterSpring = spring({
              frame,
              fps,
              delay: letterDelay,
              config: { damping: 15, stiffness: 200, mass: 0.5 },
            });
            const letterRotation = interpolate(letterSpring, [0, 1], [-90, 0]);

            return (
              <div
                key={i}
                style={{
                  fontFamily: theme.fonts.logo,
                  fontSize: 120,
                  color: theme.colors.white,
                  letterSpacing: "0.06em",
                  lineHeight: 1,
                  opacity: letterSpring,
                  transform: `perspective(400px) rotateY(${letterRotation}deg)`,
                  display: "inline-block",
                }}
              >
                {letter}
              </div>
            );
          })}

          {/* Typing cursor */}
          {frame >= 35 && frame < 62 && (
            <div
              style={{
                width: 4,
                height: 90,
                backgroundColor: theme.colors.primary,
                marginLeft: 4,
                opacity: cursorVisible ? 1 : 0,
                borderRadius: 2,
              }}
            />
          )}
        </div>

        {/* Tagline slides up */}
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 30,
            fontWeight: 600,
            color: theme.colors.text,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            opacity: taglineOpacity,
            marginTop: 8,
          }}
        >
          Corridas de Rua
        </div>
      </div>
    </AbsoluteFill>
  );
}

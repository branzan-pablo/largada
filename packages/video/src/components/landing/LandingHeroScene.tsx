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

export const LANDING_HERO_DURATION = 150; // 5s at 30fps

export function LandingHeroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ken Burns effect on background
  const bgScale = interpolate(frame, [0, LANDING_HERO_DURATION], [1, 1.12], {
    extrapolateRight: "clamp",
  });

  // "VAI TER CORRIDA." slides in
  const line1Opacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line1Y = interpolate(frame, [10, 25], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "VOCE VAI FICAR SABENDO." slides in
  const line2Opacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const line2Y = interpolate(frame, [30, 50], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse on orange text
  const pulse = interpolate(frame, [50, 65, 80], [1, 1.03, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle
  const subOpacity = interpolate(frame, [55, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [55, 70], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Orange CTA button
  const btn1Spring = spring({
    frame: frame - 75,
    fps,
    config: { damping: 10, stiffness: 80 },
  });
  const btn1Opacity = interpolate(frame, [75, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // White outline CTA button
  const btn2Opacity = interpolate(frame, [85, 98], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const btn2X = interpolate(frame, [85, 98], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Orange button continuous pulse
  const btnPulse =
    frame > 100
      ? 1 + 0.03 * Math.sin(((frame - 100) / 30) * Math.PI * 2)
      : 1;

  // Fade out
  const fadeOut = interpolate(
    frame,
    [LANDING_HERO_DURATION - 15, LANDING_HERO_DURATION],
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
        {/* Line 1 */}
        <div
          style={{
            fontFamily: theme.fonts.logo,
            fontSize: 90,
            color: theme.colors.white,
            letterSpacing: "0.02em",
            lineHeight: 1.1,
            transform: `translateY(${line1Y}px)`,
            opacity: line1Opacity,
            textShadow: "0 4px 30px rgba(0,0,0,0.8)",
          }}
        >
          VAI TER CORRIDA.
        </div>

        {/* Line 2 - Orange */}
        <div
          style={{
            fontFamily: theme.fonts.logo,
            fontSize: 90,
            color: theme.colors.primary,
            letterSpacing: "0.02em",
            lineHeight: 1.1,
            marginTop: 12,
            transform: `translateY(${line2Y}px) scale(${pulse})`,
            opacity: line2Opacity,
            textShadow: `0 4px 30px rgba(0,0,0,0.8), 0 0 60px ${theme.colors.primary}30`,
          }}
        >
          {"VOCÊ VAI FICAR\nSABENDO."}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 30,
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.5,
            marginTop: 40,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          Descubra provas perto de você, filtre por
          <br />
          distância ou cidade e seja avisado antes
          <br />
          das inscrições encerrarem.
        </div>

        {/* CTA Buttons */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 48,
            alignItems: "center",
          }}
        >
          {/* Orange button */}
          <div
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.white,
              fontFamily: theme.fonts.body,
              fontSize: 32,
              fontWeight: 700,
              padding: "22px 48px",
              borderRadius: 100,
              opacity: btn1Opacity,
              transform: `scale(${btn1Spring * btnPulse})`,
              boxShadow: `0 0 40px ${theme.colors.primary}40`,
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
              border: "2px solid rgba(255,255,255,0.8)",
              color: theme.colors.white,
              fontFamily: theme.fonts.body,
              fontSize: 32,
              fontWeight: 700,
              padding: "22px 48px",
              borderRadius: 100,
              opacity: btn2Opacity,
              transform: `translateX(${btn2X}px)`,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 28 }}>📋</span>
            Sugerir Evento
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

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

export const LANDING_HERO_DURATION = 150; // 5s at 30fps

export function LandingHeroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Iris wipe — circle clip-path expands from center
  const irisRadius = interpolate(frame, [0, 30], [0, 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Ken Burns — slow push-in
  const bgScale = interpolate(frame, [0, LANDING_HERO_DURATION], [1.15, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Word 1: "VAI" — slams down from top with rotation
  const word1Spring = spring({
    frame,
    fps,
    delay: 18,
    config: { damping: 9, stiffness: 120, mass: 0.8 },
  });

  // Word 2: "TER" — slams in from right
  const word2Spring = spring({
    frame,
    fps,
    delay: 24,
    config: { damping: 9, stiffness: 120, mass: 0.8 },
  });

  // Word 3: "CORRIDA." — scales up from center
  const word3Spring = spring({
    frame,
    fps,
    delay: 30,
    config: { damping: 10, stiffness: 100, mass: 0.9 },
  });

  // Line 2: "VOCÊ VAI FICAR SABENDO." — sweeps in from left with skew
  const line2Progress = interpolate(frame, [42, 62], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Orange underline wipe
  const underlineWidth = interpolate(frame, [55, 75], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Subtitle
  const subOpacity = interpolate(frame, [70, 82], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // CTA buttons — slide in from opposite sides and meet
  const btn1X = interpolate(frame, [88, 105], [-300, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const btn2X = interpolate(frame, [92, 108], [300, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const btnOpacity = interpolate(frame, [88, 98], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Button pulse
  const btnPulse =
    frame > 110
      ? 1 + 0.025 * Math.sin(((frame - 110) / 25) * Math.PI * 2)
      : 1;

  // Fade out
  const fadeOut = interpolate(
    frame,
    [LANDING_HERO_DURATION - 15, LANDING_HERO_DURATION],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    }
  );

  return (
    <AbsoluteFill style={{ opacity: fadeOut, overflow: "hidden" }}>
      {/* Background with iris wipe reveal */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `circle(${irisRadius}% at 50% 45%)`,
        }}
      >
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
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        />
      </div>

      {/* Gradient frame */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(13,27,42,0.6) 0%, transparent 25%, transparent 70%, rgba(13,27,42,0.8) 100%)",
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
          padding: 60,
          textAlign: "center",
        }}
      >
        {/* Kinetic headline — words slam in from different directions */}
        <div style={{ marginBottom: 8 }}>
          {/* "VAI" — drops from top */}
          <span
            style={{
              fontFamily: theme.fonts.logo,
              fontSize: 100,
              color: theme.colors.white,
              display: "inline-block",
              transform: `translateY(${(1 - word1Spring) * -120}px) rotate(${(1 - word1Spring) * -15}deg)`,
              opacity: word1Spring,
              textShadow: "0 4px 30px rgba(0,0,0,0.8)",
              marginRight: 20,
            }}
          >
            VAI
          </span>
          {/* "TER" — slides from right */}
          <span
            style={{
              fontFamily: theme.fonts.logo,
              fontSize: 100,
              color: theme.colors.white,
              display: "inline-block",
              transform: `translateX(${(1 - word2Spring) * 150}px)`,
              opacity: word2Spring,
              textShadow: "0 4px 30px rgba(0,0,0,0.8)",
              marginRight: 20,
            }}
          >
            TER
          </span>
          {/* "CORRIDA." — scales up */}
          <span
            style={{
              fontFamily: theme.fonts.logo,
              fontSize: 100,
              color: theme.colors.white,
              display: "inline-block",
              transform: `scale(${word3Spring * 1})`,
              opacity: word3Spring,
              textShadow: "0 4px 30px rgba(0,0,0,0.8)",
            }}
          >
            CORRIDA.
          </span>
        </div>

        {/* Line 2 — sweeps in with skew */}
        <div
          style={{
            fontFamily: theme.fonts.logo,
            fontSize: 78,
            color: theme.colors.primary,
            lineHeight: 1.2,
            transform: `translateX(${(1 - line2Progress) * -400}px) skewX(${(1 - line2Progress) * -12}deg)`,
            opacity: line2Progress,
            textShadow: `0 4px 30px rgba(0,0,0,0.8), 0 0 80px ${theme.colors.primary}25`,
            position: "relative",
          }}
        >
          VOCÊ VAI FICAR
          <br />
          SABENDO.
          {/* Orange underline wipe */}
          <div
            style={{
              position: "absolute",
              bottom: -8,
              left: "50%",
              transform: "translateX(-50%)",
              width: `${underlineWidth}%`,
              height: 4,
              background: `linear-gradient(90deg, transparent, ${theme.colors.primary}, transparent)`,
              borderRadius: 2,
            }}
          />
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 28,
            fontWeight: 600,
            color: "rgba(255,255,255,0.8)",
            lineHeight: 1.5,
            marginTop: 44,
            opacity: subOpacity,
          }}
        >
          Descubra provas perto de você, filtre por
          <br />
          distância ou cidade e seja avisado antes
          <br />
          das inscrições encerrarem.
        </div>

        {/* CTA Buttons — slide from opposite sides */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 44,
          }}
        >
          <div
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.white,
              fontFamily: theme.fonts.body,
              fontSize: 30,
              fontWeight: 700,
              padding: "20px 44px",
              borderRadius: 100,
              transform: `translateX(${btn1X}px) scale(${btnPulse})`,
              opacity: btnOpacity,
              boxShadow: `0 0 40px ${theme.colors.primary}40`,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            🏃 Ver corridas
          </div>
          <div
            style={{
              border: "2px solid rgba(255,255,255,0.7)",
              color: theme.colors.white,
              fontFamily: theme.fonts.body,
              fontSize: 30,
              fontWeight: 700,
              padding: "20px 44px",
              borderRadius: 100,
              transform: `translateX(${btn2X}px)`,
              opacity: btnOpacity,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            📋 Sugerir Evento
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

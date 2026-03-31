import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../../lib/theme";

export const LANDING_FEATURES_DURATION = 180; // 6s at 30fps

const features = [
  {
    icon: "⚡",
    title: "Filtros na medida certa",
    desc: "Filtre por raio de km, distância da prova, premiação e data.",
  },
  {
    icon: "🎯",
    title: "Só corridas que valem",
    desc: "Quer dinheiro, troféu ou os dois? Um toque filtra só as provas que fazem sentido pra você.",
  },
  {
    icon: "🔎",
    title: "Busca direta",
    desc: "Pesquise pelo nome da corrida, cidade ou organizador. Resultado na hora.",
  },
  {
    icon: "📋",
    title: "Informação completa",
    desc: "Categorias, local de largada, percurso, valores — tudo na mesma tela.",
  },
  {
    icon: "🔔",
    title: "Aviso antes do prazo fechar",
    desc: "Receba notificação quando surgir corrida nova na sua região e lembrete 3 dias antes.",
  },
  {
    icon: "📱",
    title: "Instala como app, sem a loja",
    desc: "Adicione direto do navegador, sem App Store nem Google Play. Funciona igual a um app nativo.",
    highlighted: true,
  },
];

export function LandingFeaturesScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Label
  const labelOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title
  const titleOpacity = interpolate(frame, [8, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [8, 20], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out
  const fadeOut = interpolate(
    frame,
    [LANDING_FEATURES_DURATION - 15, LANDING_FEATURES_DURATION],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Row starts
  const rowStarts = [25, 50, 75];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.white,
        padding: "60px 56px",
        opacity: fadeOut,
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 20,
          fontWeight: 600,
          color: theme.colors.text,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          textAlign: "center",
          marginTop: 100,
          opacity: labelOpacity,
        }}
      >
        Funcionalidades
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 46,
          fontWeight: 900,
          color: theme.colors.dark,
          textAlign: "center",
          marginTop: 16,
          lineHeight: 1.2,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        Tudo que você precisa para
        <br />
        planejar sua temporada
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 26,
          color: theme.colors.text,
          textAlign: "center",
          marginTop: 12,
          opacity: titleOpacity,
        }}
      >
        Detalhes que fazem a diferença na hora de planejar sua temporada
      </div>

      {/* Features grid - 2 columns, 3 rows */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          marginTop: 48,
          justifyContent: "center",
        }}
      >
        {features.map((feature, i) => {
          const row = Math.floor(i / 2);
          const col = i % 2;
          const start = rowStarts[row] + col * 8;

          const cardSpring = spring({
            frame: frame - start,
            fps,
            config: {
              damping: feature.highlighted ? 8 : 12,
              stiffness: 80,
            },
          });
          const cardOpacity = interpolate(
            frame,
            [start, start + 12],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // Glow for highlighted card
          const glowPulse = feature.highlighted
            ? interpolate(
                frame,
                [90, 110, 130, 150, 170],
                [0, 0.4, 0, 0.4, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              )
            : 0;

          const isHighlighted = feature.highlighted;

          return (
            <div
              key={i}
              style={{
                width: "47%",
                backgroundColor: isHighlighted
                  ? theme.colors.primary
                  : theme.colors.bgLight,
                borderRadius: 20,
                padding: "28px 24px",
                opacity: cardOpacity,
                transform: `scale(${cardSpring})`,
                boxShadow: isHighlighted
                  ? `0 0 ${40 + glowPulse * 30}px ${theme.colors.primary}${Math.round(
                      (0.3 + glowPulse * 0.3) * 255
                    )
                      .toString(16)
                      .padStart(2, "0")}`
                  : "0 1px 8px rgba(0,0,0,0.04)",
                border: isHighlighted
                  ? `2px solid ${theme.colors.primary}`
                  : "2px solid transparent",
              }}
            >
              {/* Icon circle */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: isHighlighted
                    ? "rgba(255,255,255,0.2)"
                    : `${theme.colors.primary}15`,
                  border: isHighlighted
                    ? "2px solid rgba(255,255,255,0.3)"
                    : `2px solid ${theme.colors.primary}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  marginBottom: 16,
                }}
              >
                {feature.icon}
              </div>

              {/* Title */}
              <div
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: 28,
                  fontWeight: 700,
                  color: isHighlighted ? theme.colors.white : theme.colors.dark,
                  lineHeight: 1.2,
                  marginBottom: 8,
                }}
              >
                {feature.title}
              </div>

              {/* Description */}
              <div
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: 22,
                  color: isHighlighted
                    ? "rgba(255,255,255,0.85)"
                    : theme.colors.text,
                  lineHeight: 1.4,
                }}
              >
                {feature.desc}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

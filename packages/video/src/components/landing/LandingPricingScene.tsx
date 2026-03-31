import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../../lib/theme";

export const LANDING_PRICING_DURATION = 150; // 5s at 30fps

const plans = [
  {
    name: "Avulso",
    price: "R$ 149",
    period: "pagamento único",
    features: [
      "1 corrida em destaque",
      "Corrida no topo do calendário",
      "Badge de destaque no listagem",
      "Mais visibilidade para inscrições",
    ],
    highlighted: false,
  },
  {
    name: "Organizador",
    price: "R$ 349",
    period: "pagamento único",
    discount: "-21% de desconto",
    badge: "Mais popular",
    features: [
      "3 corridas em destaque",
      "Tudo do plano Avulso",
      "3 créditos para destacar corridas",
      "Créditos válidos por 30 dias",
    ],
    highlighted: true,
  },
  {
    name: "Organizador Pro",
    price: "R$ 699",
    period: "pagamento único",
    discount: "-47% de desconto",
    features: [
      "6 corridas em destaque",
      "Tudo do plano Organizador",
      "6 créditos para destacar corridas",
      "Créditos válidos por 30 dias",
    ],
    highlighted: false,
  },
];

export function LandingPricingScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Label
  const labelOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title
  const titleOpacity = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [8, 22], [25, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out
  const fadeOut = interpolate(
    frame,
    [LANDING_PRICING_DURATION - 15, LANDING_PRICING_DURATION],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const cardStarts = [25, 38, 51];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.bgLight,
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
          marginTop: 80,
          opacity: labelOpacity,
        }}
      >
        Para Organizadores
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 44,
          fontWeight: 900,
          color: theme.colors.dark,
          textAlign: "center",
          marginTop: 16,
          lineHeight: 1.2,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        Destaque suas corridas e
        <br />
        alcance mais atletas
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 24,
          color: theme.colors.text,
          textAlign: "center",
          marginTop: 12,
          opacity: titleOpacity,
        }}
      >
        Coloque seus eventos no topo do calendário e seja visto por quem está
        procurando a próxima prova.
      </div>

      {/* Pricing cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          marginTop: 40,
          flex: 1,
          justifyContent: "center",
        }}
      >
        {plans.map((plan, i) => {
          const start = cardStarts[i];
          const isHighlighted = plan.highlighted;

          const cardSpring = spring({
            frame: frame - start,
            fps,
            config: {
              damping: isHighlighted ? 10 : 14,
              stiffness: 80,
            },
          });
          const cardOpacity = interpolate(
            frame,
            [start, start + 12],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // Border color for highlighted card
          const borderColor = isHighlighted
            ? interpolateColors(
                frame,
                [start, start + 25],
                ["#E5E7EB", theme.colors.primary]
              )
            : "#E5E7EB";

          // Button pulse for highlighted
          const btnPulse =
            isHighlighted && frame > 90
              ? 1 + 0.03 * Math.sin(((frame - 90) / 25) * Math.PI * 2)
              : 1;

          // Feature items stagger for highlighted card
          const featureBaseStart = isHighlighted ? start + 25 : start + 15;

          return (
            <div
              key={i}
              style={{
                position: "relative",
                backgroundColor: theme.colors.white,
                borderRadius: 24,
                padding: "28px 32px",
                border: `2px solid`,
                borderColor,
                borderTopWidth: isHighlighted ? 4 : 2,
                borderTopColor: isHighlighted
                  ? theme.colors.primary
                  : borderColor,
                opacity: cardOpacity,
                transform: `scale(${cardSpring})`,
                boxShadow: isHighlighted
                  ? `0 8px 32px ${theme.colors.primary}18`
                  : "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              {/* Badge for highlighted */}
              {plan.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: -16,
                    right: 28,
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.white,
                    fontFamily: theme.fonts.body,
                    fontSize: 18,
                    fontWeight: 700,
                    padding: "6px 20px",
                    borderRadius: 100,
                    boxShadow: `0 4px 16px ${theme.colors.primary}40`,
                  }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <div
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: 26,
                  fontWeight: 700,
                  color: theme.colors.dark,
                  marginBottom: 8,
                }}
              >
                {plan.name}
              </div>

              {/* Price row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: theme.fonts.logo,
                    fontSize: 52,
                    color: isHighlighted
                      ? theme.colors.primary
                      : theme.colors.dark,
                    lineHeight: 1,
                  }}
                >
                  {plan.price}
                </span>
                <span
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 20,
                    color: theme.colors.text,
                  }}
                >
                  / {plan.period}
                </span>
              </div>

              {/* Discount */}
              {plan.discount && (
                <div
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 18,
                    fontWeight: 600,
                    color: theme.colors.success,
                    marginBottom: 8,
                  }}
                >
                  {plan.discount}
                </div>
              )}

              {/* Feature list */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                {plan.features.map((feat, j) => {
                  const featStart = featureBaseStart + j * 6;
                  const featOpacity = interpolate(
                    frame,
                    [featStart, featStart + 10],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                  );

                  return (
                    <div
                      key={j}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        opacity: featOpacity,
                      }}
                    >
                      <span
                        style={{
                          color: theme.colors.primary,
                          fontSize: 20,
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                      <span
                        style={{
                          fontFamily: theme.fonts.body,
                          fontSize: 22,
                          color: theme.colors.text,
                        }}
                      >
                        {feat}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* CTA button */}
              <div
                style={{
                  marginTop: 20,
                  backgroundColor: isHighlighted
                    ? theme.colors.primary
                    : "transparent",
                  color: isHighlighted
                    ? theme.colors.white
                    : theme.colors.dark,
                  border: isHighlighted
                    ? "none"
                    : `2px solid ${theme.colors.dark}`,
                  fontFamily: theme.fonts.body,
                  fontSize: 24,
                  fontWeight: 700,
                  padding: "16px 0",
                  borderRadius: 12,
                  textAlign: "center",
                  transform: `scale(${btnPulse})`,
                  boxShadow: isHighlighted
                    ? `0 4px 20px ${theme.colors.primary}30`
                    : "none",
                }}
              >
                Começar agora
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment note */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 18,
          color: theme.colors.text,
          textAlign: "center",
          marginTop: 20,
          opacity: titleOpacity,
        }}
      >
        Pagamento único via PIX ou cartão. Sem assinatura recorrente.
      </div>
    </AbsoluteFill>
  );
}

import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../../lib/theme";

export const LANDING_PRICING_DURATION = 150; // 5s at 30fps

const plans = [
  {
    name: "Avulso",
    price: 149,
    period: "pagamento único",
    subtitle: "1 corrida em destaque",
    features: ["Topo do calendário", "Badge verificado", "Painel básico"],
    highlighted: false,
    height: 70,
  },
  {
    name: "Organizador",
    price: 349,
    period: "pagamento único",
    subtitle: "3 corridas em destaque",
    discount: "-21%",
    badge: "Mais popular",
    features: [
      "Tudo do Avulso",
      "3 créditos",
      "Válidos 30 dias",
    ],
    highlighted: true,
    height: 85,
  },
  {
    name: "Organizador Pro",
    price: 699,
    period: "pagamento único",
    subtitle: "6 corridas em destaque",
    discount: "-47%",
    features: [
      "Tudo do Organizador",
      "6 créditos",
      "Válidos 30 dias",
    ],
    highlighted: false,
    height: 78,
  },
];

export function LandingPricingScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleScale = interpolate(frame, [0, 15], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Fade out
  const fadeOut = interpolate(
    frame,
    [LANDING_PRICING_DURATION - 15, LANDING_PRICING_DURATION],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    }
  );

  const colDelays = [28, 22, 34]; // Middle first

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.dark,
        opacity: fadeOut,
        overflow: "hidden",
      }}
    >
      {/* Spotlight on center */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          width: 500,
          height: 800,
          transform: "translate(-50%, -20%)",
          background: `radial-gradient(ellipse, ${theme.colors.primary}10 0%, transparent 60%)`,
        }}
      />

      {/* Title */}
      <div
        style={{
          textAlign: "center",
          marginTop: 100,
          padding: "0 60px",
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 20,
            fontWeight: 600,
            color: theme.colors.primary,
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            marginBottom: 12,
          }}
        >
          Para Organizadores
        </div>
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 42,
            fontWeight: 900,
            color: theme.colors.white,
            lineHeight: 1.25,
          }}
        >
          Destaque suas corridas
        </div>
      </div>

      {/* Rising column cards — perspective view */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: 20,
          marginTop: 60,
          flex: 1,
          padding: "0 40px 120px",
          perspective: "800px",
        }}
      >
        {plans.map((plan, i) => {
          const delay = colDelays[i];
          const isHL = plan.highlighted;

          // Column rises from bottom
          const riseProgress = interpolate(
            frame,
            [delay, delay + 25],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            }
          );

          // 3D tilt — columns tilt then straighten
          const tiltX = interpolate(
            frame,
            [delay, delay + 15, delay + 30],
            [25, 5, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            }
          );

          // Badge spring
          const badgeSpring = isHL
            ? spring({
                frame,
                fps,
                delay: delay + 18,
                config: { damping: 8, stiffness: 150, mass: 0.5 },
              })
            : 0;

          // Animated price counter
          const priceProgress = interpolate(
            frame,
            [delay + 10, delay + 30],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            }
          );
          const displayPrice = Math.round(priceProgress * plan.price);

          // Button pulse
          const btnPulse =
            isHL && frame > 80
              ? 1 + 0.03 * Math.sin(((frame - 80) / 22) * Math.PI * 2)
              : 1;

          // Column height based on plan
          const colHeight = plan.height;

          return (
            <div
              key={i}
              style={{
                width: "30%",
                maxWidth: 300,
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                opacity: riseProgress,
                transform: `translateY(${(1 - riseProgress) * 400}px) rotateX(${tiltX}deg)`,
                transformOrigin: "bottom center",
                position: "relative",
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  style={{
                    position: "absolute",
                    top: -18,
                    left: "50%",
                    transform: `translateX(-50%) scale(${badgeSpring})`,
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.white,
                    fontFamily: theme.fonts.body,
                    fontSize: 16,
                    fontWeight: 700,
                    padding: "5px 18px",
                    borderRadius: 100,
                    whiteSpace: "nowrap",
                    boxShadow: `0 4px 16px ${theme.colors.primary}50`,
                  }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Card body */}
              <div
                style={{
                  backgroundColor: isHL
                    ? "rgba(255,77,0,0.08)"
                    : "rgba(255,255,255,0.04)",
                  borderRadius: 24,
                  padding: "28px 24px",
                  border: `2px solid ${isHL ? theme.colors.primary : "rgba(255,255,255,0.08)"}`,
                  borderTopWidth: isHL ? 4 : 2,
                  minHeight: `${colHeight}%`,
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: isHL
                    ? `0 0 40px ${theme.colors.primary}15, 0 20px 60px rgba(0,0,0,0.3)`
                    : "0 10px 40px rgba(0,0,0,0.2)",
                }}
              >
                {/* Plan name */}
                <div
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 24,
                    fontWeight: 700,
                    color: theme.colors.white,
                    marginBottom: 4,
                  }}
                >
                  {plan.name}
                </div>
                <div
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 18,
                    color: "rgba(255,255,255,0.5)",
                    marginBottom: 12,
                  }}
                >
                  {plan.subtitle}
                </div>

                {/* Price — animated counter */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span
                    style={{
                      fontFamily: theme.fonts.logo,
                      fontSize: 52,
                      color: isHL
                        ? theme.colors.primary
                        : theme.colors.white,
                      lineHeight: 1,
                    }}
                  >
                    R$ {displayPrice}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 16,
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: 8,
                  }}
                >
                  / {plan.period}
                </div>

                {/* Discount */}
                {plan.discount && (
                  <div
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: 16,
                      fontWeight: 700,
                      color: theme.colors.success,
                      marginBottom: 12,
                    }}
                  >
                    {plan.discount} de desconto
                  </div>
                )}

                {/* Features */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    flex: 1,
                    marginTop: 8,
                  }}
                >
                  {plan.features.map((feat, j) => {
                    const fDelay = delay + 20 + j * 5;
                    const fOp = interpolate(
                      frame,
                      [fDelay, fDelay + 8],
                      [0, 1],
                      {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                      }
                    );
                    return (
                      <div
                        key={j}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          opacity: fOp,
                        }}
                      >
                        <span
                          style={{
                            color: theme.colors.primary,
                            fontSize: 18,
                            fontWeight: 700,
                          }}
                        >
                          ✓
                        </span>
                        <span
                          style={{
                            fontFamily: theme.fonts.body,
                            fontSize: 18,
                            color: "rgba(255,255,255,0.7)",
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
                    backgroundColor: isHL
                      ? theme.colors.primary
                      : "transparent",
                    color: isHL
                      ? theme.colors.white
                      : "rgba(255,255,255,0.8)",
                    border: isHL
                      ? "none"
                      : "1px solid rgba(255,255,255,0.2)",
                    fontFamily: theme.fonts.body,
                    fontSize: 20,
                    fontWeight: 700,
                    padding: "12px 0",
                    borderRadius: 12,
                    textAlign: "center",
                    transform: `scale(${btnPulse})`,
                    boxShadow: isHL
                      ? `0 4px 20px ${theme.colors.primary}35`
                      : "none",
                  }}
                >
                  Começar agora
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom note */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: theme.fonts.body,
          fontSize: 18,
          color: "rgba(255,255,255,0.3)",
          opacity: titleOpacity,
        }}
      >
        Pagamento único via PIX ou cartão. Sem assinatura recorrente.
      </div>
    </AbsoluteFill>
  );
}

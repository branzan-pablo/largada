import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../lib/theme";

export const APP_SCREEN_DURATION = 10 * 30; // 10s at 30fps

const races = [
  {
    name: "Corrida Noturna SJR",
    date: "12 Abr",
    distance: "5K · 10K",
    price: "R$ 89",
    city: "S.J. Rio Preto",
  },
  {
    name: "Meia de Votuporanga",
    date: "26 Abr",
    distance: "21K",
    price: "R$ 149",
    city: "Votuporanga",
  },
  {
    name: "Trail Run Catanduva",
    date: "10 Mai",
    distance: "5K · 15K",
    price: "R$ 110",
    city: "Catanduva",
  },
];

const filters = ["50km", "5K–10K", "Abr 2026"];

export function AppScreenScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title fade in
  const titleOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [5, 20], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phone slides up with spring
  const phoneProgress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, stiffness: 60 },
  });
  const phoneY = interpolate(phoneProgress, [0, 1], [500, 0]);
  const phoneOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Notification popup
  const notifStart = 200;
  const notifProgress = spring({
    frame: frame - notifStart,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const notifOpacity = interpolate(frame, [notifStart, notifStart + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "Quem vai" overlay
  const socialStart = 240;
  const socialOpacity = interpolate(
    frame,
    [socialStart, socialStart + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Fade out
  const fadeOut = interpolate(
    frame,
    [APP_SCREEN_DURATION - 20, APP_SCREEN_DURATION],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.dark,
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 55%, ${theme.colors.primary}10 0%, transparent 60%)`,
        }}
      />

      {/* Title */}
      <div
        style={{
          marginTop: 100,
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 44,
            fontWeight: 700,
            color: theme.colors.white,
            lineHeight: 1.3,
          }}
        >
          Todas as corridas.
        </div>
        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 44,
            fontWeight: 700,
            color: theme.colors.primary,
            lineHeight: 1.3,
          }}
        >
          Um só lugar.
        </div>
      </div>

      {/* Phone mockup */}
      <div
        style={{
          position: "relative",
          marginTop: 48,
          transform: `translateY(${phoneY}px)`,
          opacity: phoneOpacity,
        }}
      >
        {/* Phone frame */}
        <div
          style={{
            width: 480,
            height: 920,
            borderRadius: 44,
            border: "3px solid rgba(255,255,255,0.15)",
            backgroundColor: "#111827",
            overflow: "hidden",
            position: "relative",
            boxShadow: `0 0 100px ${theme.colors.primary}20, 0 30px 80px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Notch */}
          <div
            style={{
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 10,
              backgroundColor: "#1F2937",
            }}
          >
            <div
              style={{
                width: 130,
                height: 30,
                backgroundColor: "#000",
                borderRadius: 15,
              }}
            />
          </div>

          {/* App header */}
          <div
            style={{
              padding: "14px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#1F2937",
            }}
          >
            <div
              style={{
                fontFamily: theme.fonts.logo,
                fontSize: 30,
                color: theme.colors.primary,
                letterSpacing: "0.03em",
              }}
            >
              LARGADA
            </div>
            <div style={{ fontSize: 24 }}>🔍</div>
          </div>

          {/* Filter pills */}
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "14px 24px",
              flexWrap: "wrap",
            }}
          >
            {filters.map((filter, i) => {
              const filterOpacity = interpolate(
                frame,
                [45 + i * 12, 55 + i * 12],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );
              const filterScale = spring({
                frame: frame - (45 + i * 12),
                fps,
                config: { damping: 15, stiffness: 120 },
              });
              return (
                <div
                  key={filter}
                  style={{
                    backgroundColor: `${theme.colors.primary}20`,
                    border: `1.5px solid ${theme.colors.primary}50`,
                    borderRadius: 20,
                    padding: "7px 16px",
                    fontFamily: theme.fonts.body,
                    fontSize: 16,
                    color: theme.colors.primary,
                    fontWeight: 600,
                    opacity: filterOpacity,
                    transform: `scale(${filterScale})`,
                  }}
                >
                  {filter}
                </div>
              );
            })}
          </div>

          {/* Race cards */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: "10px 24px",
            }}
          >
            {races.map((race, i) => {
              const cardStart = 70 + i * 25;
              const cardSpring = spring({
                frame: frame - cardStart,
                fps,
                config: { damping: 14, stiffness: 80 },
              });
              const cardOpacity = interpolate(
                frame,
                [cardStart, cardStart + 12],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );

              return (
                <div
                  key={race.name}
                  style={{
                    backgroundColor: "#1F2937",
                    borderRadius: 18,
                    padding: "18px 20px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    opacity: cardOpacity,
                    transform: `translateY(${interpolate(cardSpring, [0, 1], [40, 0])}px)`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: theme.fonts.body,
                          fontSize: 19,
                          fontWeight: 700,
                          color: "#F9FAFB",
                          marginBottom: 5,
                        }}
                      >
                        {race.name}
                      </div>
                      <div
                        style={{
                          fontFamily: theme.fonts.body,
                          fontSize: 14,
                          color: "#9CA3AF",
                        }}
                      >
                        {race.date} · {race.city}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: theme.fonts.body,
                        fontSize: 17,
                        fontWeight: 700,
                        color: theme.colors.primary,
                      }}
                    >
                      {race.price}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    {race.distance.split(" · ").map((d) => (
                      <div
                        key={d}
                        style={{
                          backgroundColor: "rgba(255,255,255,0.06)",
                          borderRadius: 10,
                          padding: "5px 12px",
                          fontFamily: theme.fonts.body,
                          fontSize: 13,
                          color: "#D1D5DB",
                          fontWeight: 600,
                        }}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notification overlay */}
          {frame >= notifStart && (
            <div
              style={{
                position: "absolute",
                top: 85,
                left: 16,
                right: 16,
                backgroundColor: "#1F2937",
                borderRadius: 18,
                padding: "16px 18px",
                border: `2px solid ${theme.colors.primary}50`,
                boxShadow: `0 10px 40px rgba(0,0,0,0.5)`,
                opacity: notifOpacity,
                transform: `translateY(${interpolate(notifProgress, [0, 1], [-30, 0])}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: 15,
                  fontWeight: 700,
                  color: theme.colors.primary,
                  marginBottom: 4,
                }}
              >
                Nova corrida perto de você!
              </div>
              <div
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: 14,
                  color: "#D1D5DB",
                }}
              >
                Corrida Noturna SJR — inscrições abertas
              </div>
            </div>
          )}

          {/* Social proof overlay */}
          {frame >= socialStart && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                background:
                  "linear-gradient(to top, rgba(17,24,39,0.98) 60%, transparent)",
                padding: "40px 24px 24px",
                opacity: socialOpacity,
              }}
            >
              <div
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: 16,
                  fontWeight: 600,
                  color: theme.colors.white,
                  marginBottom: 10,
                }}
              >
                Quem vai correr:
              </div>
              <div style={{ display: "flex", gap: -6 }}>
                {["#3B82F6", "#EF4444", "#10B981", "#F59E0B"].map(
                  (color, i) => (
                    <div
                      key={color}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: color,
                        border: "2px solid #111827",
                        marginLeft: i > 0 ? -8 : 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: theme.fonts.body,
                        fontSize: 16,
                        fontWeight: 700,
                        color: "white",
                      }}
                    >
                      {["R", "M", "J", "A"][i]}
                    </div>
                  )
                )}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "rgba(255,255,255,0.1)",
                    border: "2px solid #111827",
                    marginLeft: -8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: theme.fonts.body,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#9CA3AF",
                  }}
                >
                  +12
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
}

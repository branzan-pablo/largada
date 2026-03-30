import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme, VIDEO_FPS } from "../lib/theme";
import type { RaceAnnouncementProps } from "../compositions/RaceAnnouncement";

export const DETAILS_DURATION = 6 * VIDEO_FPS; // 6s

export function RaceDetails({ race }: { race: RaceAnnouncementProps }) {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 15], [40, 0], {
    extrapolateRight: "clamp",
  });

  const details = [
    { icon: "📅", label: "Data", value: race.date },
    { icon: "📍", label: "Local", value: race.location },
    { icon: "🏃", label: "Distâncias", value: race.distances },
    { icon: "💰", label: "Inscrição", value: race.price },
  ];

  const fadeOut = interpolate(
    frame,
    [DETAILS_DURATION - 15, DETAILS_DURATION],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.white,
        padding: 80,
        opacity: fadeOut,
      }}
    >
      {/* Race name */}
      <div
        style={{
          fontFamily: theme.fonts.logo,
          fontSize: 72,
          color: theme.colors.dark,
          textAlign: "center",
          marginTop: 200,
          lineHeight: 1.1,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        {race.name}
      </div>

      {/* Orange divider */}
      <div
        style={{
          width: interpolate(frame, [10, 30], [0, 200], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          height: 4,
          backgroundColor: theme.colors.primary,
          margin: "40px auto",
          borderRadius: 2,
        }}
      />

      {/* Detail rows */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 32,
          marginTop: 60,
        }}
      >
        {details.map((detail, i) => {
          const start = 20 + i * 15;
          const rowOpacity = interpolate(frame, [start, start + 12], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const rowX = interpolate(frame, [start, start + 12], [-60, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                opacity: rowOpacity,
                transform: `translateX(${rowX}px)`,
                backgroundColor: theme.colors.bgLight,
                borderRadius: 20,
                padding: "28px 36px",
              }}
            >
              <span style={{ fontSize: 40 }}>{detail.icon}</span>
              <div>
                <div
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 22,
                    fontWeight: 600,
                    color: theme.colors.text,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {detail.label}
                </div>
                <div
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 34,
                    fontWeight: 700,
                    color: theme.colors.dark,
                    marginTop: 4,
                  }}
                >
                  {detail.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

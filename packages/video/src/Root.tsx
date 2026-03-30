import { Composition } from "remotion";
import { LargadaDemo, TOTAL_DURATION } from "./compositions/LargadaDemo";
import {
  RaceAnnouncement,
  RACE_ANNOUNCEMENT_DURATION,
} from "./compositions/RaceAnnouncement";
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS } from "./lib/theme";

export function RemotionRoot() {
  return (
    <>
      <Composition
        id="LargadaDemo"
        component={LargadaDemo}
        durationInFrames={TOTAL_DURATION}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
      <Composition
        id="RaceAnnouncement"
        component={RaceAnnouncement}
        durationInFrames={RACE_ANNOUNCEMENT_DURATION}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{
          name: "Maratona de São Paulo 2026",
          date: "25 de Maio, 2026",
          location: "São Paulo, SP",
          distances: "5K · 10K · 21K · 42K",
          price: "R$ 189,00",
          deadline: "18/05/2026",
        }}
      />
    </>
  );
}

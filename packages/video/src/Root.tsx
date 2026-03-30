import { Composition } from "remotion";
import { LargadaDemo, TOTAL_DURATION } from "./compositions/LargadaDemo";
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
    </>
  );
}

import { AbsoluteFill, Sequence } from "remotion";
import { LogoIntro, LOGO_INTRO_DURATION } from "../components/LogoIntro";
import { ProblemScene, PROBLEM_DURATION } from "../components/ProblemScene";
import { HeroScene, HERO_DURATION } from "../components/HeroScene";
import { FeaturesScene, FEATURES_DURATION } from "../components/FeaturesScene";
import { CtaScene, CTA_DURATION } from "../components/CtaScene";
import { loadFonts } from "../lib/fonts";

loadFonts();

// Scene start frames
const SCENE_1_START = 0;
const SCENE_2_START = LOGO_INTRO_DURATION;
const SCENE_3_START = SCENE_2_START + PROBLEM_DURATION;
const SCENE_4_START = SCENE_3_START + HERO_DURATION;
const SCENE_5_START = SCENE_4_START + FEATURES_DURATION;

export const TOTAL_DURATION =
  LOGO_INTRO_DURATION +
  PROBLEM_DURATION +
  HERO_DURATION +
  FEATURES_DURATION +
  CTA_DURATION;

export function LargadaDemo() {

  return (
    <AbsoluteFill style={{ backgroundColor: "#0D1B2A" }}>
      <Sequence from={SCENE_1_START} durationInFrames={LOGO_INTRO_DURATION}>
        <LogoIntro />
      </Sequence>

      <Sequence from={SCENE_2_START} durationInFrames={PROBLEM_DURATION}>
        <ProblemScene />
      </Sequence>

      <Sequence from={SCENE_3_START} durationInFrames={HERO_DURATION}>
        <HeroScene />
      </Sequence>

      <Sequence from={SCENE_4_START} durationInFrames={FEATURES_DURATION}>
        <FeaturesScene />
      </Sequence>

      <Sequence from={SCENE_5_START} durationInFrames={CTA_DURATION}>
        <CtaScene />
      </Sequence>
    </AbsoluteFill>
  );
}

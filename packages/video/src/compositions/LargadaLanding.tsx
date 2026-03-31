import { AbsoluteFill, Sequence } from "remotion";
import {
  LandingLogoScene,
  LANDING_LOGO_DURATION,
} from "../components/landing/LandingLogoScene";
import {
  LandingHeroScene,
  LANDING_HERO_DURATION,
} from "../components/landing/LandingHeroScene";
import {
  LandingWhyScene,
  LANDING_WHY_DURATION,
} from "../components/landing/LandingWhyScene";
import {
  LandingFeaturesScene,
  LANDING_FEATURES_DURATION,
} from "../components/landing/LandingFeaturesScene";
import {
  LandingStepsScene,
  LANDING_STEPS_DURATION,
} from "../components/landing/LandingStepsScene";
import {
  LandingPricingScene,
  LANDING_PRICING_DURATION,
} from "../components/landing/LandingPricingScene";
import {
  LandingFinalCtaScene,
  LANDING_FINAL_CTA_DURATION,
} from "../components/landing/LandingFinalCtaScene";
import { loadFonts } from "../lib/fonts";
import { theme } from "../lib/theme";

loadFonts();

const SCENE_1_START = 0;
const SCENE_2_START = LANDING_LOGO_DURATION;
const SCENE_3_START = SCENE_2_START + LANDING_HERO_DURATION;
const SCENE_4_START = SCENE_3_START + LANDING_WHY_DURATION;
const SCENE_5_START = SCENE_4_START + LANDING_FEATURES_DURATION;
const SCENE_6_START = SCENE_5_START + LANDING_STEPS_DURATION;
const SCENE_7_START = SCENE_6_START + LANDING_PRICING_DURATION;

export const LANDING_TOTAL_DURATION =
  LANDING_LOGO_DURATION +
  LANDING_HERO_DURATION +
  LANDING_WHY_DURATION +
  LANDING_FEATURES_DURATION +
  LANDING_STEPS_DURATION +
  LANDING_PRICING_DURATION +
  LANDING_FINAL_CTA_DURATION;

export function LargadaLanding() {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.dark }}>
      <Sequence from={SCENE_1_START} durationInFrames={LANDING_LOGO_DURATION}>
        <LandingLogoScene />
      </Sequence>
      <Sequence from={SCENE_2_START} durationInFrames={LANDING_HERO_DURATION}>
        <LandingHeroScene />
      </Sequence>
      <Sequence from={SCENE_3_START} durationInFrames={LANDING_WHY_DURATION}>
        <LandingWhyScene />
      </Sequence>
      <Sequence
        from={SCENE_4_START}
        durationInFrames={LANDING_FEATURES_DURATION}
      >
        <LandingFeaturesScene />
      </Sequence>
      <Sequence from={SCENE_5_START} durationInFrames={LANDING_STEPS_DURATION}>
        <LandingStepsScene />
      </Sequence>
      <Sequence
        from={SCENE_6_START}
        durationInFrames={LANDING_PRICING_DURATION}
      >
        <LandingPricingScene />
      </Sequence>
      <Sequence
        from={SCENE_7_START}
        durationInFrames={LANDING_FINAL_CTA_DURATION}
      >
        <LandingFinalCtaScene />
      </Sequence>
    </AbsoluteFill>
  );
}

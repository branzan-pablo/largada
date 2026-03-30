import { AbsoluteFill, Sequence } from "remotion";
import { HookScene, HOOK_DURATION } from "../components/HookScene";
import {
  AppScreenScene,
  APP_SCREEN_DURATION,
} from "../components/AppScreenScene";
import {
  SocialProofScene,
  SOCIAL_PROOF_DURATION,
} from "../components/SocialProofScene";
import { PromoCtaScene, PROMO_CTA_DURATION } from "../components/PromoCtaScene";
import { loadFonts } from "../lib/fonts";

loadFonts();

// Scene start frames
const SCENE_1_START = 0;
const SCENE_2_START = HOOK_DURATION;
const SCENE_3_START = SCENE_2_START + APP_SCREEN_DURATION;
const SCENE_4_START = SCENE_3_START + SOCIAL_PROOF_DURATION;

export const PROMO_TOTAL_DURATION =
  HOOK_DURATION + APP_SCREEN_DURATION + SOCIAL_PROOF_DURATION + PROMO_CTA_DURATION;

export function LargadaPromo() {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0D1B2A" }}>
      <Sequence from={SCENE_1_START} durationInFrames={HOOK_DURATION}>
        <HookScene />
      </Sequence>

      <Sequence from={SCENE_2_START} durationInFrames={APP_SCREEN_DURATION}>
        <AppScreenScene />
      </Sequence>

      <Sequence from={SCENE_3_START} durationInFrames={SOCIAL_PROOF_DURATION}>
        <SocialProofScene />
      </Sequence>

      <Sequence from={SCENE_4_START} durationInFrames={PROMO_CTA_DURATION}>
        <PromoCtaScene />
      </Sequence>
    </AbsoluteFill>
  );
}

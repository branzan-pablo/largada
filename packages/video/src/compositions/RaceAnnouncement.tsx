import { AbsoluteFill, Sequence } from "remotion";
import { RaceCountdown, COUNTDOWN_DURATION } from "../components/RaceCountdown";
import { RaceDetails, DETAILS_DURATION } from "../components/RaceDetails";
import { RaceSignupCta, SIGNUP_CTA_DURATION } from "../components/RaceSignupCta";
import { loadFonts } from "../lib/fonts";

loadFonts();

export interface RaceAnnouncementProps {
  name: string;
  date: string;
  location: string;
  distances: string;
  price: string;
  deadline: string;
}

const SCENE_1_START = 0;
const SCENE_2_START = COUNTDOWN_DURATION;
const SCENE_3_START = SCENE_2_START + DETAILS_DURATION;

export const RACE_ANNOUNCEMENT_DURATION =
  COUNTDOWN_DURATION + DETAILS_DURATION + SIGNUP_CTA_DURATION;

const defaultRace: RaceAnnouncementProps = {
  name: "Maratona de São Paulo 2026",
  date: "25 de Maio, 2026",
  location: "São Paulo, SP",
  distances: "5K · 10K · 21K · 42K",
  price: "R$ 189,00",
  deadline: "18/05/2026",
};

export function RaceAnnouncement(props: Partial<RaceAnnouncementProps>) {
  const race = { ...defaultRace, ...props };

  return (
    <AbsoluteFill style={{ backgroundColor: "#0D1B2A" }}>
      <Sequence from={SCENE_1_START} durationInFrames={COUNTDOWN_DURATION}>
        <RaceCountdown />
      </Sequence>

      <Sequence from={SCENE_2_START} durationInFrames={DETAILS_DURATION}>
        <RaceDetails race={race} />
      </Sequence>

      <Sequence from={SCENE_3_START} durationInFrames={SIGNUP_CTA_DURATION}>
        <RaceSignupCta deadline={race.deadline} />
      </Sequence>
    </AbsoluteFill>
  );
}

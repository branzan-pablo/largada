"use client";

import { useState } from "react";
import Image from "next/image";
import { RaceImageFallback } from "./race-image-fallback";

interface RaceDetailHeroImageProps {
  imageUrl: string | null;
  raceName: string;
  day: string;
  month: string;
}

export function RaceDetailHeroImage({ imageUrl, raceName, day, month }: RaceDetailHeroImageProps) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <>
        <RaceImageFallback day={day} month={month} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A]/90 via-transparent to-transparent" />
      </>
    );
  }

  return (
    <>
      <Image
        src={imageUrl}
        alt={raceName}
        fill
        className="object-cover"
        sizes="100vw"
        priority
        unoptimized
        onError={() => setFailed(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
    </>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { RaceImageFallback } from "./race-image-fallback";

interface RaceCardImageProps {
  imageUrl: string | null;
  raceName: string;
  day: string;
  month: string;
  priority?: boolean;
}

export function RaceCardImage({
  imageUrl,
  raceName,
  day,
  month,
  priority = false,
}: RaceCardImageProps) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return <RaceImageFallback day={day} month={month} />;
  }

  const handleError = () => setFailed(true);
  const sizes = "(max-width: 640px) calc(100vw - 2rem), (max-width: 1024px) calc(50vw - 2rem), calc(33vw - 2rem)";

  return (
    <>
      <Image
        src={imageUrl}
        alt=""
        fill
        className="object-cover scale-110 blur-xl brightness-75"
        sizes={sizes}
        aria-hidden
        unoptimized
        onError={handleError}
      />
      <Image
        src={imageUrl}
        alt={raceName}
        fill
        className="object-contain md:transition-transform md:duration-300 md:group-hover:scale-[1.03] relative"
        sizes={sizes}
        priority={priority}
        unoptimized
        onError={handleError}
      />
    </>
  );
}

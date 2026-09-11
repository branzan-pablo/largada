"use client";

import { useState } from "react";
import Image from "next/image";

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
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-[#FF4D00]/10 via-gray-100 to-gray-200">
        <span className="text-4xl font-black leading-none text-[#0D1B2A]">{day}</span>
        <span className="mt-0.5 text-xs font-bold uppercase tracking-wider text-[#FF4D00]">{month}</span>
      </div>
    );
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

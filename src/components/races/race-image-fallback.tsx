interface RaceImageFallbackProps {
  day: string;
  month: string;
}

export function RaceImageFallback({ day, month }: RaceImageFallbackProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-br from-[#FF4D00]/10 via-gray-100 to-gray-200">
      <span className="text-4xl font-black leading-none text-[#0D1B2A]">{day}</span>
      <span className="mt-0.5 text-xs font-bold uppercase tracking-wider text-[#FF4D00]">{month}</span>
    </div>
  );
}

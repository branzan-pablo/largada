export function RaceDistanceBadges({
  distances,
  variant = "light",
}: {
  distances: string[];
  variant?: "light" | "dark";
}) {
  return (
    <div className="flex flex-wrap gap-1 md:gap-1.5">
      {distances.map((d) => (
        <span
          key={d}
          className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-md text-[11px] md:text-xs font-medium ${
            variant === "dark"
              ? "bg-white/20 text-white border border-white/20"
              : "bg-gray-100 border border-gray-200 text-gray-700"
          }`}
        >
          {d.toUpperCase()}
        </span>
      ))}
    </div>
  );
}

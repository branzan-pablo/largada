export function RaceDistanceBadges({
  distances,
  variant = "light",
}: {
  distances: string[];
  variant?: "light" | "dark";
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {distances.map((d) => (
        <span
          key={d}
          className={`px-2 py-1 rounded-md text-xs font-medium ${
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

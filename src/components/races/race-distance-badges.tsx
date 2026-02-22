export function RaceDistanceBadges({ distances }: { distances: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {distances.map((d) => (
        <span
          key={d}
          className="px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700"
        >
          {d.toUpperCase()}
        </span>
      ))}
    </div>
  );
}

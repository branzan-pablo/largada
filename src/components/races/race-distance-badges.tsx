export function RaceDistanceBadges({ distances }: { distances: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {distances.map((d) => (
        <span
          key={d}
          className="px-2 py-0.5 rounded-md bg-zinc-800/60 border border-zinc-700/40 text-xs font-medium text-zinc-300"
        >
          {d.toUpperCase()}
        </span>
      ))}
    </div>
  );
}

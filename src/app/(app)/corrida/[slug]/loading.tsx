import { Skeleton } from "@/components/ui/skeleton";

export default function RaceDetailLoading() {
  return (
    <div className="mx-auto max-w-screen-lg px-4 py-6">
      <div className="mb-6 space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-28" />
        </div>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

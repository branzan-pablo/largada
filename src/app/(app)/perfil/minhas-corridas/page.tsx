import { Suspense } from "react";
import { MyRacesClient } from "./my-races-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Minhas Corridas",
};

export default function MyRacesPage() {
  return (
    <div className="mx-auto max-w-screen-lg px-4 py-8 md:py-12">
      <h1 className="mb-6 text-2xl font-medium text-white tracking-tight">Minhas Corridas</h1>
      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        }
      >
        <MyRacesClient />
      </Suspense>
    </div>
  );
}

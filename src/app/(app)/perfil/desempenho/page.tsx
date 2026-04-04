import { Suspense } from "react";
import { DesempenhoClient } from "./desempenho-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Meu Desempenho",
};

export default function DesempenhoPage() {
  return (
    <div className="mx-auto max-w-screen-md md:pb-12">
      <h1 className="mb-6 text-2xl font-bold">Meu Desempenho</h1>
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </div>
        }
      >
        <DesempenhoClient />
      </Suspense>
    </div>
  );
}

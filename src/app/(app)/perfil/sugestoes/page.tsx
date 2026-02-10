import { Suspense } from "react";
import { MySuggestionsClient } from "./my-suggestions-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Minhas Sugestões",
};

export default function MySuggestionsPage() {
  return (
    <div className="mx-auto max-w-screen-sm px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Minhas Sugestões</h1>
      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        }
      >
        <MySuggestionsClient />
      </Suspense>
    </div>
  );
}

import { Suspense } from "react";
import { SubscriptionClient } from "./subscription-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Plano Organizador",
};

export default function SubscriptionPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Plano Organizador</h1>
      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        }
      >
        <SubscriptionClient />
      </Suspense>
    </>
  );
}

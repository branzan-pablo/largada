import { Suspense } from "react";
import { SubscriptionClient } from "./subscription-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Pacotes de Destaque",
};

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; sucesso?: string }>;
}) {
  const { tier, sucesso } = await searchParams;

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Pacotes de Destaque</h1>
      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        }
      >
        <SubscriptionClient initialTier={tier} paymentSuccess={sucesso === "true"} />
      </Suspense>
    </>
  );
}

import { Suspense } from "react";
import { SucessoClient } from "./sucesso-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Pagamento confirmado" };

export default async function CheckoutSucessoPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const { tier } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
        <SucessoClient tier={tier} />
      </Suspense>
    </div>
  );
}

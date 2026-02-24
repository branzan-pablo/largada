import { Suspense } from "react";
import { SuggestionFormClient } from "./suggestion-form-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Sugerir Corrida",
};

export default function SuggestionPage() {
  return (
    <div className="mx-auto max-w-screen-sm px-4 py-8 md:py-12">
      <h1 className="mb-2 text-2xl font-semibold text-[#0D1B2A] tracking-tight">Sugerir Corrida</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Conhece uma corrida que não aparece aqui? Manda para a gente, se tiver tudo certo, vai pro calendário em breve!
      </p>
      <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
        <SuggestionFormClient />
      </Suspense>
    </div>
  );
}

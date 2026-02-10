"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-destructive">Ops!</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Algo deu errado. Tente novamente.
      </p>
      <Button onClick={reset} className="mt-6">
        Tentar novamente
      </Button>
    </main>
  );
}

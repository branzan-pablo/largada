"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRsvp } from "@/hooks/use-rsvp";
import { Button } from "@/components/ui/button";
import { Users, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface RsvpButtonProps {
  raceId: string;
  initialRsvped: boolean;
  initialCount: number;
  variant?: "default" | "compact";
}

export function RsvpButton({
  raceId,
  initialRsvped,
  initialCount,
  variant = "default",
}: RsvpButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { rsvped, count, isToggling, toggle } = useRsvp({
    raceId,
    initialRsvped,
    initialCount,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    toggle();
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleClick}
        disabled={isToggling}
        className={cn(
          "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
          rsvped
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        {rsvped ? <Check className="h-3 w-3" /> : <Users className="h-3 w-3" />}
        {count}
      </button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isToggling}
      variant={rsvped ? "default" : "outline"}
      className="w-full"
    >
      {rsvped ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Vou nessa! ({count})
        </>
      ) : (
        <>
          <Users className="mr-2 h-4 w-4" />
          Vou nessa ({count})
        </>
      )}
    </Button>
  );
}

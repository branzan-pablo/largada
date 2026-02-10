"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return fallback ?? null;
  }

  if (!user) {
    return fallback ?? null;
  }

  return <>{children}</>;
}

interface AuthDialogProps {
  children: React.ReactNode;
}

export function AuthDialog({ children }: AuthDialogProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)} role="button" tabIndex={0}>
        {children}
      </div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Faça login para continuar</DialogTitle>
          <DialogDescription>
            Você precisa estar logado para realizar esta ação.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button asChild>
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
              onClick={() => setOpen(false)}
            >
              Entrar ou criar conta
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

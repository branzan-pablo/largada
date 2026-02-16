"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { useAuth } from "@/contexts/auth-context";
import { useEffect } from "react";
import { toast } from "sonner";

export function LoginPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const error = searchParams.get("error");
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    if (error === "auth") {
      toast.error("Erro na autenticação. Tente novamente.");
    } else if (error === "confirmation") {
      toast.error("Erro ao confirmar email. Tente novamente.");
    }
  }, [error]);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(redirect || "/corridas");
    }
  }, [isLoading, user, router, redirect]);

  if (isLoading || user) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-extrabold uppercase tracking-wider text-primary">
          Largada
        </CardTitle>
        <CardDescription>
          Acesse sua conta ou crie uma nova para encontrar corridas na sua região
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OAuthButtons redirectTo={redirect || undefined} />

        <div className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
            ou com email
          </span>
        </div>

        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="register">Criar conta</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-4">
            <LoginForm redirectTo={redirect || undefined} />
          </TabsContent>
          <TabsContent value="register" className="mt-4">
            <RegisterForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

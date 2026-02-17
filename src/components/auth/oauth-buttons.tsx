"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface OAuthButtonsProps {
  redirectTo?: string;
}

export function OAuthButtons({ redirectTo }: OAuthButtonsProps = {}) {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingStrava, setIsLoadingStrava] = useState(false);
  const isAnyLoading = isLoadingGoogle || isLoadingStrava;
  const supabase = createClient();

  const nextParam = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : "";

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${nextParam}`,
      },
    });
    if (error) {
      setIsLoadingGoogle(false);
    }
  };

  const handleStravaLogin = () => {
    setIsLoadingStrava(true);
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/strava/callback`;
    const scope = "read,profile:read_all";
    const state = crypto.randomUUID();
    // Store state in cookie for server-side CSRF validation
    document.cookie = `strava_oauth_state=${state}; path=/; max-age=600; SameSite=Lax`;
    window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&approval_prompt=auto&state=${state}`;
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={isAnyLoading}
      >
        {isLoadingGoogle ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner />
            Conectando...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <GoogleIcon />
            Continuar com Google
          </span>
        )}
      </Button>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleStravaLogin}
        disabled={isAnyLoading}
      >
        {isLoadingStrava ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner />
            Conectando...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <StravaIcon />
            Continuar com Strava
          </span>
        )}
      </Button>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function StravaIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#FC4C02">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  );
}

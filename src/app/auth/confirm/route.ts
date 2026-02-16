import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_OTP_TYPES = ["signup", "email", "recovery"] as const;
type OtpType = (typeof VALID_OTP_TYPES)[number];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/corridas";

  if (
    tokenHash &&
    type &&
    VALID_OTP_TYPES.includes(type as OtpType)
  ) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as OtpType,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation`);
}

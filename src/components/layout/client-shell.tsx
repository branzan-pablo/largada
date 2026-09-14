"use client";

import dynamic from "next/dynamic";

const Toaster = dynamic(
  () => import("sonner").then((m) => ({ default: m.Toaster })),
  { ssr: false }
);

export function ClientToaster() {
  return (
    <Toaster
      position="bottom-center"
      richColors
      closeButton
      offset={24}
      mobileOffset={24}
      duration={4500}
    />
  );
}

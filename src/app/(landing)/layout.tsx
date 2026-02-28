import { InstallPrompt } from "@/components/pwa/install-prompt";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <InstallPrompt />
    </>
  );
}
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-black bg-grid text-zinc-300 flex items-center justify-center p-4">
      {children}
    </div>
  );
}

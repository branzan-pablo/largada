export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white bg-grid text-[#6B7280] flex items-center justify-center p-4">
      {children}
    </div>
  );
}

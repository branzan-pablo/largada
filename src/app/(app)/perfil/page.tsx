import { Suspense } from "react";
import { ProfilePageClient } from "./profile-page-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Perfil",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-screen-sm px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Perfil</h1>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        }
      >
        <ProfilePageClient />
      </Suspense>
    </div>
  );
}

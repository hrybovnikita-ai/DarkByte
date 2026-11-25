import type { ReactNode } from "react";
import { Suspense } from "react";
import LandingSections from "@/components/landing/LandingSections";
import PixelSkeleton from "@/components/ui/PixelSkeleton";
import { fetchPublishedWorlds } from "@/server/data/worlds-query";

async function HomeWorldsContent() {
  const worlds = await fetchPublishedWorlds();
  return <LandingSections worlds={worlds} />;
}

export default function HomeWorldsSection() {
  return (
    <Suspense
      fallback={
        <MotionFallback className="border-y border-zinc-900 px-6 py-24">
          <div className="mx-auto max-w-7xl space-y-6">
            <PixelSkeleton lines={2} />
            <PixelSkeleton lines={8} />
          </div>
        </MotionFallback>
      }
    >
      <HomeWorldsContent />
    </Suspense>
  );
}

function MotionFallback({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <section className={className}>{children}</section>;
}
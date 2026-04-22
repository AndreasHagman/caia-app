"use client";

import { useTrick } from "@/hooks/useTrick";
import { TrickStatusBadge } from "@/components/tricks/TrickStatusBadge";
import { TrickProgress } from "@/components/tricks/TrickProgress";
import { ChecklistEditor } from "@/components/tricks/ChecklistEditor";
import { computeProgress } from "@/lib/tricks";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";

function isVideo(url: string): boolean {
  return url.match(/\.(mp4|mov|webm|avi)/i) !== null;
}

export default function TrickDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { trick, loading } = useTrick(id);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!trick) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">Trick not found.</p>
        <Button asChild variant="outline">
          <Link href="/tricks">Back to tricks</Link>
        </Button>
      </div>
    );
  }

  const progress = computeProgress(
    trick.checklist,
    trick.progressOverride ? trick.progress : undefined
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/tricks">
          <ArrowLeft className="mr-2 h-4 w-4" />
          All tricks
        </Link>
      </Button>

      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <h1 className="text-4xl font-bold">{trick.name}</h1>
        <TrickStatusBadge status={trick.status} />
      </div>

      {trick.description && (
        <p className="text-muted-foreground mb-6">{trick.description}</p>
      )}

      <div className="mb-8">
        <TrickProgress value={progress} />
      </div>

      {/* Media grid */}
      {trick.mediaUrls.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {trick.mediaUrls.map((url) => (
            <div
              key={url}
              className="rounded-2xl overflow-hidden bg-sage-50"
              style={{ height: `${trick.mediaHeightVh ?? 40}vh` }}
            >
              {isVideo(url) ? (
                <video
                  src={url}
                  controls
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
              ) : (
                <img src={url} alt={trick.name} className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Checklist read-only */}
      {trick.checklist.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Training checklist</h2>
          <ChecklistEditor items={trick.checklist} onChange={() => {}} readOnly />
        </div>
      )}
    </div>
  );
}

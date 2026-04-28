"use client";

import { useHikes } from "@/hooks/useHikes";
import { updateHike } from "@/lib/hikes";
import { HikeCard } from "@/components/hikes/HikeCard";
import { ImageRepositionSheet } from "@/components/about/ImageRepositionSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { Hike } from "@/types";
import { Move } from "lucide-react";
import { useState } from "react";

export default function HikesPage() {
  const { hikes, loading } = useHikes();
  const { isOwner } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [repositionHike, setRepositionHike] = useState<Hike | null>(null);
  const [coverPatches, setCoverPatches] = useState<
    Record<string, { focalX: number; focalY: number }>
  >({});
  const [heightPatches, setHeightPatches] = useState<Record<string, number>>({});

  const repositionImageUrl = repositionHike
    ? (repositionHike.coverImageUrl ??
        repositionHike.mediaUrls[0] ??
        null)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-4xl font-bold">Hikes &amp; adventures</h1>
        {isOwner && !loading && (
          <Button
            size="sm"
            variant={isEditMode ? "default" : "outline"}
            className={isEditMode ? "bg-sage-600 hover:bg-sage-700" : ""}
            onClick={() => setIsEditMode((v) => !v)}
          >
            {isEditMode ? "Done" : "Edit layout"}
          </Button>
        )}
      </div>
      <p className="text-muted-foreground mb-8">Adventures with Caia.</p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : hikes.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No hikes logged yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hikes.map((hike) => {
            const coverPatch = coverPatches[hike.id];
            const heightPatch = heightPatches[hike.id];
            const displayHike: Hike = {
              ...hike,
              ...(coverPatch
                ? { coverFocalX: coverPatch.focalX, coverFocalY: coverPatch.focalY }
                : {}),
              ...(heightPatch !== undefined ? { coverHeightVh: heightPatch } : {}),
            };
            const thumbnail = hike.coverImageUrl ?? hike.mediaUrls[0] ?? null;

            return (
              <div key={hike.id} className="space-y-1.5">
                <div className="relative">
                  <HikeCard hike={displayHike} href={`/hikes/${hike.id}`} />
                  {isOwner && thumbnail && (
                    <button
                      className="absolute top-2 right-2 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 hover:bg-black/80 transition-colors"
                      onClick={() => setRepositionHike(hike)}
                    >
                      <Move className="w-3 h-3" />
                      Cover
                    </button>
                  )}
                </div>
                {isOwner && isEditMode && thumbnail && (
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs text-muted-foreground shrink-0">S</span>
                    <input
                      type="range"
                      min={15}
                      max={80}
                      step={5}
                      value={heightPatch ?? hike.coverHeightVh ?? 30}
                      onChange={(e) => {
                        const h = Number(e.target.value);
                        setHeightPatches((prev) => ({ ...prev, [hike.id]: h }));
                      }}
                      onPointerUp={(e) => {
                        const h = Number((e.target as HTMLInputElement).value);
                        updateHike(hike.id, { coverHeightVh: h });
                      }}
                      onTouchEnd={(e) => {
                        const h = Number((e.target as HTMLInputElement).value);
                        updateHike(hike.id, { coverHeightVh: h });
                      }}
                      className="flex-1 accent-sage-600"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">L</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {repositionHike && repositionImageUrl && (
        <ImageRepositionSheet
          open={!!repositionHike}
          onOpenChange={(open) => {
            if (!open) setRepositionHike(null);
          }}
          imageUrl={repositionImageUrl}
          heightVh={heightPatches[repositionHike.id] ?? repositionHike.coverHeightVh ?? 30}
          focalX={coverPatches[repositionHike.id]?.focalX ?? repositionHike.coverFocalX ?? 50}
          focalY={coverPatches[repositionHike.id]?.focalY ?? repositionHike.coverFocalY ?? 50}
          onCommit={(x, y) => {
            updateHike(repositionHike.id, { coverFocalX: x, coverFocalY: y });
            setCoverPatches((prev) => ({
              ...prev,
              [repositionHike.id]: { focalX: x, focalY: y },
            }));
            setRepositionHike(null);
          }}
        />
      )}
    </div>
  );
}

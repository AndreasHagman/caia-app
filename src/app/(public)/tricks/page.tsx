"use client";

import { useTricks } from "@/hooks/useTricks";
import { TrickCard } from "@/components/tricks/TrickCard";
import { ImageRepositionSheet } from "@/components/about/ImageRepositionSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { updateTrick } from "@/lib/tricks";
import type { Trick, TrickStatus } from "@/types";
import { Move } from "lucide-react";
import { useState } from "react";

const FILTER_OPTIONS: { value: TrickStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "mastered", label: "Mastered" },
  { value: "almost", label: "Almost" },
  { value: "learning", label: "Learning" },
  { value: "not_started", label: "Not started" },
];

function getThumbnail(trick: Trick): string | null {
  return trick.coverImageUrl ?? trick.mediaUrls.find((u) => u.match(/\.(jpg|jpeg|png|webp|gif)/i)) ?? null;
}

export default function TricksPage() {
  const { tricks, loading } = useTricks();
  const { isOwner } = useAuth();
  const [filter, setFilter] = useState<TrickStatus | "all">("all");
  const [repositionTrick, setRepositionTrick] = useState<Trick | null>(null);
  const [coverPatches, setCoverPatches] = useState<Record<string, { focalX: number; focalY: number }>>({});
  const [heightPatches, setHeightPatches] = useState<Record<string, number>>({});

  const filtered = filter === "all" ? tricks : tricks.filter((t) => t.status === filter);

  const repositionImageUrl = repositionTrick ? getThumbnail(repositionTrick) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">Tricks</h1>
      <p className="text-muted-foreground mb-8">Everything Caia has learned and is working on.</p>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap mb-8">
        {FILTER_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setFilter(opt.value)}>
            <Badge
              variant={filter === opt.value ? "default" : "secondary"}
              className={
                filter === opt.value
                  ? "bg-sage-600 hover:bg-sage-700 cursor-pointer"
                  : "cursor-pointer"
              }
            >
              {opt.label}
              {opt.value !== "all" && ` (${tricks.filter((t) => t.status === opt.value).length})`}
            </Badge>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="rounded-2xl aspect-[4/3]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No tricks yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((trick) => {
            const patch = coverPatches[trick.id];
            const heightPatch = heightPatches[trick.id];
            const displayTrick = {
              ...trick,
              ...(patch ? { coverFocalX: patch.focalX, coverFocalY: patch.focalY } : {}),
              ...(heightPatch !== undefined ? { coverHeightVh: heightPatch } : {}),
            };
            const thumbnail = getThumbnail(trick);
            return (
              <div key={trick.id} className="space-y-1.5">
                <div className="relative">
                  <TrickCard trick={displayTrick} href={`/tricks/${trick.id}`} />
                  {isOwner && thumbnail && (
                    <button
                      className="absolute top-2 right-2 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 hover:bg-black/80 transition-colors"
                      onClick={() => setRepositionTrick(trick)}
                    >
                      <Move className="w-3 h-3" />
                      Cover
                    </button>
                  )}
                </div>
                {isOwner && thumbnail && (
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs text-muted-foreground shrink-0">S</span>
                    <input
                      type="range"
                      min={15}
                      max={80}
                      step={5}
                      value={heightPatch ?? trick.coverHeightVh ?? 30}
                      onChange={(e) => {
                        const h = Number(e.target.value);
                        setHeightPatches((prev) => ({ ...prev, [trick.id]: h }));
                      }}
                      onPointerUp={(e) => {
                        const h = Number((e.target as HTMLInputElement).value);
                        updateTrick(trick.id, { coverHeightVh: h });
                      }}
                      onTouchEnd={(e) => {
                        const h = Number((e.target as HTMLInputElement).value);
                        updateTrick(trick.id, { coverHeightVh: h });
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

      {repositionTrick && repositionImageUrl && (
        <ImageRepositionSheet
          open={!!repositionTrick}
          onOpenChange={(open) => { if (!open) setRepositionTrick(null); }}
          imageUrl={repositionImageUrl}
          heightVh={25}
          focalX={coverPatches[repositionTrick.id]?.focalX ?? repositionTrick.coverFocalX ?? 50}
          focalY={coverPatches[repositionTrick.id]?.focalY ?? repositionTrick.coverFocalY ?? 50}
          onCommit={(x, y) => {
            updateTrick(repositionTrick.id, { coverFocalX: x, coverFocalY: y });
            setCoverPatches((prev) => ({ ...prev, [repositionTrick.id]: { focalX: x, focalY: y } }));
            setRepositionTrick(null);
          }}
        />
      )}
    </div>
  );
}

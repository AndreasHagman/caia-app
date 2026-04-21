"use client";

import { useTricks } from "@/hooks/useTricks";
import { TrickCard } from "@/components/tricks/TrickCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { TrickStatus } from "@/types";
import { useState } from "react";

const FILTER_OPTIONS: { value: TrickStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "mastered", label: "Mastered" },
  { value: "almost", label: "Almost" },
  { value: "learning", label: "Learning" },
  { value: "not_started", label: "Not started" },
];

export default function TricksPage() {
  const { tricks, loading } = useTricks();
  const [filter, setFilter] = useState<TrickStatus | "all">("all");

  const filtered = filter === "all" ? tricks : tricks.filter((t) => t.status === filter);

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
          {filtered.map((trick) => (
            <TrickCard key={trick.id} trick={trick} href={`/tricks/${trick.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}

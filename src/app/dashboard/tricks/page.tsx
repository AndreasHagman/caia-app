"use client";

import { useTricks } from "@/hooks/useTricks";
import { deleteTrick } from "@/lib/tricks";
import { useAuth } from "@/contexts/AuthContext";
import { TrickStatusBadge } from "@/components/tricks/TrickStatusBadge";
import { TrickProgress } from "@/components/tricks/TrickProgress";
import { computeProgress } from "@/lib/tricks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function DashboardTricksPage() {
  const { tricks, loading, refresh } = useTricks();
  const { isOwner, canEdit } = useAuth();

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteTrick(id);
      toast.success(`"${name}" deleted`);
      refresh();
    } catch {
      toast.error("Failed to delete trick");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Tricks</h1>
        {canEdit && (
          <Button asChild className="bg-sage-600 hover:bg-sage-700">
            <Link href="/dashboard/tricks/new">
              <Plus className="mr-2 h-4 w-4" />
              New trick
            </Link>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : tricks.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No tricks yet. Add the first one!</p>
      ) : (
        <div className="space-y-3">
          {tricks.map((trick) => {
            const progress = computeProgress(
              trick.checklist,
              trick.progressOverride ? trick.progress : undefined
            );
            return (
              <div
                key={trick.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-cream-200 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium">{trick.name}</span>
                    <TrickStatusBadge status={trick.status} />
                  </div>
                  <TrickProgress value={progress} showLabel={false} />
                </div>
                <div className="flex gap-1 shrink-0">
                  {canEdit && (
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/dashboard/tricks/${trick.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(trick.id, trick.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

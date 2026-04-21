"use client";

import { useHikes } from "@/hooks/useHikes";
import { deleteHike } from "@/lib/hikes";
import { useAuth } from "@/contexts/AuthContext";
import { HikeCard } from "@/components/hikes/HikeCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function DashboardHikesPage() {
  const { hikes, loading, refresh } = useHikes();
  const { isOwner, canEdit } = useAuth();

  async function handleDelete(id: string) {
    if (!confirm("Delete this hike?")) return;
    try {
      await deleteHike(id);
      toast.success("Hike deleted");
      refresh();
    } catch {
      toast.error("Failed to delete hike");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Hikes &amp; adventures</h1>
        {canEdit && (
          <Button asChild className="bg-sage-600 hover:bg-sage-700">
            <Link href="/dashboard/hikes/new">
              <Plus className="mr-2 h-4 w-4" />
              New hike
            </Link>
          </Button>
        )}
      </div>

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
          {hikes.map((hike) => (
            <HikeCard
              key={hike.id}
              hike={hike}
              showActions
              onDelete={isOwner ? handleDelete : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

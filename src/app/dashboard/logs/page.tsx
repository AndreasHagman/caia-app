"use client";

import { useLogs } from "@/hooks/useLogs";
import { useTricks } from "@/hooks/useTricks";
import { deleteLog } from "@/lib/logs";
import { useAuth } from "@/contexts/AuthContext";
import { LogCard } from "@/components/logs/LogCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function DashboardLogsPage() {
  const { logs, loading, refresh } = useLogs();
  const { tricks } = useTricks();
  const { isOwner, canEdit } = useAuth();

  async function handleDelete(id: string) {
    if (!confirm("Delete this log entry?")) return;
    try {
      await deleteLog(id);
      toast.success("Log deleted");
      refresh();
    } catch {
      toast.error("Failed to delete log");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Training logs</h1>
        {canEdit && (
          <Button asChild className="bg-sage-600 hover:bg-sage-700">
            <Link href="/dashboard/logs/new">
              <Plus className="mr-2 h-4 w-4" />
              New log
            </Link>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          No logs yet. Start tracking your training sessions!
        </p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              tricks={tricks}
              showActions
              onDelete={isOwner ? handleDelete : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

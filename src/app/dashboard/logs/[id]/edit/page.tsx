"use client";

import { useLogs } from "@/hooks/useLogs";
import { updateLog } from "@/lib/logs";
import { LogForm } from "@/components/logs/LogForm";
import type { TrainingLog } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { use } from "react";

export default function EditLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { logs, loading } = useLogs();
  const log = logs.find((l) => l.id === id);
  const router = useRouter();

  async function handleSubmit(data: Partial<TrainingLog>) {
    try {
      await updateLog(id, data);
      toast.success("Log updated");
      router.push("/dashboard/logs");
    } catch {
      toast.error("Failed to update log");
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Log not found.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/logs">Back to logs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/dashboard/logs">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to logs
        </Link>
      </Button>
      <h1 className="text-3xl font-bold mb-6">Edit log</h1>
      <LogForm log={log} onSubmit={handleSubmit} submitLabel="Save changes" />
    </div>
  );
}

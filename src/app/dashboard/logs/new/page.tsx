"use client";

import { LogForm } from "@/components/logs/LogForm";
import { createLog } from "@/lib/logs";
import { useAuth } from "@/contexts/AuthContext";
import type { TrainingLog } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewLogPage() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleSubmit(data: Partial<TrainingLog>) {
    if (!user) return;
    try {
      await createLog({
        date: data.date ?? new Date(),
        notes: data.notes ?? "",
        tags: data.tags ?? [],
        relatedTricks: data.relatedTricks ?? [],
        createdBy: user.uid,
      });
      toast.success("Log entry saved");
      router.push("/dashboard/logs");
    } catch {
      toast.error("Failed to save log");
    }
  }

  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/dashboard/logs">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to logs
        </Link>
      </Button>
      <h1 className="text-3xl font-bold mb-6">New training log</h1>
      <LogForm onSubmit={handleSubmit} submitLabel="Save log" />
    </div>
  );
}

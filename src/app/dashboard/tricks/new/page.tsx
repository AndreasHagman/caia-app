"use client";

import { TrickForm } from "@/components/tricks/TrickForm";
import { createTrick } from "@/lib/tricks";
import { useAuth } from "@/contexts/AuthContext";
import type { Trick } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewTrickPage() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleSubmit(data: Partial<Trick>) {
    if (!user) return;
    try {
      const id = await createTrick({
        name: data.name ?? "",
        description: data.description ?? "",
        status: data.status ?? "not_started",
        checklist: data.checklist ?? [],
        mediaUrls: [],
        progress: data.progress ?? 0,
        progressOverride: data.progressOverride ?? false,
        createdBy: user.uid,
      });
      toast.success("Trick created! You can now add media.");
      router.push(`/dashboard/tricks/${id}/edit`);
    } catch {
      toast.error("Failed to create trick");
    }
  }

  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/dashboard/tricks">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to tricks
        </Link>
      </Button>
      <h1 className="text-3xl font-bold mb-6">New trick</h1>
      <TrickForm onSubmit={handleSubmit} submitLabel="Create trick" />
    </div>
  );
}

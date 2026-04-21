"use client";

import { useTrick } from "@/hooks/useTrick";
import { updateTrick } from "@/lib/tricks";
import { TrickForm } from "@/components/tricks/TrickForm";
import type { Trick } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { use } from "react";

export default function EditTrickPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { trick, loading, setTrick } = useTrick(id);
  const router = useRouter();

  async function handleSubmit(data: Partial<Trick>) {
    try {
      await updateTrick(id, data);
      if (trick) setTrick({ ...trick, ...data });
      toast.success("Saved");
      router.push("/dashboard/tricks");
    } catch {
      toast.error("Failed to save");
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

  if (!trick) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Trick not found.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/tricks">Back to tricks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/dashboard/tricks">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to tricks
        </Link>
      </Button>
      <h1 className="text-3xl font-bold mb-6">Edit: {trick.name}</h1>
      <TrickForm trick={trick} onSubmit={handleSubmit} submitLabel="Save changes" />
    </div>
  );
}

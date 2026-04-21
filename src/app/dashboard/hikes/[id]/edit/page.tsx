"use client";

import { useHikes } from "@/hooks/useHikes";
import { updateHike } from "@/lib/hikes";
import { HikeForm } from "@/components/hikes/HikeForm";
import type { Hike } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { use } from "react";

export default function EditHikePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { hikes, loading } = useHikes();
  const hike = hikes.find((h) => h.id === id);
  const router = useRouter();

  async function handleSubmit(data: Partial<Hike>) {
    try {
      await updateHike(id, data);
      toast.success("Hike updated");
      router.push("/dashboard/hikes");
    } catch {
      toast.error("Failed to update hike");
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

  if (!hike) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Hike not found.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/hikes">Back to hikes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/dashboard/hikes">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to hikes
        </Link>
      </Button>
      <h1 className="text-3xl font-bold mb-6">Edit: {hike.title}</h1>
      <HikeForm hike={hike} onSubmit={handleSubmit} submitLabel="Save changes" hikeId={id} />
    </div>
  );
}

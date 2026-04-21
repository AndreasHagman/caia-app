"use client";

import { HikeForm } from "@/components/hikes/HikeForm";
import { createHike } from "@/lib/hikes";
import { useAuth } from "@/contexts/AuthContext";
import type { Hike } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewHikePage() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleSubmit(data: Partial<Hike>) {
    if (!user) return;
    try {
      const id = await createHike({
        title: data.title ?? "",
        location: data.location ?? "",
        distance: data.distance,
        date: data.date ?? new Date(),
        notes: data.notes ?? "",
        mediaUrls: [],
        createdBy: user.uid,
      });
      toast.success("Hike saved! You can now add photos.");
      router.push(`/dashboard/hikes/${id}/edit`);
    } catch {
      toast.error("Failed to save hike");
    }
  }

  return (
    <div className="max-w-2xl">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/dashboard/hikes">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to hikes
        </Link>
      </Button>
      <h1 className="text-3xl font-bold mb-6">Log a hike</h1>
      <HikeForm onSubmit={handleSubmit} submitLabel="Save hike" />
    </div>
  );
}

"use client";

import { useTricks } from "@/hooks/useTricks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrickCard } from "@/components/tricks/TrickCard";
import Link from "next/link";
import { Plus } from "lucide-react";
import { computeProgress } from "@/lib/tricks";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { tricks, loading } = useTricks();
  const { canEdit } = useAuth();

  const activeTricks = tricks.filter((t) => t.status !== "mastered");
  const masteredCount = tricks.filter((t) => t.status === "mastered").length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {canEdit && (
          <Button asChild className="bg-sage-600 hover:bg-sage-700" size="sm">
            <Link href="/dashboard/tricks/new">
              <Plus className="mr-2 h-4 w-4" />
              New trick
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total tricks", value: loading ? "…" : tricks.length },
          { label: "Mastered", value: loading ? "…" : masteredCount },
          { label: "In progress", value: loading ? "…" : activeTricks.length },
          { label: "Training logs", value: "—" },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-2xl shadow-sm">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active tricks */}
      {activeTricks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">In progress</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/tricks">View all</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {activeTricks.slice(0, 3).map((trick) => (
              <TrickCard
                key={trick.id}
                trick={trick}
                href={`/dashboard/tricks/${trick.id}/edit`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

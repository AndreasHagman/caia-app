"use client";

import { useTricks } from "@/hooks/useTricks";
import { useLogs } from "@/hooks/useLogs";
import { useHikes } from "@/hooks/useHikes";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { TrickCard } from "@/components/tricks/TrickCard";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const { tricks } = useTricks();
  const { logs } = useLogs();
  const { hikes } = useHikes();
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
          { label: "Total tricks", value: tricks.length, href: "/dashboard/tricks" },
          { label: "Mastered", value: masteredCount, href: "/dashboard/tricks" },
          { label: "Training logs", value: logs.length, href: "/dashboard/logs" },
          { label: "Hikes", value: hikes.length, href: "/dashboard/hikes" },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-1 pt-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active tricks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">In progress</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/tricks">View all</Link>
            </Button>
          </div>
          {activeTricks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active tricks.</p>
          ) : (
            <div className="space-y-3">
              {activeTricks.slice(0, 3).map((trick) => (
                <TrickCard
                  key={trick.id}
                  trick={trick}
                  href={`/dashboard/tricks/${trick.id}/edit`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent activity</h2>
          <ActivityFeed tricks={tricks} logs={logs} hikes={hikes} limit={8} />
        </div>
      </div>
    </div>
  );
}

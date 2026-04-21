"use client";

import { calculateAge } from "@/lib/utils";
import { useTricks } from "@/hooks/useTricks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, MapPin, Calendar } from "lucide-react";

export default function LandingPage() {
  const age = calculateAge();
  const { tricks, loading } = useTricks();

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Hero */}
      <section className="py-16 md:py-24 text-center">
        <Badge variant="secondary" className="mb-4 bg-sage-100 text-sage-700">
          Nova Scotia Duck Tolling Retriever
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
          Caia
        </h1>
        <p className="text-xl text-muted-foreground mb-2">{age}</p>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Follow along on the training journey — tricks, adventures, and memories.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button asChild size="lg" className="bg-sage-600 hover:bg-sage-700">
            <Link href="/tricks">
              See tricks <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/about">About Caia</Link>
          </Button>
        </div>
      </section>

      {/* Hero image placeholder */}
      <section className="rounded-3xl overflow-hidden bg-sage-100 aspect-video md:aspect-[16/7] mb-16 flex items-center justify-center">
        <p className="text-sage-500 text-sm">Hero image goes here</p>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {[
          { icon: <Calendar className="h-5 w-5" />, label: "Born", value: "March 16, 2025" },
          { icon: <MapPin className="h-5 w-5" />, label: "Breed", value: "Toller" },
          { label: "Tricks", value: loading ? "…" : String(tricks.length) },
          { label: "Status", value: "In training" },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 shadow-sm border border-cream-200 flex flex-col gap-1"
          >
            {stat.icon && <span className="text-sage-600">{stat.icon}</span>}
            <span className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</span>
            <span className="font-semibold">{stat.value}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

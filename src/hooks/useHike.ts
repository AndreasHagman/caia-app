"use client";

import { getHike } from "@/lib/hikes";
import type { Hike } from "@/types";
import { useEffect, useState } from "react";

export function useHike(id: string) {
  const [hike, setHike] = useState<Hike | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHike(id)
      .then(setHike)
      .catch(() => setError("Hike not found"))
      .finally(() => setLoading(false));
  }, [id]);

  return { hike, loading, error };
}

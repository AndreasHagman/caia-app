"use client";

import { getHikes } from "@/lib/hikes";
import type { Hike } from "@/types";
import { useEffect, useState } from "react";

export function useHikes() {
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHikes()
      .then(setHikes)
      .catch(() => setError("Failed to load hikes"))
      .finally(() => setLoading(false));
  }, []);

  function refresh() {
    setLoading(true);
    getHikes()
      .then(setHikes)
      .catch(() => setError("Failed to load hikes"))
      .finally(() => setLoading(false));
  }

  return { hikes, loading, error, refresh };
}

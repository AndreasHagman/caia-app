"use client";

import { getTricks } from "@/lib/tricks";
import type { Trick } from "@/types";
import { useEffect, useState } from "react";

export function useTricks() {
  const [tricks, setTricks] = useState<Trick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTricks()
      .then(setTricks)
      .catch(() => setError("Failed to load tricks"))
      .finally(() => setLoading(false));
  }, []);

  function refresh() {
    setLoading(true);
    getTricks()
      .then(setTricks)
      .catch(() => setError("Failed to load tricks"))
      .finally(() => setLoading(false));
  }

  return { tricks, loading, error, refresh };
}

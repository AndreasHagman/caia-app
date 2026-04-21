"use client";

import { getTrick } from "@/lib/tricks";
import type { Trick } from "@/types";
import { useEffect, useState } from "react";

export function useTrick(id: string) {
  const [trick, setTrick] = useState<Trick | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTrick(id)
      .then(setTrick)
      .catch(() => setError("Trick not found"))
      .finally(() => setLoading(false));
  }, [id]);

  return { trick, loading, error, setTrick };
}

"use client";

import { getLogs } from "@/lib/logs";
import type { TrainingLog } from "@/types";
import { useEffect, useState } from "react";

export function useLogs() {
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLogs()
      .then(setLogs)
      .catch(() => setError("Failed to load logs"))
      .finally(() => setLoading(false));
  }, []);

  function refresh() {
    setLoading(true);
    getLogs()
      .then(setLogs)
      .catch(() => setError("Failed to load logs"))
      .finally(() => setLoading(false));
  }

  return { logs, loading, error, refresh };
}

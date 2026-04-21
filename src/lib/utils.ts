import { clsx, type ClassValue } from "clsx";
import { differenceInMonths, differenceInYears } from "date-fns";
import { twMerge } from "tailwind-merge";
import type { ChecklistItem } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CAIA_BIRTH_DATE = new Date("2025-03-16");

export function calculateAge(): string {
  const now = new Date();
  const years = differenceInYears(now, CAIA_BIRTH_DATE);
  const months = differenceInMonths(now, CAIA_BIRTH_DATE) % 12;

  if (years === 0) {
    return `${differenceInMonths(now, CAIA_BIRTH_DATE)} months old`;
  }
  return months > 0 ? `${years}y ${months}m old` : `${years} years old`;
}

export function calculateProgress(
  checklist: ChecklistItem[],
  override?: number
): number {
  if (override !== undefined) return override;
  if (checklist.length === 0) return 0;
  const completed = checklist.filter((item) => item.completed).length;
  return Math.round((completed / checklist.length) * 100);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("nb-NO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

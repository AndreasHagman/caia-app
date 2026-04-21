import { db } from "@/lib/firebase";
import type { ChecklistItem, Trick } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

function fromFirestore(id: string, data: Record<string, unknown>): Trick {
  return {
    ...(data as Omit<Trick, "id" | "createdAt" | "updatedAt">),
    id,
    createdAt: (data.createdAt as { toDate(): Date } | undefined)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as { toDate(): Date } | undefined)?.toDate() ?? new Date(),
  };
}

export async function getTricks(): Promise<Trick[]> {
  const q = query(collection(db, "tricks"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromFirestore(d.id, d.data()));
}

export async function getTrick(id: string): Promise<Trick | null> {
  const snap = await getDoc(doc(db, "tricks", id));
  if (!snap.exists()) return null;
  return fromFirestore(snap.id, snap.data());
}

export async function createTrick(
  data: Omit<Trick, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "tricks"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTrick(
  id: string,
  data: Partial<Omit<Trick, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "tricks", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTrick(id: string): Promise<void> {
  await deleteDoc(doc(db, "tricks", id));
}

export function computeProgress(
  checklist: ChecklistItem[],
  override?: number
): number {
  if (override !== undefined) return Math.max(0, Math.min(100, override));
  if (checklist.length === 0) return 0;
  const done = checklist.filter((i) => i.completed).length;
  return Math.round((done / checklist.length) * 100);
}

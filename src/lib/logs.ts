import { db } from "@/lib/firebase";
import type { TrainingLog } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

function fromFirestore(id: string, data: Record<string, unknown>): TrainingLog {
  return {
    ...(data as Omit<TrainingLog, "id" | "date" | "createdAt">),
    id,
    date: (data.date as { toDate(): Date } | undefined)?.toDate() ?? new Date(),
    createdAt: (data.createdAt as { toDate(): Date } | undefined)?.toDate() ?? new Date(),
  };
}

export async function getLogs(): Promise<TrainingLog[]> {
  const q = query(collection(db, "trainingLogs"), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromFirestore(d.id, d.data()));
}

export async function createLog(
  data: Omit<TrainingLog, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "trainingLogs"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateLog(
  id: string,
  data: Partial<Omit<TrainingLog, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "trainingLogs", id), data);
}

export async function deleteLog(id: string): Promise<void> {
  await deleteDoc(doc(db, "trainingLogs", id));
}

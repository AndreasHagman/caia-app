import { db } from "@/lib/firebase";
import type { Hike } from "@/types";
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

function fromFirestore(id: string, data: Record<string, unknown>): Hike {
  return {
    ...(data as Omit<Hike, "id" | "date" | "createdAt">),
    id,
    date: (data.date as { toDate(): Date } | undefined)?.toDate() ?? new Date(),
    createdAt: (data.createdAt as { toDate(): Date } | undefined)?.toDate() ?? new Date(),
  };
}

export async function getHikes(): Promise<Hike[]> {
  const q = query(collection(db, "hikes"), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromFirestore(d.id, d.data()));
}

export async function createHike(
  data: Omit<Hike, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(collection(db, "hikes"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateHike(
  id: string,
  data: Partial<Omit<Hike, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "hikes", id), data);
}

export async function deleteHike(id: string): Promise<void> {
  await deleteDoc(doc(db, "hikes", id));
}

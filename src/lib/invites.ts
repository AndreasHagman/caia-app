import { db } from "@/lib/firebase";
import type { UserRole } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export interface PendingInvite {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export async function createInvite(email: string, role: UserRole): Promise<void> {
  await addDoc(collection(db, "pendingInvites"), {
    email: email.toLowerCase(),
    role,
    createdAt: new Date(),
  });
}

export async function getInvites(): Promise<PendingInvite[]> {
  const snap = await getDocs(collection(db, "pendingInvites"));
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<PendingInvite, "id">),
  }));
}

export async function findInviteByEmail(email: string): Promise<PendingInvite | null> {
  const q = query(
    collection(db, "pendingInvites"),
    where("email", "==", email.toLowerCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<PendingInvite, "id">) };
}

export async function deleteInvite(id: string): Promise<void> {
  await deleteDoc(doc(db, "pendingInvites", id));
}

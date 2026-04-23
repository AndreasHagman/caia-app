import { db } from "@/lib/firebase";
import type { AppUser } from "@/types";
import { collection, getDocs } from "firebase/firestore";

export async function getUsers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => d.data() as AppUser);
}

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function getAboutImageUrl(): Promise<string | null> {
  const snap = await getDoc(doc(db, "settings", "about"));
  return snap.exists() ? (snap.data().imageUrl ?? null) : null;
}

export async function setAboutImageUrl(url: string): Promise<void> {
  await setDoc(doc(db, "settings", "about"), { imageUrl: url }, { merge: true });
}

export async function getHomeImageUrl(): Promise<string | null> {
  const snap = await getDoc(doc(db, "settings", "home"));
  return snap.exists() ? (snap.data().imageUrl ?? null) : null;
}

export async function setHomeImageUrl(url: string): Promise<void> {
  await setDoc(doc(db, "settings", "home"), { imageUrl: url }, { merge: true });
}

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface PageSettings {
  imageUrl: string | null;
  heightVh: number;
}

// ── Home ─────────────────────────────────────────────────────────────────────

export async function getHomeSettings(): Promise<PageSettings> {
  const snap = await getDoc(doc(db, "settings", "home"));
  const data = snap.exists() ? snap.data() : {};
  return {
    imageUrl: (data.imageUrl as string) ?? null,
    heightVh: (data.heightVh as number) ?? 40,
  };
}

export async function setHomeImageUrl(url: string): Promise<void> {
  await setDoc(doc(db, "settings", "home"), { imageUrl: url }, { merge: true });
}

export async function setHomeHeightVh(vh: number): Promise<void> {
  await setDoc(doc(db, "settings", "home"), { heightVh: vh }, { merge: true });
}

// ── About ─────────────────────────────────────────────────────────────────────

export async function getAboutSettings(): Promise<PageSettings> {
  const snap = await getDoc(doc(db, "settings", "about"));
  const data = snap.exists() ? snap.data() : {};
  return {
    imageUrl: (data.imageUrl as string) ?? null,
    heightVh: (data.heightVh as number) ?? 45,
  };
}

export async function setAboutImageUrl(url: string): Promise<void> {
  await setDoc(doc(db, "settings", "about"), { imageUrl: url }, { merge: true });
}

export async function setAboutHeightVh(vh: number): Promise<void> {
  await setDoc(doc(db, "settings", "about"), { heightVh: vh }, { merge: true });
}

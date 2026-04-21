import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface PageSettings {
  imageUrl: string | null;
  heightVh: number;
  focalX: number; // 0–100, CSS object-position X%
  focalY: number; // 0–100, CSS object-position Y%
}

// ── Home ─────────────────────────────────────────────────────────────────────

export async function getHomeSettings(): Promise<PageSettings> {
  const snap = await getDoc(doc(db, "settings", "home"));
  const data = snap.exists() ? snap.data() : {};
  return {
    imageUrl: (data.imageUrl as string) ?? null,
    heightVh: (data.heightVh as number) ?? 40,
    focalX: (data.focalX as number) ?? 50,
    focalY: (data.focalY as number) ?? 50,
  };
}

export async function setHomeImageUrl(url: string): Promise<void> {
  await setDoc(doc(db, "settings", "home"), { imageUrl: url }, { merge: true });
}

export async function setHomeHeightVh(vh: number): Promise<void> {
  await setDoc(doc(db, "settings", "home"), { heightVh: vh }, { merge: true });
}

export async function setHomeFocal(x: number, y: number): Promise<void> {
  await setDoc(doc(db, "settings", "home"), { focalX: x, focalY: y }, { merge: true });
}

// ── About ─────────────────────────────────────────────────────────────────────

export async function getAboutSettings(): Promise<PageSettings> {
  const snap = await getDoc(doc(db, "settings", "about"));
  const data = snap.exists() ? snap.data() : {};
  return {
    imageUrl: (data.imageUrl as string) ?? null,
    heightVh: (data.heightVh as number) ?? 45,
    focalX: (data.focalX as number) ?? 50,
    focalY: (data.focalY as number) ?? 50,
  };
}

export async function setAboutImageUrl(url: string): Promise<void> {
  await setDoc(doc(db, "settings", "about"), { imageUrl: url }, { merge: true });
}

export async function setAboutHeightVh(vh: number): Promise<void> {
  await setDoc(doc(db, "settings", "about"), { heightVh: vh }, { merge: true });
}

export async function setAboutFocal(x: number, y: number): Promise<void> {
  await setDoc(doc(db, "settings", "about"), { focalX: x, focalY: y }, { merge: true });
}

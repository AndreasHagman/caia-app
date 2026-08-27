import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface SectionData {
  title: string;
  content: string;
  imageUrl: string | null;
}

export interface DogSitterSettings {
  feeding: SectionData;
  walks: SectionData;
  treats: SectionData;
  training: SectionData;
  behavior: SectionData;
  health: SectionData;
  emergency: SectionData;
}

export type SectionKey = keyof DogSitterSettings;

const DEFAULT_SETTINGS: DogSitterSettings = {
  feeding: { title: "Feeding", content: "", imageUrl: null },
  walks: { title: "Walks & Exercise", content: "", imageUrl: null },
  treats: { title: "Treats & Rewards", content: "", imageUrl: null },
  training: { title: "Training", content: "", imageUrl: null },
  behavior: { title: "Behavior & Personality", content: "", imageUrl: null },
  health: { title: "Health & Care", content: "", imageUrl: null },
  emergency: { title: "Emergency Contacts", content: "", imageUrl: null },
};

export async function getDogSitterSettings(): Promise<DogSitterSettings> {
  const snap = await getDoc(doc(db, "settings", "dogsitter"));
  if (!snap.exists()) {
    return DEFAULT_SETTINGS;
  }
  const data = snap.data();
  return {
    feeding: data.feeding ?? DEFAULT_SETTINGS.feeding,
    walks: data.walks ?? DEFAULT_SETTINGS.walks,
    treats: data.treats ?? DEFAULT_SETTINGS.treats,
    training: data.training ?? DEFAULT_SETTINGS.training,
    behavior: data.behavior ?? DEFAULT_SETTINGS.behavior,
    health: data.health ?? DEFAULT_SETTINGS.health,
    emergency: data.emergency ?? DEFAULT_SETTINGS.emergency,
  };
}

export async function updateSection(
  sectionKey: SectionKey,
  data: Partial<SectionData>
): Promise<void> {
  await setDoc(
    doc(db, "settings", "dogsitter"),
    { [sectionKey]: data },
    { merge: true }
  );
}

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface ImageData {
  url: string;
  focalX: number;  // 0-100, default 50
  focalY: number;  // 0-100, default 50
}

export interface SectionData {
  title: string;
  content: string;
  images: ImageData[];  // 0-2 images allowed
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
  feeding: { title: "Feeding", content: "", images: [] },
  walks: { title: "Walks & Exercise", content: "", images: [] },
  treats: { title: "Treats & Rewards", content: "", images: [] },
  training: { title: "Training", content: "", images: [] },
  behavior: { title: "Behavior & Personality", content: "", images: [] },
  health: { title: "Health & Care", content: "", images: [] },
  emergency: { title: "Emergency Contacts", content: "", images: [] },
};

function migrateSectionData(data: any, defaultSection: SectionData): SectionData {
  // If already using new format, return as-is
  if (data.images && Array.isArray(data.images)) {
    return {
      title: data.title ?? defaultSection.title,
      content: data.content ?? defaultSection.content,
      images: data.images,
    };
  }

  // Migrate from old imageUrl format
  const images: ImageData[] = [];
  if (data.imageUrl && typeof data.imageUrl === 'string') {
    images.push({
      url: data.imageUrl,
      focalX: 50,
      focalY: 50,
    });
  }

  return {
    title: data.title ?? defaultSection.title,
    content: data.content ?? defaultSection.content,
    images,
  };
}

export async function getDogSitterSettings(): Promise<DogSitterSettings> {
  const snap = await getDoc(doc(db, "settings", "dogsitter"));
  if (!snap.exists()) {
    return DEFAULT_SETTINGS;
  }
  const data = snap.data();
  return {
    feeding: migrateSectionData(data.feeding ?? {}, DEFAULT_SETTINGS.feeding),
    walks: migrateSectionData(data.walks ?? {}, DEFAULT_SETTINGS.walks),
    treats: migrateSectionData(data.treats ?? {}, DEFAULT_SETTINGS.treats),
    training: migrateSectionData(data.training ?? {}, DEFAULT_SETTINGS.training),
    behavior: migrateSectionData(data.behavior ?? {}, DEFAULT_SETTINGS.behavior),
    health: migrateSectionData(data.health ?? {}, DEFAULT_SETTINGS.health),
    emergency: migrateSectionData(data.emergency ?? {}, DEFAULT_SETTINGS.emergency),
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

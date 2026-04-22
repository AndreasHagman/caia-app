export type UserRole = "owner" | "family";

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  photoURL?: string;
}

export type TrickStatus = "not_started" | "learning" | "almost" | "mastered";

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface Trick {
  id: string;
  name: string;
  description: string;
  status: TrickStatus;
  checklist: ChecklistItem[];
  progress: number;
  progressOverride: boolean;
  mediaUrls: string[];
  coverImageUrl?: string | null;
  coverFocalX?: number;
  coverFocalY?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingLog {
  id: string;
  date: Date;
  notes: string;
  tags: string[];
  relatedTricks: string[];
  createdBy: string;
  createdAt: Date;
}

export interface Hike {
  id: string;
  title: string;
  location: string;
  distance?: number;
  notes: string;
  mediaUrls: string[];
  date: Date;
  createdBy: string;
  createdAt: Date;
}

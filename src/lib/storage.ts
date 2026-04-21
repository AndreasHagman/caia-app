import { storage } from "@/lib/firebase";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

export type UploadProgressCallback = (percent: number) => void;

const MAX_FILE_SIZE_BYTES = 75 * 1024 * 1024; // 75 MB

export function validateMediaFile(file: File): string | null {
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return "Only images and videos are supported.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File must be under 75 MB.";
  }
  return null;
}

export async function uploadMedia(
  file: File,
  storagePath: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const storageRef = ref(storage, storagePath);
  const task = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(pct));
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function deleteMediaByUrl(url: string): Promise<void> {
  const storageRef = ref(storage, url);
  await deleteObject(storageRef);
}

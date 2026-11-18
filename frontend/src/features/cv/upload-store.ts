import { create } from "zustand";

type CvUploadState = {
  file: File | null;
  setFile: (file: File) => void;
  clear: () => void;
};

export const useCvUploadStore = create<CvUploadState>((set) => ({
  file: null,
  setFile: (file) => set({ file }),
  clear: () => set({ file: null }),
}));

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".txt"] as const;

export function isSupportedCvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

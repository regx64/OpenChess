"use client";

import { createPersistentStore } from "@/lib/storage";

/** 오프닝별 내 메모 (오프닝 영문 이름 → 메모) */
export const notesStore = createPersistentStore<
  Record<string, { text: string; updated: number }>
>("notes", {});

export function saveNote(name: string, text: string) {
  notesStore.set((notes) => {
    const next = { ...notes };
    if (text.trim()) next[name] = { text: text.trim(), updated: Date.now() };
    else delete next[name];
    return next;
  });
}

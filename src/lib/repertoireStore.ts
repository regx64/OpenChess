"use client";

import { createPersistentStore } from "@/lib/storage";
import { newRepertoireId, type Repertoire } from "@/lib/repertoire";

/** 내 레퍼토리 목록 (브라우저에 저장) */
export const repertoireStore = createPersistentStore<Repertoire[]>(
  "repertoires",
  [],
);

export function createRepertoire(
  name: string,
  color: "w" | "b",
  pgn = "",
): Repertoire {
  const repertoire: Repertoire = {
    id: newRepertoireId(),
    name: name.trim() || (color === "w" ? "백 레퍼토리" : "흑 레퍼토리"),
    color,
    pgn,
    updated: Date.now(),
  };
  repertoireStore.set((list) => [repertoire, ...list]);
  return repertoire;
}

export function updateRepertoire(
  id: string,
  patch: Partial<Omit<Repertoire, "id">>,
) {
  repertoireStore.set((list) =>
    list.map((item) =>
      item.id === id ? { ...item, ...patch, updated: Date.now() } : item,
    ),
  );
}

export function deleteRepertoire(id: string) {
  repertoireStore.set((list) => list.filter((item) => item.id !== id));
}

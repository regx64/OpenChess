"use client";

import { useSyncExternalStore } from "react";
import type { GameTree } from "@/lib/game/tree";

/** 수순 트리가 바뀔 때마다 다시 렌더링하도록 구독하고, 바뀐 횟수(version)를 반환합니다 */
export function useGameTree(tree: GameTree): number {
  return useSyncExternalStore(tree.subscribe, tree.getVersion, tree.getVersion);
}

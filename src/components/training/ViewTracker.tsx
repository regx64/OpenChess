"use client";

import { useEffect } from "react";
import { recordViewed } from "@/lib/training/progress";

/** 오프닝 페이지를 열면 "본 오프닝"으로 기록 (정복 대시보드용) */
export default function ViewTracker({ name }: { name: string }) {
  useEffect(() => recordViewed(name), [name]);
  return null;
}

"use client";

import { useEffect, useState } from "react";
import type { DocSection } from "@/lib/docSections";

let cached: DocSection[] | null = null;
let loading: Promise<DocSection[]> | null = null;

/** 문서 절별 수순 목록을 한 번만 받아 옵니다 (빌드 때 만든 정적 파일) */
export function useDocSections(): DocSection[] | null {
  const [sections, setSections] = useState<DocSection[] | null>(cached);
  useEffect(() => {
    if (sections) return;
    let cancelled = false;
    loading ??= fetch("/data/doc-lines")
      .then((response) => (response.ok ? response.json() : []))
      .then((data: DocSection[]) => (cached = data));
    loading
      .then((data) => {
        if (!cancelled) setSections(data);
      })
      .catch(() => {
        loading = null;
      });
    return () => {
      cancelled = true;
    };
  }, [sections]);
  return sections;
}

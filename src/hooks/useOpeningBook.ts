"use client";

import { useEffect, useState } from "react";
import {
  getLoadedOpeningBook,
  loadOpeningBook,
  type OpeningBook,
} from "@/lib/openingBook";

/** 오프닝 트리를 불러와 반환합니다 (불러오는 중에는 null) */
export function useOpeningBook(): OpeningBook | null {
  const [book, setBook] = useState<OpeningBook | null>(getLoadedOpeningBook);

  useEffect(() => {
    if (book) return;
    let cancelled = false;
    loadOpeningBook()
      .then((loaded) => {
        if (!cancelled) setBook(loaded);
      })
      .catch((error) =>
        console.error("오프닝 데이터를 불러오지 못했습니다:", error),
      );
    return () => {
      cancelled = true;
    };
  }, [book]);

  return book;
}

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Input } from "./ui/input";
import { useOpeningBook } from "@/hooks/useOpeningBook";
import type { DocRef } from "@/lib/docsIndex";
import {
  buildSearchIndex,
  searchOpenings,
  type SearchResult,
} from "@/lib/search";
import { cn } from "@/lib/utils";

interface OpeningSearchProps {
  docs: DocRef[];
  /** 결과를 고르면 호출 */
  onSelect: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

/**
 * 오프닝 검색창. 한국어(초성 포함)·영문(오타 허용)·ECO 코드·수순("e4 c5 Nf3")으로 찾습니다.
 * 검색은 모두 브라우저에서 합니다.
 */
const OpeningSearch: React.FC<OpeningSearchProps> = ({
  docs,
  onSelect,
  placeholder = "오프닝 검색 (시실리안, ㅅㅅㄹㅇ, Najdorf, B90, e4 c5 Nf3)",
  className,
  autoFocus,
}) => {
  const book = useOpeningBook();
  const index = useMemo(
    () => (book ? buildSearchIndex(book, docs) : null),
    [book, docs],
  );
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(
    () => (index && query.trim() ? searchOpenings(index, query, 30) : []),
    [index, query],
  );

  useEffect(() => setActiveIndex(0), [results]);

  // 바깥을 누르면 결과 목록 닫기
  useEffect(() => {
    const handleClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, []);

  // 키보드로 고른 항목이 보이도록
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const select = (result: SearchResult) => {
    onSelect(result);
    setQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (!isOpen || results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(results[activeIndex]);
    }
  };

  const showResults = isOpen && query.trim() !== "";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        role="combobox"
        aria-expanded={showResults}
        aria-controls="opening-search-results"
        aria-label="오프닝 검색"
        placeholder={placeholder}
        className="pl-9"
        value={query}
        autoFocus={autoFocus}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {showResults && (
        <ul
          ref={listRef}
          id="opening-search-results"
          role="listbox"
          className="absolute z-50 mt-1 max-h-[60vh] w-full min-w-[min(100vw-2rem,22rem)] overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg"
        >
          {!index ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              오프닝 데이터를 불러오는 중…
            </li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              검색 결과가 없습니다.
            </li>
          ) : (
            results.map((result, i) => (
              <li
                key={result.name}
                data-index={i}
                role="option"
                aria-selected={i === activeIndex}
                className={cn(
                  "cursor-pointer px-3 py-2",
                  i === activeIndex && "bg-muted",
                )}
                onPointerEnter={() => setActiveIndex(i)}
                onPointerDown={(event) => {
                  // 입력창 blur보다 먼저 선택되도록
                  event.preventDefault();
                  select(result);
                }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 text-sm font-medium">
                    {result.doc && (
                      <BookOpen
                        className="mr-1 inline size-3.5 text-primary"
                        aria-label="해설 문서 있음"
                      />
                    )}
                    {result.ko}
                    {result.exact && (
                      <span className="ml-1.5 rounded bg-primary/15 px-1 text-[10px] text-primary">
                        이 위치
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {result.eco}
                  </span>
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {result.name}
                </div>
                <div className="truncate font-mono text-xs text-muted-foreground">
                  {result.pgn}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default OpeningSearch;

"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";

interface OpeningSearchResult {
  eco: string;
  name: string;
  pgn: string;
  title?: string;
}

interface OpeningSearchProps {
  /** 결과를 선택하면 해당 오프닝의 수순을 보드에 표시 */
  onSelect: (pgn: string) => void;
}

/** 입력 후 검색 요청까지 기다리는 시간 (ms) */
const SEARCH_DELAY = 200;

/**
 * 오프닝 이름(영문·한국어)이나 ECO 코드로 오프닝을 검색하는 입력창
 */
const OpeningSearch: React.FC<OpeningSearchProps> = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OpeningSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 입력이 멈추면 검색하고, 다시 입력하면 이전 요청은 취소
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/openings/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const data: { results: OpeningSearchResult[] } = await response.json();
        setResults(data.results);
        setActiveIndex(0);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("오프닝 검색에 실패했습니다:", error);
        }
      }
    }, SEARCH_DELAY);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // 바깥을 클릭하면 결과 목록 닫기
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const select = (result: OpeningSearchResult) => {
    onSelect(result.pgn);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(results[activeIndex]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const showResults = isOpen && query.trim() !== "";

  return (
    <div ref={containerRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label="오프닝 검색"
        placeholder="오프닝 검색 (예: 시실리안, Najdorf, B90)"
        className="pl-9"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
          if (!event.target.value.trim()) setResults([]);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {showResults && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              검색 결과가 없습니다.
            </li>
          ) : (
            results.map((result, index) => (
              <li
                key={result.name}
                role="option"
                aria-selected={index === activeIndex}
                className={`cursor-pointer px-3 py-2 ${index === activeIndex ? "bg-muted" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => {
                  // 입력창 blur보다 먼저 선택되도록 mousedown 사용
                  event.preventDefault();
                  select(result);
                }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">
                    {result.title ? `${result.title} · ` : ""}
                    {result.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {result.eco}
                  </span>
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

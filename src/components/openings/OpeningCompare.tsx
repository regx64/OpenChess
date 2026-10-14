"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LineViewer from "@/components/board/LineViewer";
import OpeningSearch from "@/components/OpeningSearch";
import { useOpeningBook } from "@/hooks/useOpeningBook";
import type { DocRef } from "@/lib/docsIndex";
import type { CatalogEntry } from "@/lib/openingBook";
import { sansToPgn } from "@/lib/openingBook";
import { koreanName } from "@/lib/koName";
import { findBySlug, openingHref } from "@/lib/openingDetail";
import { cn, normalizeFileName } from "@/lib/utils";

/** 비교해 볼 만한 짝 */
const SUGGESTIONS: [string, string][] = [
  ["Italian Game", "Ruy Lopez"],
  ["Slav Defense", "Semi-Slav Defense"],
  ["Nimzo-Indian Defense", "Queen's Indian Defense"],
  ["Sicilian Defense: Najdorf Variation", "Sicilian Defense: Dragon Variation"],
  ["King's Indian Defense", "Grünfeld Defense"],
  ["French Defense", "Caro-Kann Defense"],
];

/** 주소의 ?a=…&b=… 와 동기화 */
function readParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

/**
 * 두 오프닝을 나란히 놓고 수순이 갈라지는 지점과 차이를 보여 줍니다.
 */
export default function OpeningCompare({ docs }: { docs: DocRef[] }) {
  const book = useOpeningBook();
  const [slugs, setSlugs] = useState<{ a: string | null; b: string | null }>({
    a: null,
    b: null,
  });
  const [ply, setPly] = useState<number | undefined>(undefined);

  useEffect(() => {
    setSlugs({ a: readParam("a"), b: readParam("b") });
  }, []);

  const choose = (side: "a" | "b", name: string) => {
    const next = { ...slugs, [side]: normalizeFileName(name) };
    setSlugs(next);
    setPly(undefined);
    const params = new URLSearchParams();
    if (next.a) params.set("a", next.a);
    if (next.b) params.set("b", next.b);
    window.history.replaceState(null, "", `?${params}`);
  };

  const a = book && slugs.a ? findBySlug(book, slugs.a) : null;
  const b = book && slugs.b ? findBySlug(book, slugs.b) : null;

  const comparison = useMemo(() => {
    if (!book || !a || !b) return null;
    const sa = book.path(a.node);
    const sb = book.path(b.node);
    let common = 0;
    while (
      common < sa.length &&
      common < sb.length &&
      sa[common] === sb[common]
    )
      common++;
    return {
      sa,
      sb,
      common,
      samePosition: book.key[a.node] === book.key[b.node],
    };
  }, [book, a, b]);

  const picker = (side: "a" | "b", entry: CatalogEntry | null) => (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground">
        오프닝 {side.toUpperCase()}
      </div>
      <OpeningSearch
        docs={docs}
        placeholder="오프닝 고르기"
        onSelect={(result) => choose(side, result.name)}
      />
      {entry && (
        <div>
          <Link
            href={openingHref(entry.name)}
            className="font-semibold hover:underline"
          >
            {koreanName(entry.name)}
          </Link>
          <div className="text-xs text-muted-foreground">
            {entry.eco} · {entry.name}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {picker("a", a)}
        {picker("b", b)}
      </div>

      {!comparison && (
        <div>
          <h2 className="text-sm font-semibold">이런 비교는 어떨까요?</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map(([x, y]) => (
              <button
                key={x + y}
                type="button"
                className="rounded-full border px-3 py-1 text-sm hover:bg-muted"
                onClick={() => {
                  const next = {
                    a: normalizeFileName(x),
                    b: normalizeFileName(y),
                  };
                  setSlugs(next);
                  setPly(undefined);
                  window.history.replaceState(
                    null,
                    "",
                    `?a=${next.a}&b=${next.b}`,
                  );
                }}
              >
                {koreanName(x)} vs {koreanName(y)}
              </button>
            ))}
          </div>
        </div>
      )}

      {comparison && a && b && (
        <>
          <section className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold">갈라지는 지점</h2>
            {comparison.samePosition ? (
              <p className="mt-1 text-sm">
                두 오프닝은 같은 위치에 도달합니다 (수순만 다른 트랜스포지션).
              </p>
            ) : comparison.common === 0 ? (
              <p className="mt-1 text-sm">첫 수부터 다릅니다.</p>
            ) : (
              <p className="mt-1 text-sm">
                <span className="font-mono">
                  {sansToPgn(comparison.sa.slice(0, comparison.common))}
                </span>
                까지 같습니다.
              </p>
            )}
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {[
                { label: "A", sans: comparison.sa },
                { label: "B", sans: comparison.sb },
              ].map(({ label, sans }) => (
                <p key={label}>
                  <span className="mr-1 font-semibold">{label}</span>
                  <span className="font-mono text-muted-foreground">
                    {sansToPgn(sans.slice(0, comparison.common))}{" "}
                  </span>
                  <span className="font-mono font-semibold text-primary">
                    {sansToPgn(
                      sans.slice(comparison.common),
                      comparison.common,
                    ) || "(여기서 끝)"}
                  </span>
                </p>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md bg-muted px-3 py-1 text-sm hover:bg-muted/70"
                onClick={() => setPly(comparison.common)}
              >
                갈라지기 직전 위치로
              </button>
              <button
                type="button"
                className="rounded-md bg-muted px-3 py-1 text-sm hover:bg-muted/70"
                onClick={() => setPly(undefined)}
              >
                각자 마지막 수로
              </button>
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              { label: "A", entry: a, sans: comparison.sa },
              { label: "B", entry: b, sans: comparison.sb },
            ].map(({ label, entry, sans }) => (
              <div key={label} className="mx-auto w-full max-w-[420px]">
                <LineViewer
                  pgn={entry.pgn}
                  ply={
                    ply === undefined ? undefined : Math.min(ply, sans.length)
                  }
                  onPlyChange={setPly}
                  header={
                    <p className={cn("text-sm font-semibold")}>
                      {label} · {koreanName(entry.name)}
                    </p>
                  }
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

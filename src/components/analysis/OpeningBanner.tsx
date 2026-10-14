"use client";

import React from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { OpeningBook } from "@/lib/openingBook";
import type { GameTree } from "@/lib/game/tree";
import { findDocForName, type DocRef } from "@/lib/docsIndex";

interface OpeningBannerProps {
  tree: GameTree;
  version: number;
  book: OpeningBook | null;
  docs: DocRef[];
}

/**
 * 현재 위치의 오프닝 이름, 한국어 문서, 이론 수순 안에 있는지 여부를 보여 줍니다.
 */
const OpeningBanner: React.FC<OpeningBannerProps> = ({ tree, book, docs }) => {
  const current = tree.current;

  if (current === tree.root) {
    return (
      <p className="text-sm text-muted-foreground">
        수를 두거나 오프닝을 검색해 보세요.
      </p>
    );
  }
  if (!book) {
    return (
      <p className="text-sm text-muted-foreground">
        오프닝 데이터를 불러오는 중…
      </p>
    );
  }

  const fens = tree.fensTo(current).reverse();
  const found = book.lookup(fens);
  // 처음으로 데이터셋에 없는 위치를 만든 수 = 이론을 벗어난 수 (현재 위치가 다시 이론 안이면 없음)
  const deviation =
    book.nodesAt(current.fen).length > 0
      ? undefined
      : tree
          .pathTo(current)
          .find((node) => book.nodesAt(node.fen).length === 0);

  if (!found) {
    return (
      <p className="text-sm text-muted-foreground">알려진 오프닝이 아닙니다.</p>
    );
  }

  const { opening } = found;
  const doc = findDocForName(docs, opening.name);

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-semibold text-foreground">
          {opening.eco}
        </span>
        {deviation ? (
          <span>
            <span className="font-mono">
              {deviation.moveNumber}
              {deviation.color === "w" ? "." : "..."} {deviation.san}
            </span>
            에서 이론을 벗어남
          </span>
        ) : (
          <span>이론 수순</span>
        )}
      </div>
      <p className="mt-1 font-semibold leading-snug">{opening.name}</p>
      {doc && (
        <Link
          href={`/openings/${doc.slug}`}
          className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <BookOpen className="size-3.5" />
          {doc.title} 해설
        </Link>
      )}
    </div>
  );
};

export default OpeningBanner;

"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Shuffle } from "lucide-react";
import type { OpeningBook } from "@/lib/openingBook";
import type { GameTree } from "@/lib/game/tree";
import { findDocForName, type DocRef } from "@/lib/docsIndex";
import { findDocSection } from "@/lib/docSections";
import { koreanName } from "@/lib/koName";
import { openingHref } from "@/lib/openingDetail";
import { useDocSections } from "@/hooks/useDocSections";
import { notesStore } from "@/lib/notes";

interface OpeningBannerProps {
  tree: GameTree;
  version: number;
  book: OpeningBook | null;
  docs: DocRef[];
}

/**
 * 현재 위치의 오프닝 이름, 이론 수순 안에 있는지, 트랜스포지션 여부, 관련 해설 절을 보여 줍니다.
 */
const OpeningBanner: React.FC<OpeningBannerProps> = ({ tree, book, docs }) => {
  const sections = useDocSections();
  const notes = notesStore.use();
  const current = tree.current;

  if (current === tree.root) {
    return (
      <p className="text-sm text-muted-foreground">
        수를 두거나 오프닝을 검색해 보세요. 탐색기 탭에서 다음 수 후보를 볼 수
        있습니다.
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

  const path = tree.pathTo(current);
  const sans = path.map((node) => node.san);
  const found = book.lookup(tree.fensTo(current).reverse());
  const inBook = book.nodesAt(current.fen);
  // 처음으로 데이터셋에 없는 위치를 만든 수 = 이론을 벗어난 수 (지금 위치가 다시 이론 안이면 없음)
  const deviation =
    inBook.length > 0
      ? undefined
      : path.find((node) => book.nodesAt(node.fen).length === 0);

  // 트랜스포지션: 데이터셋의 어떤 수순과도 순서가 다르게 이 위치에 도달
  const bookLines = tree.isStandardStart
    ? inBook.map((node) => book.path(node))
    : [];
  const transposedFrom =
    bookLines.length > 0 &&
    !bookLines.some((line) => line.join(" ") === sans.join(" "))
      ? bookLines.sort((a, b) => a.length - b.length)[0]
      : null;

  if (!found) {
    return (
      <p className="text-sm text-muted-foreground">알려진 오프닝이 아닙니다.</p>
    );
  }

  const { opening } = found;
  const doc = findDocForName(docs, opening.name);
  // 이 오프닝의 문서가 있으면 그 문서 안에서(앞으로 이어질 절 포함),
  // 없으면 모든 문서에서 이미 지나온 수순을 다루는 절만 찾음
  const section =
    sections && tree.isStandardStart
      ? doc
        ? findDocSection(sections, sans, [doc.slug])
        : findDocSection(sections, sans, undefined, true)
      : null;
  const sectionDoc =
    section && docs.find((d) => d.slug === section.section.slug);

  return (
    <div className="min-w-0 space-y-1.5">
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
      <Link
        href={openingHref(opening.name)}
        className="block leading-snug hover:underline"
      >
        <span className="font-semibold">{koreanName(opening.name)}</span>
        <span className="block text-xs text-muted-foreground">
          {opening.name}
        </span>
      </Link>
      {transposedFrom && (
        <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <Shuffle className="mt-0.5 size-3.5 shrink-0" />
          <span>
            트랜스포지션: 보통{" "}
            <span className="font-mono">{sansToLine(transposedFrom)}</span>{" "}
            순서로 도달하는 위치입니다.
          </span>
        </p>
      )}
      {notes[opening.name] && (
        <p className="line-clamp-3 rounded bg-muted px-2 py-1 text-xs">
          <span className="font-semibold">내 메모 </span>
          {notes[opening.name].text}
        </p>
      )}
      {section && sectionDoc ? (
        <Link
          href={`/openings/${sectionDoc.slug}#${section.section.anchor}`}
          className="flex items-start gap-1.5 text-sm text-primary hover:underline"
        >
          <BookOpen className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {sectionDoc.title} 해설 › {section.section.heading}
          </span>
        </Link>
      ) : (
        doc && (
          <Link
            href={`/openings/${doc.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <BookOpen className="size-3.5" />
            {doc.title} 해설
          </Link>
        )
      )}
    </div>
  );
};

function sansToLine(sans: string[]): string {
  return sans
    .map((san, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${san}` : san))
    .join(" ");
}

export default OpeningBanner;

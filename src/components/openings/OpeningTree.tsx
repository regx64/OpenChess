"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { useOpeningBook } from "@/hooks/useOpeningBook";
import type { OpeningBook } from "@/lib/openingBook";
import { sansToPgn } from "@/lib/openingBook";
import { koreanName } from "@/lib/koName";
import { boardHref, findBySlug, openingHref } from "@/lib/openingDetail";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NamedTree {
  /** 이름 붙은 노드 → 그 아래 가장 가까운 이름 붙은 노드들 */
  children: Map<number, number[]>;
  /** 이름 붙은 노드 → 가장 가까운 이름 붙은 조상 (-1은 맨 위) */
  parent: Map<number, number>;
  /** 이름 붙은 노드 → 아래에 있는 이름 붙은 노드 수 */
  size: Map<number, number>;
}

/** 이름 붙은 노드만 남긴 계보 트리 */
function buildNamedTree(book: OpeningBook): NamedTree {
  const children = new Map<number, number[]>([[-1, []]]);
  const parent = new Map<number, number>();
  for (let node = 1; node < book.size; node++) {
    if (book.nameOf[node] < 0) continue;
    const up = book.namedAncestor(node) ?? -1;
    parent.set(node, up);
    children.set(up, [...(children.get(up) ?? []), node]);
  }
  const size = new Map<number, number>();
  const count = (node: number): number => {
    const total = (children.get(node) ?? []).reduce(
      (sum, child) => sum + 1 + count(child),
      0,
    );
    size.set(node, total);
    return total;
  };
  count(-1);
  for (const list of children.values()) {
    list.sort((a, b) => (size.get(b) ?? 0) - (size.get(a) ?? 0) || a - b);
  }
  return { children, parent, size };
}

/**
 * 오프닝 계보 트리: 1. e4 → 1...c5 → … 처럼 모든 오프닝을 수순의 갈래로 보여 줍니다.
 */
export default function OpeningTree() {
  const book = useOpeningBook();
  const tree = useMemo(() => (book ? buildNamedTree(book) : null), [book]);
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [focus, setFocus] = useState<number | null>(null);
  const focusRef = useRef<HTMLLIElement>(null);

  // ?focus=<오프닝 주소 이름> 이면 그 오프닝까지 펼치고 스크롤
  useEffect(() => {
    if (!book || !tree) return;
    const slug = new URLSearchParams(window.location.search).get("focus");
    const entry = slug ? findBySlug(book, slug) : null;
    if (!entry) return;
    const path = new Set<number>();
    for (
      let n = tree.parent.get(entry.node);
      n !== undefined && n >= 0;
      n = tree.parent.get(n)
    ) {
      path.add(n);
    }
    setOpen(path);
    setFocus(entry.node);
  }, [book, tree]);

  useEffect(() => {
    focusRef.current?.scrollIntoView({ block: "center" });
  }, [focus]);

  if (!book || !tree) {
    return (
      <p className="text-sm text-muted-foreground">
        오프닝 데이터를 불러오는 중…
      </p>
    );
  }

  const toggle = (node: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(node)) next.delete(node);
      else next.add(node);
      return next;
    });

  const renderNode = (node: number, parentNode: number): React.ReactNode => {
    const opening = book.opening(node)!;
    const kids = tree.children.get(node) ?? [];
    const isOpen = open.has(node);
    const start = parentNode >= 0 ? book.depth(parentNode) : 0;
    const segment = sansToPgn(book.path(node).slice(start), start);
    return (
      <li key={node} ref={node === focus ? focusRef : undefined}>
        <div
          className={cn(
            "group flex items-start gap-1 rounded-md py-1 pr-1 hover:bg-muted/60",
            node === focus && "bg-primary/10 ring-1 ring-primary",
          )}
        >
          <button
            type="button"
            className={cn(
              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted",
              !kids.length && "invisible",
            )}
            aria-label={isOpen ? "접기" : "펼치기"}
            aria-expanded={isOpen}
            onClick={() => toggle(node)}
          >
            <ChevronRight
              className={cn(
                "size-4 transition-transform",
                isOpen && "rotate-90",
              )}
            />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-mono text-xs text-primary">{segment}</span>
              <Link
                href={openingHref(opening.name)}
                className="text-sm font-medium hover:underline"
              >
                {koreanName(opening.name)}
              </Link>
              <span className="font-mono text-[10px] text-muted-foreground">
                {opening.eco}
              </span>
              {kids.length > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  하위 {tree.size.get(node)}
                </span>
              )}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {opening.name}
            </div>
          </div>
          <Link
            href={boardHref(book.pgn(node))}
            className="mt-0.5 hidden shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground group-hover:block"
            title="분석 보드에서 보기"
            aria-label="분석 보드에서 보기"
          >
            <LayoutGrid className="size-4" />
          </Link>
        </div>
        {isOpen && kids.length > 0 && (
          <ul className="ml-3 border-l pl-2">
            {kids.map((kid) => renderNode(kid, node))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(new Set(tree.children.get(-1)))}
        >
          첫 수만 펼치기
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpen(new Set())}>
          모두 접기
        </Button>
      </div>
      <ul>
        {(tree.children.get(-1) ?? []).map((node) => renderNode(node, -1))}
      </ul>
    </div>
  );
}

"use client";

import React, { createContext, useContext, useRef, useState } from "react";
import { LayoutGrid, X } from "lucide-react";
import LineViewer from "@/components/board/LineViewer";
import { Button } from "@/components/ui/button";

interface DocBoardState {
  show: (pgn: string, label: string) => void;
}

const DocBoardContext = createContext<DocBoardState | null>(null);

/** 수순이 있는 문단 앞쪽에서 가장 가까운 절 제목 */
function nearestHeading(element: HTMLElement | null): string {
  let node: Element | null = element;
  while (node && node.tagName !== "ARTICLE") {
    for (
      let sibling = node.previousElementSibling;
      sibling;
      sibling = sibling.previousElementSibling
    ) {
      if (/^H[2-4]$/.test(sibling.tagName))
        return sibling.textContent?.trim() ?? "";
    }
    node = node.parentElement;
  }
  return "";
}

/**
 * 문서 옆(넓은 화면) 또는 아래 시트(모바일)에 보드를 두고,
 * 본문의 수순을 누르면 페이지를 떠나지 않고 그 보드에서 재생합니다.
 */
export function DocBoardLayout({
  mainPgn,
  title,
  children,
}: {
  mainPgn: string;
  title: string;
  children: React.ReactNode;
}) {
  const [line, setLine] = useState({ pgn: mainPgn, label: title });
  const [sheetOpen, setSheetOpen] = useState(false);

  const show = (pgn: string, label: string) => {
    setLine({ pgn, label: label || title });
    setSheetOpen(true);
  };

  const viewer = (
    <LineViewer
      key={line.pgn}
      pgn={line.pgn}
      header={
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{line.label}</p>
          <p className="break-words font-mono text-xs text-muted-foreground">
            {line.pgn}
          </p>
        </div>
      }
    />
  );

  return (
    <DocBoardContext.Provider value={{ show }}>
      <div className="mx-auto max-w-6xl px-4 xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-10">
        <div className="min-w-0">{children}</div>
        <aside className="hidden xl:block" aria-label="수순 보드">
          <div className="sticky top-20 py-8">{viewer}</div>
        </aside>
      </div>

      {/* 모바일·태블릿: 수순을 누르면 아래에서 올라오는 보드 */}
      {sheetOpen ? (
        <div
          className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 max-h-[78dvh] overflow-y-auto rounded-t-xl border-t bg-background p-3 shadow-2xl md:bottom-0 xl:hidden"
          role="dialog"
          aria-label="수순 보드"
        >
          <div className="mx-auto max-w-[420px]">
            <div className="mb-1 flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                aria-label="보드 닫기"
                onClick={() => setSheetOpen(false)}
              >
                <X />
              </Button>
            </div>
            {viewer}
          </div>
        </div>
      ) : (
        <Button
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-30 rounded-full shadow-lg md:bottom-6 xl:hidden"
          onClick={() => setSheetOpen(true)}
        >
          <LayoutGrid />
          보드
        </Button>
      )}
    </DocBoardContext.Provider>
  );
}

/** 본문의 `1. e4 ...` 수순. 누르면 문서 보드에서 재생 (보드가 없으면 분석 보드로 이동) */
export function MoveLine({ children }: { children: string }) {
  const context = useContext(DocBoardContext);
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      type="button"
      title="보드에서 보기"
      className="inline text-left align-baseline"
      onClick={() => {
        if (context) context.show(children, nearestHeading(ref.current));
        else window.location.href = `/?pgn=${encodeURIComponent(children)}`;
      }}
    >
      <code className="cursor-pointer hover:ring-1 hover:ring-primary">
        {children}
      </code>
    </button>
  );
}

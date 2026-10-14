"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAG_SYMBOLS, type GameTree, type MoveNode } from "@/lib/game/tree";
import { cn } from "@/lib/utils";

const NAG_LABELS: Record<number, string> = {
  1: "좋은 수",
  2: "실수",
  3: "아주 좋은 수",
  4: "큰 실수",
  5: "흥미로운 수",
  6: "의심스러운 수",
};

/**
 * 현재 수에 평가 기호(!, ? 등)와 메모를 다는 도구. 메모는 PGN 주석으로 저장됩니다.
 */
export default function AnnotationBar({
  tree,
  node,
}: {
  tree: GameTree;
  node: MoveNode;
}) {
  const [editing, setEditing] = useState(Boolean(node.comment));
  const [text, setText] = useState(node.comment ?? "");

  // 다른 수로 옮기면 그 수의 메모를 보여 줌
  useEffect(() => {
    setText(node.comment ?? "");
    setEditing(Boolean(node.comment));
  }, [node]);

  return (
    <div className="space-y-2 border-t p-2">
      <div className="flex flex-wrap items-center gap-1">
        {Object.entries(NAG_SYMBOLS).map(([nag, symbol]) => {
          const active = node.nags?.includes(Number(nag));
          return (
            <button
              key={nag}
              type="button"
              title={NAG_LABELS[Number(nag)]}
              aria-label={NAG_LABELS[Number(nag)]}
              aria-pressed={active}
              onClick={() => tree.toggleNag(node, Number(nag))}
              className={cn(
                "h-7 min-w-8 rounded border px-1.5 font-mono text-sm font-semibold transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {symbol}
            </button>
          );
        })}
        <Button
          variant={editing ? "secondary" : "ghost"}
          size="sm"
          className="ml-auto h-7"
          onClick={() => setEditing(!editing)}
        >
          <MessageSquare />
          메모
        </Button>
      </div>
      {editing && (
        <textarea
          aria-label="이 수에 대한 메모"
          placeholder="이 수에 대한 생각을 적어 두세요. PGN 주석으로 저장됩니다."
          className="min-h-16 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onBlur={() => {
            if ((node.comment ?? "") !== text.trim())
              tree.setComment(node, text);
          }}
        />
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { NAG_SYMBOLS, type GameTree, type MoveNode } from "@/lib/game/tree";

interface MoveListProps {
  tree: GameTree;
  /** useGameTree가 돌려준 값 (바뀔 때 다시 렌더링) */
  version: number;
  className?: string;
}

/**
 * 수순 목록. 본선은 굵게, 변화수는 괄호 안에 작게 표시하며 수를 누르면 그 위치로 이동합니다.
 */
const MoveList: React.FC<MoveListProps> = ({ tree, version, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const current = tree.current;

  // 현재 수가 보이도록 스크롤
  useEffect(() => {
    const element = containerRef.current?.querySelector<HTMLElement>(
      `[data-node="${current.id}"]`,
    );
    const container = containerRef.current;
    if (!element || !container) return;
    // 컨테이너가 relative라 offsetTop은 컨테이너 기준
    const top = element.offsetTop;
    if (
      top < container.scrollTop ||
      top > container.scrollTop + container.clientHeight - 40
    ) {
      container.scrollTo({
        top: top - container.clientHeight / 3,
        behavior: "smooth",
      });
    }
  }, [current, version]);

  const moveButton = (node: MoveNode, showNumber: boolean, main: boolean) => [
    <button
      key={node.id}
      type="button"
      data-node={node.id}
      onClick={() => tree.goTo(node)}
      className={cn(
        "rounded px-1 py-0.5 text-left font-mono transition-colors hover:bg-muted",
        main ? "font-semibold" : "text-muted-foreground",
        node === current &&
          "bg-primary text-primary-foreground hover:bg-primary",
      )}
    >
      {showNumber && (
        <span
          className={cn(
            "mr-0.5 font-normal",
            node !== current && "text-muted-foreground",
          )}
        >
          {node.color === "w"
            ? `${node.moveNumber}.`
            : `${node.moveNumber}...`}{" "}
        </span>
      )}
      {node.san}
      {node.nags?.map((nag) => NAG_SYMBOLS[nag] ?? "").join("")}
    </button>,
    // 복사하거나 화면 낭독기로 읽을 때 수 사이가 붙지 않도록
    " ",
  ];

  const comment = (node: MoveNode) =>
    node.comment ? (
      <span
        key={`c${node.id}`}
        className="mx-1 text-sm italic text-muted-foreground"
      >
        {node.comment}
      </span>
    ) : null;

  /** parent 다음 수들을 그림 (본선을 따라가며 변화수는 괄호로) */
  const renderLine = (
    parent: MoveNode,
    forceNumber: boolean,
    depth: number,
    main: boolean,
  ): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let node = parent;
    let force = forceNumber;
    while (node.children.length) {
      const [next, ...others] = node.children;
      elements.push(
        ...moveButton(next, next.color === "w" || force, main),
        comment(next),
      );
      force = Boolean(next.comment);

      for (const variation of others) {
        const inner = [
          ...moveButton(variation, true, false),
          comment(variation),
          ...renderLine(
            variation,
            Boolean(variation.comment),
            depth + 1,
            false,
          ),
        ];
        elements.push(
          depth === 0 && main ? (
            <div
              key={`v${variation.id}`}
              className="my-1 ml-2 border-l-2 border-muted pl-2 text-sm"
            >
              {inner}
            </div>
          ) : (
            <span
              key={`v${variation.id}`}
              className="text-sm text-muted-foreground"
            >
              ({inner})
            </span>
          ),
        );
      }
      if (others.length) force = true;
      node = next;
    }
    return elements;
  };

  const hasMoves = tree.root.children.length > 0;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-y-auto leading-7", className)}
      aria-label="수순"
    >
      {tree.root.comment && (
        <p className="mb-1 text-sm italic text-muted-foreground">
          {tree.root.comment}
        </p>
      )}
      {hasMoves ? (
        renderLine(tree.root, true, 0, true)
      ) : (
        <p className="py-2 text-sm text-muted-foreground">
          보드에서 기물을 움직이거나 위에서 오프닝을 검색하면 수순이 여기에
          기록됩니다.
        </p>
      )}
    </div>
  );
};

export default MoveList;

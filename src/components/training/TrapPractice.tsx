"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Chess } from "chess.js";
import LineViewer from "@/components/board/LineViewer";
import { DrillBoard } from "@/components/training/DrillBoard";
import { useLineDrill, type Verdict } from "@/hooks/useLineDrill";
import { useOpeningBook } from "@/hooks/useOpeningBook";
import type { Trap } from "@/data/traps";
import { koreanName } from "@/lib/koName";
import { openingHref } from "@/lib/openingDetail";
import { recordActivity, trapsStore } from "@/lib/training/progress";
import { cn } from "@/lib/utils";

type Mode = "watch" | "set" | "avoid";

const MODES: { id: Mode; label: string }[] = [
  { id: "watch", label: "수순 보기" },
  { id: "set", label: "함정 걸기" },
  { id: "avoid", label: "함정 피하기" },
];

/** 수순(SAN)과 각 위치 */
function useTrapLine(trap: Trap) {
  return useMemo(() => {
    const chess = new Chess();
    chess.loadPgn(trap.pgn);
    const sans = chess.history();
    const replay = new Chess();
    const fens = [replay.fen()];
    for (const san of sans) {
      replay.move(san);
      fens.push(replay.fen());
    }
    return { sans, fens };
  }, [trap]);
}

const sideName = (color: "w" | "b") => (color === "w" ? "백" : "흑");

export default function TrapPractice({ trap }: { trap: Trap }) {
  const book = useOpeningBook();
  const { sans, fens } = useTrapLine(trap);
  const [mode, setMode] = useState<Mode>("watch");
  const progress = trapsStore.use()[trap.id] ?? {};
  const victim = trap.trapper === "w" ? "b" : "w";

  // 함정이 나오는 오프닝: 실수 직전까지 지나온 위치 중 마지막으로 이름이 붙은 곳
  const opening = book?.lookup(
    fens.slice(0, trap.blunderPly + 1).reverse(),
  )?.opening;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {sideName(trap.trapper)}이 거는 함정
          {opening && (
            <>
              {" · "}
              <Link
                href={openingHref(opening.name)}
                className="hover:underline"
              >
                {koreanName(opening.name)}
              </Link>
            </>
          )}
        </p>
        <h1 className="text-3xl font-bold sm:text-4xl">{trap.title}</h1>
        <p>{trap.summary}</p>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">교훈 </span>
          {trap.lesson}
        </p>
        <p className="text-xs text-muted-foreground">
          걸기 {progress.set ? "✓ 성공" : "아직"} · 피하기{" "}
          {progress.avoid ? "✓ 성공" : "아직"}
        </p>
      </div>

      <div
        className="inline-flex flex-wrap gap-1 rounded-md bg-muted p-1"
        role="tablist"
      >
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            onClick={() => setMode(item.id)}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium",
              mode === item.id
                ? "bg-background shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-[560px] lg:mx-0">
        {mode === "watch" && (
          <LineViewer
            pgn={trap.pgn}
            initialPly={trap.blunderPly}
            orientation={trap.trapper}
          />
        )}
        {mode === "set" && <SetTrap key="set" trap={trap} sans={sans} />}
        {mode === "avoid" && (
          <AvoidTrap key="avoid" trap={trap} sans={sans} victim={victim} />
        )}
      </div>
    </div>
  );
}

/** 함정을 거는 쪽으로 두기: 상대는 실수까지 자동으로 둠 */
function SetTrap({ trap, sans }: { trap: Trap; sans: string[] }) {
  const drill = useLineDrill({
    sans,
    userColor: trap.trapper,
    onFinish: (result) => {
      if (result.success) {
        trapsStore.set((all) => ({
          ...all,
          [trap.id]: { ...all[trap.id], set: true },
        }));
        recordActivity("traps");
      }
    },
  });
  return (
    <DrillBoard drill={drill} userColor={trap.trapper}>
      {drill.finished && (
        <p className="text-sm font-semibold text-primary">
          {trap.outcome === "mate"
            ? "체크메이트! 함정을 완성했습니다."
            : "함정을 완성했습니다!"}
        </p>
      )}
    </DrillBoard>
  );
}

/** 함정에 걸리는 쪽으로 두기: 실수 수 차례에서 실수를 피하면 성공 */
function AvoidTrap({
  trap,
  sans,
  victim,
}: {
  trap: Trap;
  sans: string[];
  victim: "w" | "b";
}) {
  const [failed, setFailed] = useState(false);
  const drill = useLineDrill({
    sans: sans.slice(0, trap.blunderPly + 1),
    userColor: victim,
    judge: (ply, san): Verdict =>
      ply === trap.blunderPly
        ? san === trap.blunder
          ? "fail"
          : "finish"
        : san === sans[ply]
          ? "correct"
          : "wrong",
    describe: (verdict, ply, san) => {
      if (verdict === "fail")
        return `${san}?? 함정에 걸렸습니다. 아래에서 이어지는 수순을 확인하세요.`;
      if (verdict === "finish") {
        return trap.safe && san !== trap.safe
          ? `${san}: 함정을 피했습니다! (이 장면에서 흔히 두는 수는 ${trap.safe}입니다)`
          : `${san}: 함정을 피했습니다!`;
      }
      if (verdict === "wrong" && ply < trap.blunderPly) {
        return "함정이 나오는 장면까지는 수순대로 두어 주세요. 힌트를 눌러도 됩니다.";
      }
      return null;
    },
    onFinish: (result) => {
      setFailed(!result.success);
      if (result.success) {
        trapsStore.set((all) => ({
          ...all,
          [trap.id]: { ...all[trap.id], avoid: true },
        }));
        recordActivity("traps");
      }
    },
  });
  return (
    <div className="space-y-4">
      <DrillBoard
        drill={drill}
        userColor={victim}
        showHint={drill.ply < trap.blunderPly}
      >
        {!drill.finished && drill.ply === trap.blunderPly && (
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            함정 장면입니다. 어떤 수가 위험할지 생각해 보세요.
          </p>
        )}
      </DrillBoard>
      {failed && (
        <LineViewer
          pgn={trap.pgn}
          initialPly={trap.blunderPly + 1}
          orientation={victim}
        />
      )}
    </div>
  );
}

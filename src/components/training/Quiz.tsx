"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { Chess, type Square } from "chess.js";
import { CheckCircle2, Undo2, XCircle } from "lucide-react";
import Board, { type BoardMove } from "@/components/board/Board";
import { Button } from "@/components/ui/button";
import { useOpeningBook } from "@/hooks/useOpeningBook";
import type { DocRef } from "@/lib/docsIndex";
import { findDocForName } from "@/lib/docsIndex";
import { koreanName } from "@/lib/koName";
import { positionKey } from "@/lib/epd";
import type { CatalogEntry, OpeningBook } from "@/lib/openingBook";
import { boardHref, openingHref } from "@/lib/openingDetail";
import { playSound, soundForSan } from "@/lib/sound";
import { quizStore, recordActivity } from "@/lib/training/progress";
import {
  ecoChoices,
  nameChoices,
  pickQuestion,
  QUIZ_LEVELS,
  QUIZ_MODES,
  quizPool,
  type QuizLevel,
  type QuizMode,
} from "@/lib/training/quiz";
import { cn } from "@/lib/utils";

interface Question {
  answer: CatalogEntry;
  fen: string;
  choices: CatalogEntry[];
  ecoOptions: string[];
}

const fenOf = (book: OpeningBook, node: number) => {
  const chess = new Chess();
  for (const san of book.path(node)) chess.move(san);
  return chess.fen();
};

/**
 * 오프닝 퀴즈: 장면→이름, 이름→수순, 수순→ECO
 */
export default function Quiz({ docs }: { docs: DocRef[] }) {
  const book = useOpeningBook();
  const stats = quizStore.use();
  const [mode, setMode] = useState<QuizMode>("position");
  const [level, setLevel] = useState<QuizLevel>("basic");
  const [question, setQuestion] = useState<Question | null>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    picked?: string;
  } | null>(null);
  const [streak, setStreak] = useState(0);
  const recent = useRef<string[]>([]);

  const pool = useMemo(
    () =>
      book
        ? quizPool(book, level, (name) => findDocForName(docs, name) !== null)
        : [],
    [book, level, docs],
  );
  const ecoCodes = useMemo(
    () => (book ? [...new Set(book.catalog().map((entry) => entry.eco))] : []),
    [book],
  );

  const next = useCallback(() => {
    if (!book || !pool.length) return;
    const answer = pickQuestion(pool, recent.current);
    recent.current = [answer.name, ...recent.current].slice(0, 30);
    setQuestion({
      answer,
      fen: fenOf(book, answer.node),
      choices: nameChoices(
        book,
        answer,
        pool.length >= 8 ? pool : book.catalog(),
      ),
      ecoOptions: ecoChoices(answer.eco, ecoCodes),
    });
    setResult(null);
  }, [book, pool, ecoCodes]);

  useEffect(next, [next, mode]);

  const answer = (correct: boolean, picked?: string) => {
    if (result || !question) return;
    setResult({ correct, picked });
    playSound(correct ? "success" : "error");
    const nextStreak = correct ? streak + 1 : 0;
    setStreak(nextStreak);
    quizStore.set((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      total: s.total + 1,
      bestStreak: Math.max(s.bestStreak, nextStreak),
      solved:
        correct && !s.solved.includes(question.answer.name)
          ? [...s.solved, question.answer.name]
          : s.solved,
    }));
    recordActivity("quiz");
  };

  if (!book)
    return (
      <p className="text-sm text-muted-foreground">
        오프닝 데이터를 불러오는 중…
      </p>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 px-4 sm:px-0">
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">
            문제 유형
          </div>
          <div
            className="inline-flex flex-wrap gap-1 rounded-md bg-muted p-1"
            role="radiogroup"
            aria-label="문제 유형"
          >
            {QUIZ_MODES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={mode === item.id}
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
        </div>
        <label className="space-y-1">
          <span className="block text-xs font-medium text-muted-foreground">
            범위
          </span>
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value as QuizLevel)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            {QUIZ_LEVELS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div className="ml-auto text-right text-sm">
          <div>
            연속 <span className="font-semibold">{streak}</span> · 최고{" "}
            {stats.bestStreak}
          </div>
          <div className="text-xs text-muted-foreground">
            누적 {stats.correct}/{stats.total} 정답
          </div>
        </div>
      </div>

      <p className="px-4 text-sm text-muted-foreground sm:px-0">
        {QUIZ_MODES.find((item) => item.id === mode)?.description}
      </p>

      {question && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
          {mode === "moves" ? (
            <MovesQuestion
              key={question.answer.name}
              question={question}
              done={result !== null}
              onResult={(correct) => answer(correct)}
            />
          ) : (
            <Board fen={question.fen} movable="none" showCoordinates />
          )}

          <div className="space-y-4 px-3 sm:px-0">
            {mode === "position" && (
              <div className="grid gap-2">
                <p className="font-semibold">이 장면의 오프닝은?</p>
                {question.choices.map((choice) => (
                  <ChoiceButton
                    key={choice.name}
                    state={choiceState(
                      result,
                      choice.name,
                      question.answer.name,
                    )}
                    onClick={() =>
                      answer(choice.name === question.answer.name, choice.name)
                    }
                  >
                    <span className="block font-medium">
                      {koreanName(choice.name)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {choice.name}
                    </span>
                  </ChoiceButton>
                ))}
              </div>
            )}

            {mode === "eco" && (
              <div className="grid gap-2">
                <p className="font-semibold">이 수순의 ECO 코드는?</p>
                <p className="break-words font-mono text-sm">
                  {question.answer.pgn}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {question.ecoOptions.map((code) => (
                    <ChoiceButton
                      key={code}
                      state={choiceState(result, code, question.answer.eco)}
                      onClick={() => answer(code === question.answer.eco, code)}
                    >
                      <span className="font-mono text-lg font-semibold">
                        {code}
                      </span>
                    </ChoiceButton>
                  ))}
                </div>
              </div>
            )}

            {mode === "moves" && (
              <div>
                <p className="text-sm text-muted-foreground">
                  이 오프닝의 수순을 두어 보세요 (백·흑 모두)
                </p>
                <p className="mt-1 text-xl font-bold">
                  {koreanName(question.answer.name)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {question.answer.name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {question.answer.plies}수(반수)
                </p>
              </div>
            )}

            {result && (
              <div
                className={cn(
                  "space-y-2 rounded-lg border p-4",
                  result.correct
                    ? "border-primary/50 bg-primary/10"
                    : "border-destructive/50 bg-destructive/10",
                )}
              >
                <p className="flex items-center gap-2 font-semibold">
                  {result.correct ? (
                    <CheckCircle2 className="size-5 text-primary" />
                  ) : (
                    <XCircle className="size-5 text-destructive" />
                  )}
                  {result.correct ? "정답!" : "아쉬워요"}
                </p>
                <p>
                  <Link
                    href={openingHref(question.answer.name)}
                    className="font-semibold hover:underline"
                  >
                    {koreanName(question.answer.name)}
                  </Link>{" "}
                  <span className="font-mono text-sm text-muted-foreground">
                    {question.answer.eco}
                  </span>
                </p>
                <Link
                  href={boardHref(question.answer.pgn)}
                  className="block break-words font-mono text-sm hover:underline"
                >
                  {question.answer.pgn}
                </Link>
                <Button onClick={next} className="mt-2">
                  다음 문제
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type ChoiceState = "idle" | "correct" | "wrong" | "dim";

function choiceState(
  result: { correct: boolean; picked?: string } | null,
  value: string,
  answer: string,
): ChoiceState {
  if (!result) return "idle";
  if (value === answer) return "correct";
  if (value === result.picked) return "wrong";
  return "dim";
}

function ChoiceButton({
  state,
  onClick,
  children,
}: {
  state: ChoiceState;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={state !== "idle"}
      onClick={onClick}
      className={cn(
        "rounded-lg border p-3 text-left transition-colors",
        state === "idle" && "hover:bg-muted",
        state === "correct" && "border-primary bg-primary/15",
        state === "wrong" && "border-destructive bg-destructive/15",
        state === "dim" && "opacity-50",
      )}
    >
      {children}
    </button>
  );
}

/** 이름을 보고 수순 두기: 수 수가 같아지면 위치가 같은지(트랜스포지션 포함) 확인 */
function MovesQuestion({
  question,
  done,
  onResult,
}: {
  question: Question;
  done: boolean;
  onResult: (correct: boolean) => void;
}) {
  const [fens, setFens] = useState<string[]>([new Chess().fen()]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null,
  );
  const target = positionKey(question.fen);
  const plies = fens.length - 1;

  const onMove = (move: BoardMove) => {
    if (done) return;
    const chess = new Chess(fens[fens.length - 1]);
    let played;
    try {
      played = chess.move(move);
    } catch {
      return;
    }
    playSound(soundForSan(played.san));
    const next = [...fens, chess.fen()];
    setFens(next);
    setLastMove({ from: played.from, to: played.to });
    if (next.length - 1 >= question.answer.plies) {
      onResult(positionKey(chess.fen()) === target);
    }
  };

  return (
    <div className="space-y-2">
      <Board
        fen={done ? question.fen : fens[fens.length - 1]}
        movable={done ? "none" : "turn"}
        onMove={onMove}
        lastMove={done ? null : lastMove}
        className="rounded-none sm:rounded-md"
      />
      <div className="flex gap-2 px-3 sm:px-0">
        <Button
          variant="secondary"
          disabled={done || plies === 0}
          onClick={() => {
            setFens(fens.slice(0, -1));
            setLastMove(null);
          }}
        >
          <Undo2 />
          무르기
        </Button>
        <Button
          variant="outline"
          disabled={done}
          onClick={() => onResult(false)}
        >
          모르겠어요
        </Button>
        <span className="ml-auto self-center font-mono text-xs text-muted-foreground">
          {plies}/{question.answer.plies}
        </span>
      </div>
    </div>
  );
}

"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Chess, type Square } from "chess.js";
import { cn } from "@/lib/utils";
import { BOARD_THEMES, useSettings } from "@/lib/settings";
import { PIECE_NAMES } from "@/lib/constants";
import type { PieceType } from "@/types/chess";
import {
  ALL_SQUARES,
  type Color,
  isLightSquare,
  squareToXY,
  xyToSquare,
} from "./geometry";

export type ArrowColor = "green" | "red" | "blue" | "yellow" | "purple";

export interface Arrow {
  from: Square;
  /** from과 같으면 칸에 원을 그림 */
  to: Square;
  color?: ArrowColor;
  /** 0–1, 기본 1 (탐색기 후보수처럼 비중을 나타낼 때) */
  opacity?: number;
}

export interface BoardMove {
  from: Square;
  to: Square;
  promotion?: "q" | "r" | "b" | "n";
}

export interface BoardProps {
  fen: string;
  /** 아래쪽에 놓일 색 */
  orientation?: Color;
  /**
   * 움직일 수 있는 쪽: "turn"(둘 차례인 쪽, 기본), "w", "b", "none"(보기 전용)
   */
  movable?: "turn" | Color | "none";
  onMove?: (move: BoardMove) => void;
  lastMove?: { from: Square; to: Square } | null;
  /** 외부에서 그리는 화살표 (탐색기, 정답 표시 등) */
  arrows?: Arrow[];
  /** 칸 강조 색 (예: { e4: "rgba(255,0,0,.4)" }) */
  squareColors?: Partial<Record<Square, string>>;
  /** 우클릭으로 화살표·원 그리기 */
  drawable?: boolean;
  /**
   * 그린 화살표를 밖에서 관리할 때 (주면 위치가 바뀌어도 지우지 않음)
   */
  drawn?: Arrow[];
  /** 사용자가 그린 화살표가 바뀔 때 */
  onDrawChange?: (arrows: Arrow[]) => void;
  /** 그리기 모드: 터치·왼쪽 클릭으로도 그리기 (모바일용) */
  drawMode?: boolean;
  /** 그리기 모드의 색 */
  drawColor?: ArrowColor;
  /** 설정과 별개로 좌표 표시 여부를 강제 */
  showCoordinates?: boolean;
  className?: string;
}

const ARROW_COLORS: Record<ArrowColor, string> = {
  green: "rgba(21, 128, 61, 0.8)",
  red: "rgba(185, 28, 28, 0.8)",
  blue: "rgba(29, 78, 216, 0.8)",
  yellow: "rgba(202, 138, 4, 0.85)",
  purple: "rgba(124, 58, 237, 0.85)",
};

const PROMOTION_PIECES = ["q", "n", "r", "b"] as const;

interface PieceItem {
  id: number;
  square: Square;
  type: PieceType;
  color: Color;
}

/** FEN 기물 배치 부분을 빠르게 읽음 */
function parsePlacement(fen: string): Omit<PieceItem, "id">[] {
  const pieces: Omit<PieceItem, "id">[] = [];
  const rows = fen.split(" ")[0].split("/");
  rows.forEach((row, rowIndex) => {
    let file = 0;
    for (const char of row) {
      if (/\d/.test(char)) {
        file += Number(char);
        continue;
      }
      const color: Color = char === char.toUpperCase() ? "w" : "b";
      pieces.push({
        square: `${"abcdefgh"[file]}${8 - rowIndex}` as Square,
        type: char.toLowerCase() as PieceType,
        color,
      });
      file++;
    }
  });
  return pieces;
}

const distance = (a: Square, b: Square) =>
  Math.abs(a.charCodeAt(0) - b.charCodeAt(0)) +
  Math.abs(Number(a[1]) - Number(b[1]));

/**
 * 위치가 바뀌어도 같은 기물은 같은 id를 유지해, 칸만 바뀐 기물이 미끄러지듯 움직이게 합니다.
 */
function usePieceItems(fen: string): PieceItem[] {
  const previous = useRef<PieceItem[]>([]);
  const nextId = useRef(1);

  const items = useMemo(() => {
    const next = parsePlacement(fen);
    const unmatched = [...previous.current];
    const result: (PieceItem | null)[] = next.map(() => null);

    // 1) 같은 칸에 같은 기물이 그대로 있는 경우
    next.forEach((piece, index) => {
      const at = unmatched.findIndex(
        (old) =>
          old.square === piece.square &&
          old.type === piece.type &&
          old.color === piece.color,
      );
      if (at >= 0) {
        result[index] = { ...piece, id: unmatched[at].id };
        unmatched.splice(at, 1);
      }
    });
    // 2) 다른 칸으로 옮겨 간 경우: 같은 종류 중 가장 가까운 기물
    next.forEach((piece, index) => {
      if (result[index]) return;
      let best = -1;
      unmatched.forEach((old, i) => {
        if (old.type !== piece.type || old.color !== piece.color) return;
        if (
          best < 0 ||
          distance(old.square, piece.square) <
            distance(unmatched[best].square, piece.square)
        ) {
          best = i;
        }
      });
      if (best >= 0) {
        result[index] = { ...piece, id: unmatched[best].id };
        unmatched.splice(best, 1);
      } else {
        result[index] = { ...piece, id: nextId.current++ };
      }
    });
    return result as PieceItem[];
  }, [fen]);

  useLayoutEffect(() => {
    previous.current = items;
  }, [items]);

  return items;
}

export const pieceImage = (color: Color, type: PieceType) =>
  `/pieces/${color === "w" ? "white" : "black"}/${color}${type}.svg`;

interface DragState {
  from: Square;
  startX: number;
  startY: number;
  x: number;
  y: number;
  started: boolean;
  /** 누르기 전에 이미 선택된 기물이었는지 (다시 누르면 선택 해제) */
  wasSelected: boolean;
}

/**
 * 체스보드. 클릭·드래그(마우스·터치)로 수를 두고, 화살표와 강조 표시를 그립니다.
 * 위치(fen)는 밖에서 관리하고, 둔 수는 onMove로 알려 줍니다.
 */
const Board: React.FC<BoardProps> = ({
  fen,
  orientation = "w",
  movable = "turn",
  onMove,
  lastMove,
  arrows = [],
  squareColors,
  drawable = true,
  drawn: controlledDrawn,
  onDrawChange,
  drawMode = false,
  drawColor = "green",
  showCoordinates,
  className,
}) => {
  const settings = useSettings();
  const theme = BOARD_THEMES[settings.boardTheme] ?? BOARD_THEMES.green;
  const coordinates = showCoordinates ?? settings.showCoordinates;
  const boardRef = useRef<HTMLDivElement>(null);

  const [selected, setSelected] = useState<Square | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [promotion, setPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [innerDrawn, setInnerDrawn] = useState<Arrow[]>([]);
  const drawn = controlledDrawn ?? innerDrawn;
  const setDrawn = useCallback(
    (update: Arrow[] | ((current: Arrow[]) => Arrow[])) => {
      const next = typeof update === "function" ? update(drawn) : update;
      if (controlledDrawn) onDrawChange?.(next);
      else setInnerDrawn(next);
    },
    [drawn, controlledDrawn, onDrawChange],
  );
  const drawStart = useRef<Square | null>(null);
  /** 드래그로 놓은 칸은 애니메이션 없이 바로 표시 */
  const droppedOn = useRef<Square | null>(null);

  const pieces = usePieceItems(fen);
  const pieceAt = useMemo(
    () => new Map(pieces.map((piece) => [piece.square, piece])),
    [pieces],
  );

  // 둘 수 있는 수: 출발 칸 → 도착 칸 목록
  const { dests, checkSquare } = useMemo(() => {
    const dests = new Map<Square, Square[]>();
    let checkSquare: Square | null = null;
    try {
      const chess = new Chess(fen);
      const turn = chess.turn();
      if (chess.inCheck()) {
        checkSquare =
          pieces.find((p) => p.type === "k" && p.color === turn)?.square ??
          null;
      }
      const side = movable === "turn" ? turn : movable;
      if (side === turn && onMove) {
        for (const move of chess.moves({ verbose: true })) {
          dests.set(move.from, [...(dests.get(move.from) ?? []), move.to]);
        }
      }
    } catch {
      // 잘못된 FEN이면 보기 전용
    }
    return { dests, checkSquare };
  }, [fen, movable, onMove, pieces]);

  // 위치가 바뀌면 선택 초기화 (그림은 밖에서 관리하지 않을 때만 지움)
  useEffect(() => {
    setSelected(null);
    setPromotion(null);
    setInnerDrawn([]);
    droppedOn.current = null;
  }, [fen]);

  const squareFromPoint = useCallback(
    (clientX: number, clientY: number): Square | null => {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const x = Math.floor(((clientX - rect.left) / rect.width) * 8);
      const y = Math.floor(((clientY - rect.top) / rect.height) * 8);
      if (x < 0 || x > 7 || y < 0 || y > 7) return null;
      return xyToSquare(x, y, orientation);
    },
    [orientation],
  );

  const tryMove = useCallback(
    (from: Square, to: Square, dropped: boolean) => {
      if (!dests.get(from)?.includes(to)) return false;
      const piece = pieceAt.get(from);
      if (piece?.type === "p" && (to[1] === "8" || to[1] === "1")) {
        setPromotion({ from, to });
        setSelected(null);
        return true;
      }
      if (dropped) droppedOn.current = to;
      setSelected(null);
      onMove?.({ from, to });
      return true;
    },
    [dests, pieceAt, onMove],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const square = squareFromPoint(event.clientX, event.clientY);
    if (!square) return;

    if (event.button === 2 || (drawMode && event.button === 0)) {
      if (drawable) {
        drawStart.current = square;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      return;
    }
    if (event.button !== 0) return;
    // 밖에서 관리하는 그림은 저장된 주석이므로 클릭만으로 지우지 않음
    if (!controlledDrawn && drawn.length) setDrawn([]);

    if (promotion) {
      setPromotion(null);
      return;
    }

    if (selected && selected !== square && tryMove(selected, square, false)) {
      return;
    }

    if (dests.has(square)) {
      event.currentTarget.setPointerCapture(event.pointerId);
      const rect = boardRef.current!.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setDrag({
        from: square,
        startX: x,
        startY: y,
        x,
        y,
        started: false,
        wasSelected: selected === square,
      });
      setSelected(square);
    } else {
      setSelected(null);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const rect = boardRef.current!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const started =
      drag.started ||
      Math.hypot(x - drag.startX, y - drag.startY) > rect.width / 64;
    setDrag({ ...drag, x, y, started });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const square = squareFromPoint(event.clientX, event.clientY);

    if ((event.button === 2 || drawMode) && drawStart.current) {
      const from = drawStart.current;
      drawStart.current = null;
      if (!square) return;
      const color: ArrowColor = drawMode
        ? drawColor
        : event.shiftKey
          ? "red"
          : event.altKey || event.ctrlKey || event.metaKey
            ? "blue"
            : "green";
      setDrawn((current) => {
        const exists = current.find((a) => a.from === from && a.to === square);
        const rest = current.filter(
          (a) => !(a.from === from && a.to === square),
        );
        return exists && exists.color === color
          ? rest
          : [...rest, { from, to: square, color }];
      });
      return;
    }

    if (!drag) return;
    setDrag(null);
    if (drag.started) {
      if (square && square !== drag.from && tryMove(drag.from, square, true))
        return;
      if (square !== drag.from) setSelected(null);
    } else if (drag.wasSelected) {
      setSelected(null);
    }
  };

  const choosePromotion = (piece: (typeof PROMOTION_PIECES)[number]) => {
    if (!promotion) return;
    onMove?.({ ...promotion, promotion: piece });
    setPromotion(null);
  };

  const hoverSquare =
    drag?.started && boardRef.current
      ? squareFromPoint(
          boardRef.current.getBoundingClientRect().left + drag.x,
          boardRef.current.getBoundingClientRect().top + drag.y,
        )
      : null;
  const targets =
    selected && settings.showLegalMoves ? (dests.get(selected) ?? []) : [];
  const allArrows = [...arrows, ...drawn];
  const animationMs = settings.animationMs;

  return (
    <div
      ref={boardRef}
      role="application"
      aria-label="체스보드"
      className={cn(
        "relative aspect-square w-full select-none touch-none overflow-hidden rounded-md shadow-md",
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setDrag(null)}
      onContextMenu={(event) => event.preventDefault()}
    >
      {/* 칸 */}
      {ALL_SQUARES.map((square) => {
        const [x, y] = squareToXY(square, orientation);
        const light = isLightSquare(square);
        const highlight =
          square === selected
            ? "rgba(255, 214, 10, 0.5)"
            : settings.highlightLastMove &&
                (square === lastMove?.from || square === lastMove?.to)
              ? "rgba(255, 214, 10, 0.35)"
              : undefined;
        return (
          <div
            key={square}
            className="absolute"
            style={{
              left: `${x * 12.5}%`,
              top: `${y * 12.5}%`,
              width: "12.5%",
              height: "12.5%",
              backgroundColor: light ? theme.light : theme.dark,
            }}
          >
            {highlight && (
              <div
                className="absolute inset-0"
                style={{ backgroundColor: highlight }}
              />
            )}
            {squareColors?.[square] && (
              <div
                className="absolute inset-0"
                style={{ backgroundColor: squareColors[square] }}
              />
            )}
            {square === checkSquare && (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,0,0,0.9) 0%, rgba(231,0,0,0.6) 30%, rgba(169,0,0,0) 75%)",
                }}
              />
            )}
            {square === hoverSquare && (
              <div className="absolute inset-0 ring-4 ring-inset ring-white/60" />
            )}
            {coordinates && x === 0 && (
              <span
                className="absolute left-[3%] top-[2%] text-[clamp(8px,1.6vmin,13px)] font-semibold leading-none"
                style={{ color: light ? theme.dark : theme.light }}
              >
                {square[1]}
              </span>
            )}
            {coordinates && y === 7 && (
              <span
                className="absolute bottom-[2%] right-[4%] text-[clamp(8px,1.6vmin,13px)] font-semibold leading-none"
                style={{ color: light ? theme.dark : theme.light }}
              >
                {square[0]}
              </span>
            )}
          </div>
        );
      })}

      {/* 기물 */}
      {pieces.map((piece) => {
        const [x, y] = squareToXY(piece.square, orientation);
        const dragging = drag?.started && drag.from === piece.square;
        const instant = droppedOn.current === piece.square;
        return (
          <React.Fragment key={piece.id}>
            {dragging && (
              <img
                src={pieceImage(piece.color, piece.type)}
                alt=""
                draggable={false}
                className="pointer-events-none absolute opacity-30"
                style={{
                  width: "12.5%",
                  height: "12.5%",
                  transform: `translate(${x * 100}%, ${y * 100}%)`,
                }}
              />
            )}
            <img
              src={pieceImage(piece.color, piece.type)}
              alt={`${piece.color === "w" ? "백" : "흑"} ${PIECE_NAMES[piece.type]}`}
              draggable={false}
              className={cn(
                "pointer-events-none absolute left-0 top-0",
                dragging ? "z-30 scale-110 drop-shadow-lg" : "z-10",
              )}
              style={{
                width: "12.5%",
                height: "12.5%",
                transform: dragging
                  ? `translate(calc(${drag!.x}px - 50%), calc(${drag!.y}px - 50%))`
                  : `translate(${x * 100}%, ${y * 100}%)`,
                transition:
                  dragging || instant || !animationMs
                    ? "none"
                    : `transform ${animationMs}ms ease`,
              }}
            />
          </React.Fragment>
        );
      })}

      {/* 둘 수 있는 칸 */}
      {targets.map((square) => {
        const [x, y] = squareToXY(square, orientation);
        const capture = pieceAt.has(square);
        return (
          <div
            key={square}
            className="pointer-events-none absolute z-20 flex items-center justify-center"
            style={{
              left: `${x * 12.5}%`,
              top: `${y * 12.5}%`,
              width: "12.5%",
              height: "12.5%",
            }}
          >
            {capture ? (
              <div className="size-full rounded-full border-[6px] border-black/25" />
            ) : (
              <div className="size-[30%] rounded-full bg-black/25" />
            )}
          </div>
        );
      })}

      {/* 화살표 */}
      {allArrows.length > 0 && (
        <ArrowLayer arrows={allArrows} orientation={orientation} />
      )}

      {/* 승격 기물 선택 */}
      {promotion && (
        <div
          className="absolute inset-0 z-40 bg-black/40"
          onPointerDown={(event) => {
            event.stopPropagation();
            setPromotion(null);
          }}
        >
          {PROMOTION_PIECES.map((piece, index) => {
            const [x, y0] = squareToXY(promotion.to, orientation);
            const y = y0 === 0 ? index : 7 - index;
            const color = pieceAt.get(promotion.from)?.color ?? "w";
            return (
              <button
                key={piece}
                type="button"
                aria-label={`${PIECE_NAMES[piece]}로 승격`}
                className="absolute rounded-full bg-white/90 shadow-lg transition hover:bg-white"
                style={{
                  left: `${x * 12.5}%`,
                  top: `${y * 12.5}%`,
                  width: "12.5%",
                  height: "12.5%",
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  choosePromotion(piece);
                }}
              >
                <img
                  src={pieceImage(color, piece)}
                  alt=""
                  draggable={false}
                  className="size-full"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** 화살표와 원을 그리는 SVG 층 (좌표계: 한 칸 = 100) */
function ArrowLayer({
  arrows,
  orientation,
}: {
  arrows: Arrow[];
  orientation: Color;
}) {
  const center = (square: Square) => {
    const [x, y] = squareToXY(square, orientation);
    return [x * 100 + 50, y * 100 + 50];
  };
  return (
    <svg
      viewBox="0 0 800 800"
      className="pointer-events-none absolute inset-0 z-30 size-full"
      aria-hidden
    >
      <defs>
        {Object.entries(ARROW_COLORS).map(([name, color]) => (
          <marker
            key={name}
            id={`arrowhead-${name}`}
            markerWidth="4"
            markerHeight="4"
            refX="2.05"
            refY="2"
            orient="auto"
          >
            <path d="M0,0 V4 L3,2 Z" fill={color} />
          </marker>
        ))}
      </defs>
      {arrows.map((arrow, index) => {
        const color = arrow.color ?? "green";
        const [x1, y1] = center(arrow.from);
        const [x2, y2] = center(arrow.to);
        if (arrow.from === arrow.to) {
          return (
            <circle
              key={index}
              cx={x1}
              cy={y1}
              r={44}
              fill="none"
              stroke={ARROW_COLORS[color]}
              strokeWidth={8}
              opacity={arrow.opacity ?? 1}
            />
          );
        }
        // 화살촉이 칸 중앙에 오도록 끝을 조금 당김
        const length = Math.hypot(x2 - x1, y2 - y1);
        const shorten = 30;
        const ex = x2 - ((x2 - x1) / length) * shorten;
        const ey = y2 - ((y2 - y1) / length) * shorten;
        return (
          <line
            key={index}
            x1={x1}
            y1={y1}
            x2={ex}
            y2={ey}
            stroke={ARROW_COLORS[color]}
            strokeWidth={16}
            strokeLinecap="round"
            markerEnd={`url(#arrowhead-${color})`}
            opacity={arrow.opacity ?? 1}
          />
        );
      })}
    </svg>
  );
}

export default React.memo(Board);

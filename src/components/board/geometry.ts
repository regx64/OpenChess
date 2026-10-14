import type { Square } from "chess.js";

export type Color = "w" | "b";

export const FILES = "abcdefgh";

/** 칸 → 화면상 (열, 행) 0–7. 보드 방향(아래쪽 색)에 따라 뒤집힘 */
export function squareToXY(
  square: Square,
  orientation: Color,
): [number, number] {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  return orientation === "w" ? [file, 7 - rank] : [7 - file, rank];
}

/** 화면상 (열, 행) → 칸 */
export function xyToSquare(x: number, y: number, orientation: Color): Square {
  const file = orientation === "w" ? x : 7 - x;
  const rank = orientation === "w" ? 7 - y : y;
  return `${FILES[file]}${rank + 1}` as Square;
}

export const isLightSquare = (square: Square): boolean =>
  (square.charCodeAt(0) - 97 + Number(square[1])) % 2 === 0;

export const ALL_SQUARES: Square[] = Array.from(
  { length: 64 },
  (_, i) => `${FILES[i % 8]}${Math.floor(i / 8) + 1}` as Square,
);

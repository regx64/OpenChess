"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Square } from "chess.js";
import type {
  Board,
  OpeningInfo,
  TopGame,
  ChessMove,
  BoardPosition,
  GameState,
} from "@/types/chess";
import { ChessGameManager } from "@/lib/ChessGameManager";
import { fetchOpeningFromLichess, findLastKnownOpening } from "@/lib/api";

interface UseChessGameReturn {
  // 게임 상태
  gameManager: ChessGameManager;
  board: Board;
  gameState: GameState;

  // UI 상태
  selectedSquare: BoardPosition | null;
  lastMove: ChessMove | null;
  possibleMoves: Square[];

  // 오프닝 정보
  openingInfo: OpeningInfo | null;
  topGames: TopGame[];
  isLastKnownOpening: boolean;

  // 액션들
  selectSquare: (position: BoardPosition) => void;
  makeMove: (from: BoardPosition, to: BoardPosition) => boolean;
  resetGame: () => void;
  undoMove: () => void;
  loadFromPgn: (pgn: string) => boolean;
  clearSelection: () => void;
}

export const useChessGame = (): UseChessGameReturn => {
  // 게임 매니저 초기화
  const [gameManager] = useState(() => new ChessGameManager());

  // 게임 상태
  const [board, setBoard] = useState<Board>(gameManager.getBoard());
  const [gameState, setGameState] = useState<GameState>(
    gameManager.getGameState(),
  );

  // UI 상태
  const [selectedSquare, setSelectedSquare] = useState<BoardPosition | null>(
    null,
  );
  const [lastMove, setLastMove] = useState<ChessMove | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);

  // 오프닝 정보
  const [openingInfo, setOpeningInfo] = useState<OpeningInfo | null>(null);
  const [topGames, setTopGames] = useState<TopGame[]>([]);
  const [isLastKnownOpening, setIsLastKnownOpening] = useState<boolean>(false);

  /**
   * 게임 상태를 업데이트하는 헬퍼 함수
   */
  const updateGameState = useCallback(() => {
    setBoard(gameManager.getBoard());
    setGameState(gameManager.getGameState());
  }, [gameManager]);

  /**
   * 이 FEN에서 오프닝이 없으면 마지막 알려진 오프닝까지 되짚어 찾음 (PGN 로드 시 설정)
   */
  const backtrackFenRef = useRef<string | null>(null);

  /**
   * 선택 상태를 클리어하는 함수
   */
  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setPossibleMoves([]);
  }, []);

  /**
   * 사각형을 선택하는 함수
   */
  const selectSquare = useCallback(
    (position: BoardPosition) => {
      setSelectedSquare(position);
      const moves = gameManager.getPossibleMoves(position);
      setPossibleMoves(moves);
    },
    [gameManager],
  );

  /**
   * 체스 이동을 실행하는 함수
   */
  const makeMove = useCallback(
    (from: BoardPosition, to: BoardPosition): boolean => {
      const success = gameManager.makeMove(from, to);

      if (success) {
        updateGameState();
        setLastMove({ from, to });
        clearSelection();
        return true;
      }

      return false;
    },
    [gameManager, updateGameState, clearSelection],
  );

  /**
   * 게임을 리셋하는 함수
   */
  const resetGame = useCallback(() => {
    gameManager.reset();
    updateGameState();
    setLastMove(null);
    clearSelection();
    setOpeningInfo(null);
    setTopGames([]);
    setIsLastKnownOpening(false);
  }, [gameManager, updateGameState, clearSelection]);

  /**
   * 마지막 이동을 취소하는 함수
   */
  const undoMove = useCallback(() => {
    const success = gameManager.undoLastMove();

    if (success) {
      updateGameState();
      setLastMove(null);
      clearSelection();

      // 초기 위치라면 오프닝 정보 리셋
      if (gameManager.isInitialPosition()) {
        setOpeningInfo(null);
        setTopGames([]);
        setIsLastKnownOpening(false);
      }
    }
  }, [gameManager, updateGameState, clearSelection]);

  /**
   * PGN에서 게임을 로드하는 함수
   */
  const loadFromPgn = useCallback(
    (pgn: string): boolean => {
      const success = gameManager.loadFromPgn(pgn);

      if (success) {
        updateGameState();
        clearSelection();
        setLastMove(null);

        // 오프닝 조회는 FEN 변경 effect에서 처리 (현재 위치에 없으면 되짚어 찾기)
        backtrackFenRef.current = gameManager.getGameState().fen;

        return true;
      }

      return false;
    },
    [gameManager, updateGameState, clearSelection],
  );

  // FEN이 변경될 때마다 오프닝 정보 가져오기
  // 위치가 다시 바뀌면 이전 요청을 취소해 늦게 도착한 응답이 최신 결과를 덮어쓰지 않도록 함
  useEffect(() => {
    const backtrack = backtrackFenRef.current === gameState.fen;

    if (!gameState.fen || gameManager.isInitialPosition()) {
      setOpeningInfo(null);
      setTopGames([]);
      setIsLastKnownOpening(false);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      let result = await fetchOpeningFromLichess(
        gameState.fen,
        controller.signal,
      );
      let isLastKnown = false;

      if (!result.opening && backtrack) {
        // 현재 위치의 오프닝은 이미 확인했으므로 이전 위치부터 탐색
        const backtrackFens = gameManager.generateBacktrackFens().slice(1);
        result = await findLastKnownOpening(backtrackFens, controller.signal);
        isLastKnown = result.opening !== null;
      }

      if (controller.signal.aborted) return;
      setOpeningInfo(result.opening);
      setTopGames(result.topGames);
      setIsLastKnownOpening(isLastKnown);
    };

    load().catch((error) => {
      if (controller.signal.aborted) return;
      console.error("오프닝 정보를 가져오는데 실패했습니다:", error);
      setOpeningInfo(null);
      setTopGames([]);
      setIsLastKnownOpening(false);
    });

    return () => controller.abort();
  }, [gameState.fen, gameManager]);

  return {
    gameManager,
    board,
    gameState,
    selectedSquare,
    lastMove,
    possibleMoves,
    openingInfo,
    topGames,
    isLastKnownOpening,
    selectSquare,
    makeMove,
    resetGame,
    undoMove,
    loadFromPgn,
    clearSelection,
  };
};

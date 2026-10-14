"use client";

import React, { useState } from "react";
import { FileUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GameTree } from "@/lib/game/tree";

/** FEN처럼 보이는지 (기물 배치 8줄) */
const looksLikeFen = (text: string) =>
  /^([^\s/]+\/){7}[^\s/]+(\s|$)/.test(text.trim());

/**
 * PGN(변화수·주석 포함) 또는 FEN을 붙여 넣거나 파일로 불러오는 창
 */
const ImportDialog: React.FC<{ tree: GameTree }> = ({ tree }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("PGN이나 FEN을 입력해 주세요.");
      return;
    }
    const ok = looksLikeFen(trimmed)
      ? tree.loadFen(trimmed)
      : tree.loadPgn(trimmed);
    if (!ok) {
      setError(
        looksLikeFen(trimmed)
          ? "올바른 FEN이 아닙니다."
          : "PGN을 읽지 못했습니다. 둘 수 없는 수나 짝이 맞지 않는 괄호가 있는지 확인해 주세요.",
      );
      return;
    }
    setText("");
    setError(null);
    setOpen(false);
  };

  const loadFile = async (file: File) => {
    const content = await file.text();
    setText(content);
    load(content);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title="PGN·FEN 불러오기"
          aria-label="PGN·FEN 불러오기"
        >
          <FileUp />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>PGN·FEN 불러오기</DialogTitle>
          <DialogDescription>
            PGN(변화수·주석 포함)이나 FEN을 붙여 넣거나 .pgn 파일을 고르세요.
          </DialogDescription>
        </DialogHeader>

        <textarea
          aria-label="PGN 또는 FEN"
          className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder={
            "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6\n또는\nrnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
          }
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError(null);
          }}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              파일 선택
              <input
                type="file"
                accept=".pgn,.txt,application/x-chess-pgn,text/plain"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void loadFile(file);
                  event.target.value = "";
                }}
              />
            </label>
          </Button>
          <Button onClick={() => load(text)}>불러오기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;

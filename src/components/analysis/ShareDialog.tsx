"use client";

import React from "react";
import { Copy, Download, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { GameTree } from "@/lib/game/tree";

/** 오늘 날짜를 PGN 형식(YYYY.MM.DD)으로 */
const pgnDate = () => new Date().toISOString().slice(0, 10).replace(/-/g, ".");

/** 문자열을 파일로 내려받기 */
export function downloadText(
  filename: string,
  text: string,
  type = "text/plain",
) {
  const url = URL.createObjectURL(
    new Blob([text], { type: `${type};charset=utf-8` }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * 현재 위치 링크, FEN, PGN을 복사하거나 PGN 파일로 저장하는 창
 */
const ShareDialog: React.FC<{ tree: GameTree; version: number }> = ({
  tree,
}) => {
  const { toast } = useToast();

  const line = tree.linePgn();
  const link =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/?${
          tree.isStandardStart
            ? `pgn=${encodeURIComponent(line)}`
            : `fen=${encodeURIComponent(tree.current.fen)}`
        }`;
  const fen = tree.current.fen;
  const pgn = tree.toPgn();

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label}을(를) 복사했습니다.` });
    } catch {
      toast({ variant: "destructive", title: "복사하지 못했습니다." });
    }
  };

  const rows: { label: string; value: string; multiline?: boolean }[] = [
    { label: "링크", value: link },
    { label: "FEN", value: fen },
    { label: "PGN", value: pgn, multiline: true },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title="공유·내보내기"
          aria-label="공유·내보내기"
        >
          <Share2 />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>공유·내보내기</DialogTitle>
          <DialogDescription>
            링크는 지금 보고 있는 위치까지의 수순을, PGN은 변화수와 주석까지
            모두 담습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {rows.map(({ label, value, multiline }) => (
            <div key={label} className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">
                {label}
              </div>
              <div className="flex items-start gap-2">
                {multiline ? (
                  <textarea
                    readOnly
                    value={value || "(수 없음)"}
                    className="max-h-32 min-h-16 flex-1 rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs"
                  />
                ) : (
                  <input
                    readOnly
                    value={value}
                    className="min-w-0 flex-1 rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs"
                    onFocus={(event) => event.target.select()}
                  />
                )}
                <Button
                  size="icon"
                  variant="secondary"
                  aria-label={`${label} 복사`}
                  onClick={() => copy(label, value)}
                >
                  <Copy />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={() =>
            downloadText(
              `openchess-${pgnDate().replace(/\./g, "")}.pgn`,
              tree.toPgn({
                headers: {
                  Event: "OpenChess 분석",
                  Site: "OpenChess",
                  Date: pgnDate(),
                  White: "?",
                  Black: "?",
                  Result: "*",
                },
              }) + "\n",
              "application/x-chess-pgn",
            )
          }
        >
          <Download />
          PGN 파일로 저장
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;

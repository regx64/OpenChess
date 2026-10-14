"use client";

import React, { useEffect, useState } from "react";
import { NotebookPen } from "lucide-react";
import { notesStore, saveNote } from "@/lib/notes";

/**
 * 오프닝 페이지의 "내 메모": 이 브라우저에 저장되고, 분석 보드에서 이 오프닝에 오면 함께 보입니다.
 */
export default function OpeningNote({ name }: { name: string }) {
  const notes = notesStore.use();
  const saved = notes[name]?.text ?? "";
  const [text, setText] = useState(saved);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setText(saved);
    if (saved) setOpen(true);
  }, [saved]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <NotebookPen className="size-4" />내 메모 쓰기
      </button>
    );
  }

  return (
    <div className="space-y-1 rounded-lg border bg-card p-3">
      <label
        htmlFor={`note-${name}`}
        className="flex items-center gap-1.5 text-sm font-semibold"
      >
        <NotebookPen className="size-4" />내 메모
      </label>
      <textarea
        id={`note-${name}`}
        className="min-h-20 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        placeholder="이 오프닝에서 기억할 계획, 자주 하는 실수, 좋아하는 변형 등을 적어 두세요."
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => saveNote(name, text)}
      />
      <p className="text-xs text-muted-foreground">
        이 브라우저에 저장됩니다. 분석 보드에서 이 오프닝에 도착하면 함께 보여
        줍니다.
      </p>
    </div>
  );
}

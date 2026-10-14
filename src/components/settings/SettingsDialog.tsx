"use client";

import React from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  BOARD_THEMES,
  type BoardThemeId,
  type Settings,
  updateSettings,
  useSettings,
} from "@/lib/settings";
import { cn } from "@/lib/utils";

function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-md py-2 text-left"
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && (
          <span className="block text-xs text-muted-foreground">
            {description}
          </span>
        )}
      </span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-sm font-medium">{label}</div>
      <div
        className="grid auto-cols-fr grid-flow-col gap-1 rounded-md bg-muted p-1"
        role="radiogroup"
        aria-label={label}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded px-2 py-1.5 text-xs font-medium transition-colors",
              value === option.value
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const TOGGLES: { key: keyof Settings; label: string; description?: string }[] =
  [
    {
      key: "showCoordinates",
      label: "좌표 표시",
      description: "보드 가장자리에 a–h, 1–8",
    },
    { key: "showLegalMoves", label: "둘 수 있는 칸 표시" },
    { key: "highlightLastMove", label: "직전 수 강조" },
    { key: "sound", label: "효과음" },
  ];

/**
 * 보드 테마, 표시 옵션, 효과음, 화면 테마 설정
 */
export default function SettingsDialog() {
  const settings = useSettings();
  const { theme, setTheme } = useTheme();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="설정" title="설정">
          <SettingsIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>설정</DialogTitle>
          <DialogDescription>
            설정은 이 브라우저에 저장됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <div className="text-sm font-medium">보드 색</div>
            <div
              className="grid grid-cols-5 gap-2"
              role="radiogroup"
              aria-label="보드 색"
            >
              {(
                Object.entries(BOARD_THEMES) as [
                  BoardThemeId,
                  (typeof BOARD_THEMES)[BoardThemeId],
                ][]
              ).map(([id, boardTheme]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={settings.boardTheme === id}
                  onClick={() => updateSettings({ boardTheme: id })}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-md p-1 text-xs",
                    settings.boardTheme === id && "ring-2 ring-primary",
                  )}
                >
                  <span className="grid size-10 grid-cols-2 overflow-hidden rounded">
                    {[
                      boardTheme.light,
                      boardTheme.dark,
                      boardTheme.dark,
                      boardTheme.light,
                    ].map((color, i) => (
                      <span key={i} style={{ backgroundColor: color }} />
                    ))}
                  </span>
                  {boardTheme.label}
                </button>
              ))}
            </div>
          </div>

          <Segmented
            label="화면 테마"
            value={(theme ?? "dark") as string}
            onChange={setTheme}
            options={[
              { value: "light", label: "밝게" },
              { value: "dark", label: "어둡게" },
              { value: "system", label: "시스템" },
            ]}
          />

          <Segmented
            label="기물 움직임"
            value={settings.animationMs}
            onChange={(animationMs) => updateSettings({ animationMs })}
            options={[
              { value: 0, label: "끔" },
              { value: 120, label: "빠르게" },
              { value: 180, label: "보통" },
              { value: 300, label: "느리게" },
            ]}
          />

          <div className="divide-y">
            {TOGGLES.map(({ key, label, description }) => (
              <Switch
                key={key}
                label={label}
                description={description}
                checked={Boolean(settings[key])}
                onChange={(checked) => updateSettings({ [key]: checked })}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, ListPlus, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocRef } from "@/lib/docsIndex";
import {
  recommend,
  ROLE_LABELS,
  STYLE_LABELS,
  type Preferences,
  type Role,
  type Style,
} from "@/data/recommendations";
import { createRepertoire } from "@/lib/repertoireStore";
import { normalizeFileName, cn } from "@/lib/utils";

const LEVELS: { value: 1 | 2 | 3; label: string; hint: string }[] = [
  { value: 1, label: "입문", hint: "규칙은 알고, 오프닝은 처음" },
  { value: 2, label: "중급", hint: "레이팅 1200–1800 정도" },
  { value: 3, label: "고급", hint: "레이팅 1800 이상" },
];

const THEORY_BADGE = ["", "이론 적음", "이론 보통", "이론 많음"];

/**
 * 오프닝 추천: 스타일·수준·이론 부담을 고르면 백, 흑(1. e4 상대), 흑(1. d4 상대)용 오프닝을 추천합니다.
 */
export default function Recommender({ docs }: { docs: DocRef[] }) {
  const [prefs, setPrefs] = useState<Preferences>({
    style: "balanced",
    level: 1,
    lowTheory: true,
  });
  const [shown, setShown] = useState(false);
  const result = recommend(prefs);
  const docBySlug = new Map(docs.map((doc) => [doc.slug, doc]));

  const option = <T,>(
    value: T,
    current: T,
    onClick: () => void,
    label: string,
    hint?: string,
  ) => (
    <button
      key={String(value)}
      type="button"
      role="radio"
      aria-checked={value === current}
      onClick={onClick}
      className={cn(
        "rounded-lg border p-3 text-left transition-colors",
        value === current ? "border-primary bg-primary/10" : "hover:bg-muted",
      )}
    >
      <span className="block font-medium">{label}</span>
      {hint && (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      )}
    </button>
  );

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-semibold">1. 어떤 체스를 좋아하나요?</h2>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
          {(["sharp", "balanced", "solid"] as Style[]).map((style) =>
            option(
              style,
              prefs.style,
              () => setPrefs({ ...prefs, style }),
              STYLE_LABELS[style],
              {
                sharp: "희생과 공격, 복잡한 전술",
                balanced: "상황에 따라 공격도 수비도",
                solid: "튼튼한 구조, 실수 적은 운영",
              }[style],
            ),
          )}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold">2. 지금 수준은?</h2>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
          {LEVELS.map(({ value, label, hint }) =>
            option(
              value,
              prefs.level,
              () => setPrefs({ ...prefs, level: value }),
              label,
              hint,
            ),
          )}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold">3. 이론 암기는?</h2>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
          {option(
            true,
            prefs.lowTheory,
            () => setPrefs({ ...prefs, lowTheory: true }),
            "적게 외우고 싶어요",
            "체계적인 배치, 원리 위주",
          )}
          {option(
            false,
            prefs.lowTheory,
            () => setPrefs({ ...prefs, lowTheory: false }),
            "깊이 공부해도 좋아요",
            "주요 변형을 정확히",
          )}
        </div>
      </section>
      <Button size="lg" onClick={() => setShown(true)}>
        추천 받기
      </Button>

      {shown && (
        <div className="space-y-8">
          {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
            <section key={role} className="space-y-3">
              <h2 className="text-xl font-bold">{ROLE_LABELS[role]}</h2>
              <ol className="grid gap-3 md:grid-cols-3">
                {result[role].map((profile, rank) => {
                  const doc = docBySlug.get(profile.slug);
                  if (!doc) return null;
                  const color = role === "white" ? "w" : "b";
                  return (
                    <li
                      key={profile.slug}
                      className={cn(
                        "space-y-2 rounded-lg border p-4",
                        rank === 0 && "border-primary",
                      )}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold">
                          {rank + 1}. {doc.title}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {doc.eco}
                        </span>
                      </div>
                      <p className="text-sm">{profile.why}</p>
                      <div className="flex flex-wrap gap-1 text-[11px]">
                        <span className="rounded bg-muted px-1.5 py-0.5">
                          {STYLE_LABELS[profile.style]}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5">
                          {THEORY_BADGE[profile.theory]}
                        </span>
                      </div>
                      <p className="break-words font-mono text-xs text-muted-foreground">
                        {doc.pgn}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button size="sm" variant="secondary" asChild>
                          <Link href={`/openings/${doc.slug}`}>
                            <BookOpen />
                            해설
                          </Link>
                        </Button>
                        <Button size="sm" variant="secondary" asChild>
                          <Link
                            href={`/train/drill?opening=${normalizeFileName(doc.name)}&color=${color}`}
                          >
                            <Repeat />
                            연습
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const repertoire = createRepertoire(
                              `${color === "w" ? "백" : "흑"}: ${doc.title}`,
                              color,
                              doc.pgn,
                            );
                            window.location.href = `/repertoire/edit?id=${repertoire.id}`;
                          }}
                        >
                          <ListPlus />
                          레퍼토리로
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
          <p className="text-sm text-muted-foreground">
            추천은 오프닝의 일반적인 성격(스타일, 이론의 양, 난이도)에 따른
            것입니다. 해설을 읽어 보고 마음에 드는 것을 고르세요.
          </p>
        </div>
      )}
    </div>
  );
}

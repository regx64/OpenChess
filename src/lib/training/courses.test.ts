import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "fs";
import data from "@/data/opening-tree.json";
import { OpeningBook, type OpeningTreeData } from "@/lib/openingBook";
import { COURSES } from "@/data/courses";
import { OPENING_PROFILES, recommend } from "@/data/recommendations";
import { TRAPS } from "@/data/traps";
import { MODEL_GAMES } from "@/data/games";

const book = new OpeningBook(data as unknown as OpeningTreeData);
const names = new Set(book.catalog().map((entry) => entry.name));
const slugs = new Set(
  readdirSync("openings").map((file) => file.replace(/\.mdx$/, "")),
);
const families = new Set(
  (
    JSON.parse(readFileSync("public/data/puzzles.json", "utf8")) as string[][]
  ).map((p) => p[5].split(":")[0]),
);

describe("코스", () => {
  for (const course of COURSES) {
    test(course.title, () => {
      for (const step of course.steps) {
        if (step.kind === "doc") expect(slugs.has(step.target!)).toBe(true);
        if (step.kind === "drill") {
          expect(names.has(step.target!)).toBe(true);
          expect(step.color).toBeDefined();
        }
        if (step.kind === "trap")
          expect(TRAPS.some((t) => t.id === step.target)).toBe(true);
        if (step.kind === "game")
          expect(MODEL_GAMES.some((g) => g.id === step.target)).toBe(true);
        if (step.kind === "puzzles")
          expect(families.has(step.target!)).toBe(true);
      }
    });
  }
});

describe("추천", () => {
  test("모든 추천 대상 문서가 있고 겹치지 않음", () => {
    for (const profile of OPENING_PROFILES)
      expect(slugs.has(profile.slug)).toBe(true);
    expect(new Set(OPENING_PROFILES.map((p) => p.slug)).size).toBe(
      OPENING_PROFILES.length,
    );
  });
  test("입문·이론 적게 → 이론이 적고 쉬운 오프닝", () => {
    const result = recommend({ style: "solid", level: 1, lowTheory: true });
    expect(result.white.map((p) => p.slug)).toContain("london-system");
    for (const list of Object.values(result)) {
      expect(list).toHaveLength(3);
      expect(list.every((p) => p.level <= 2)).toBe(true);
    }
  });
  test("고급·공격적 → 날카로운 오프닝", () => {
    const result = recommend({ style: "sharp", level: 3, lowTheory: false });
    expect(result["black-e4"].every((p) => p.style === "sharp")).toBe(true);
  });
});

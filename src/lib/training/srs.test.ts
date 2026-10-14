import { describe, expect, test } from "bun:test";
import data from "@/data/opening-tree.json";
import { OpeningBook, type OpeningTreeData } from "@/lib/openingBook";
import { findBySlug } from "@/lib/openingDetail";
import { cardLevel, newCard, review } from "./srs";
import { buildSession, dueCards, lineForName, linesUnder } from "./lines";
import { currentStreak, updatePuzzleRating } from "./progress";
import { ecoChoices, nameChoices, pickQuestion, quizPool } from "./quiz";

const book = new OpeningBook(data as unknown as OpeningTreeData);

describe("간격 반복", () => {
  test("맞히면 간격이 늘고, 틀리면 오늘 다시", () => {
    let card = newCard(100);
    card = review(card, "good", 100);
    expect(card.interval).toBe(1);
    expect(card.due).toBe(101);
    card = review(card, "good", 101);
    expect(card.interval).toBe(3);
    card = review(card, "good", 104);
    expect(card.interval).toBeGreaterThan(6);
    const failed = review(card, "again", 120);
    expect(failed.due).toBe(120);
    expect(failed.lapses).toBe(1);
    expect(failed.ease).toBeLessThan(card.ease);
  });

  test("숙련 단계", () => {
    expect(cardLevel(undefined)).toBe("new");
    let card = review(newCard(0), "good", 0);
    expect(cardLevel(card)).toBe("learning");
    card = review(card, "good", 1);
    expect(cardLevel(card)).toBe("known");
    for (let day = 4; card.interval < 21; day = card.due)
      card = review(card, "good", day);
    expect(cardLevel(card)).toBe("mastered");
  });
});

describe("연습 수순", () => {
  const najdorf = findBySlug(book, "sicilian-defense-najdorf-variation")!;
  const lines = linesUnder(book, najdorf);

  test("오프닝 아래 수순은 자기 자신부터, 모두 그 수순으로 시작", () => {
    expect(lines[0].name).toBe(najdorf.name);
    const prefix = lines[0].sans.join(" ");
    expect(lines.length).toBeGreaterThan(5);
    // 대표 수순이 다른 수순으로 트랜스포지션된 경우도 있으므로 대부분이 같은 앞부분을 가짐
    const same = lines.filter((line) =>
      line.sans.join(" ").startsWith(prefix),
    ).length;
    expect(same / lines.length).toBeGreaterThan(0.8);
  });

  test("복습할 것 먼저, 그다음 새 수순", () => {
    const cards = {
      [`w|${lines[3].name}`]: { ...newCard(0), seen: 1, due: 5 },
      [`w|${lines[1].name}`]: { ...newCard(0), seen: 1, due: 50 },
    };
    const session = buildSession(lines, cards, "w", { day: 10, limit: 3 });
    expect(session[0]).toEqual({ line: lines[3], status: "due" });
    expect(session.slice(1).every((item) => item.status === "new")).toBe(true);
    expect(session.some((item) => item.line === lines[1])).toBe(false);
    expect(dueCards(cards, 10)).toEqual([
      { color: "w", name: lines[3].name, due: 5 },
    ]);
  });

  test("이름으로 수순 찾기", () => {
    expect(lineForName(book, "Italian Game")?.sans).toEqual([
      "e4",
      "e5",
      "Nf3",
      "Nc6",
      "Bc4",
    ]);
  });
});

describe("기록", () => {
  test("연속 학습일", () => {
    const activity = {
      "10": { drills: 1 },
      "11": { quiz: 2 },
      "12": { puzzles: 1 },
    };
    expect(currentStreak(activity, 12)).toBe(3);
    expect(currentStreak(activity, 13)).toBe(3); // 오늘 아직 안 했으면 어제까지
    expect(currentStreak(activity, 14)).toBe(0);
  });
  test("퍼즐 레이팅", () => {
    expect(updatePuzzleRating(1500, 1500, true)).toBe(1516);
    expect(updatePuzzleRating(1500, 1500, false)).toBe(1484);
  });
});

describe("퀴즈", () => {
  let seed = 42;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  test("이름 보기: 4개, 정답 포함, 상위·하위·같은 위치 이름 없음", () => {
    const pool = quizPool(book, "all", () => true);
    for (let i = 0; i < 200; i++) {
      const answer = pickQuestion(pool, [], random);
      const choices = nameChoices(book, answer, pool, random);
      expect(choices).toHaveLength(4);
      expect(choices.filter((c) => c.name === answer.name)).toHaveLength(1);
      for (const a of choices) {
        for (const b of choices) {
          if (a === b) continue;
          expect(a.name.startsWith(b.name)).toBe(false);
          expect(book.key[a.node]).not.toBe(book.key[b.node]);
        }
      }
    }
  });

  test("ECO 보기: 4개, 서로 다르고 같은 권", () => {
    const codes = [...new Set(book.catalog().map((e) => e.eco))];
    for (const code of ["A00", "B90", "C50", "D99", "E60"]) {
      const choices = ecoChoices(code, codes, random);
      expect(new Set(choices).size).toBe(4);
      expect(choices).toContain(code);
      expect(choices.every((c) => c[0] === code[0])).toBe(true);
    }
  });

  test("난이도별 후보", () => {
    expect(
      quizPool(book, "basic", (name) => name.startsWith("Italian Game")).every(
        (e) => e.name.startsWith("Italian Game"),
      ),
    ).toBe(true);
    expect(quizPool(book, "normal", () => false).length).toBeGreaterThan(200);
  });
});

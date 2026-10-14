import { describe, expect, test } from "bun:test";
import data from "@/data/opening-tree.json";
import { OpeningBook, type OpeningTreeData } from "@/lib/openingBook";
import {
  groupProgress,
  nameStatus,
  rankFor,
  summarizeMastery,
} from "./mastery";
import { newCard, review } from "./srs";

const book = new OpeningBook(data as unknown as OpeningTreeData);
const catalog = book.catalog();

const known = review(review(newCard(0), "good", 0), "good", 1);
let mastered = known;
for (let day = 4; mastered.interval < 21; day = mastered.due)
  mastered = review(mastered, "good", day);

describe("정복도", () => {
  const input = {
    catalog,
    cards: {
      "w|Italian Game": known,
      "b|Italian Game": review(newCard(0), "good", 0),
      "b|Caro-Kann Defense": mastered,
      "w|French Defense": review(newCard(0), "again", 0),
    },
    viewed: { "Sicilian Defense": 10 },
    quizSolved: ["Ruy Lopez"],
  };

  test("이름별 상태", () => {
    expect(nameStatus("Italian Game", input)).toBe("known");
    expect(nameStatus("Caro-Kann Defense", input)).toBe("mastered");
    expect(nameStatus("Sicilian Defense", input)).toBe("seen");
    expect(nameStatus("Ruy Lopez", input)).toBe("seen");
    // 틀려서 아직 단계가 없는 카드
    expect(nameStatus("French Defense", input)).toBe("learning");
    expect(nameStatus("Polish Opening", input)).toBe("unseen");
  });

  test("요약과 묶음별 진도", () => {
    const summary = summarizeMastery(input);
    expect(summary.total).toBe(3177);
    expect(summary.learned).toBe(2);
    expect(summary.mastered).toBe(1);
    expect(summary.seen).toBe(5);
    const byEco = groupProgress(catalog, summary.status, (e) => e.eco);
    expect(byEco.get("C50")!.learned).toBe(1);
    const total = [...byEco.values()].reduce((sum, g) => sum + g.total, 0);
    expect(total).toBe(3177);
  });

  test("칭호", () => {
    expect(rankFor(0).current.title).toBe("첫걸음");
    expect(rankFor(25).current.title).toBe("오프닝 수련생");
    expect(rankFor(25).next?.min).toBe(60);
    expect(rankFor(3177).next).toBeNull();
  });
});

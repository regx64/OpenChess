import { describe, expect, test } from "bun:test";
import data from "@/data/opening-tree.json";
import { OpeningBook, type OpeningTreeData } from "./openingBook";
import { buildSearchIndex, searchOpenings, toChosung } from "./search";
import { findDocSection, type DocSection } from "./docSections";
import { findBySlug, openingDetail } from "./openingDetail";
import type { DocRef } from "./docsIndex";
import { normalizeFileName } from "./utils";

const book = new OpeningBook(data as unknown as OpeningTreeData);
const docs: DocRef[] = [
  {
    slug: "sicilian-defense",
    title: "시실리안 디펜스",
    name: "Sicilian Defense",
    aliases: [],
    eco: "B20",
    group: "1. e4 기타",
    summary: "",
    pgn: "1. e4 c5",
  },
];
const index = buildSearchIndex(book, docs);

describe("검색", () => {
  test("영문 이름", () => {
    expect(searchOpenings(index, "najdorf")[0].name).toContain("Najdorf");
  });
  test("오타 허용", () => {
    expect(searchOpenings(index, "najdrof")[0].name).toContain("Najdorf");
    expect(searchOpenings(index, "sicilan dragon")[0].name).toContain(
      "Sicilian Defense: Dragon",
    );
  });
  test("ECO 코드", () => {
    const results = searchOpenings(index, "B90");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.eco === "B90")).toBe(true);
  });
  test("수순 (트랜스포지션 포함)", () => {
    const [first] = searchOpenings(
      index,
      "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6",
    );
    expect(first.name).toBe("Sicilian Defense: Najdorf Variation");
    expect(first.exact).toBe(true);
    // 1. Nf3 c5 2. e4 → 시실리안으로 합류
    expect(searchOpenings(index, "1. Nf3 c5 2. e4")[0].name).toContain(
      "Sicilian",
    );
  });
  test("한국어와 초성", () => {
    expect(searchOpenings(index, "시실리안")[0].name).toBe("Sicilian Defense");
    expect(searchOpenings(index, "ㅅㅅㄹㅇ")[0].name).toBe("Sicilian Defense");
    expect(toChosung("시실리안 디펜스")).toBe("ㅅㅅㄹㅇㄷㅍㅅ");
  });
  test("없는 말은 결과 없음", () => {
    expect(searchOpenings(index, "zzqqxx")).toEqual([]);
  });
});

describe("문서 절 찾기", () => {
  const sections: DocSection[] = [
    { slug: "s", heading: "개요", anchor: "a", lines: ["e4 c5"] },
    {
      slug: "s",
      heading: "6. Bg5 라인",
      anchor: "b",
      lines: ["e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5 e6"],
    },
    {
      slug: "s",
      heading: "나이도르프",
      anchor: "c",
      lines: ["e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6"],
    },
  ];
  const sans = (text: string) => text.split(" ");
  test("이미 지나친 가장 깊은 절", () => {
    expect(
      findDocSection(sections, sans("e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be2"))
        ?.section.anchor,
    ).toBe("c");
  });
  test("다음에 이어질 절 (마지막 수가 제목에 있으면 우선)", () => {
    expect(
      findDocSection(sections, sans("e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5"))
        ?.section.anchor,
    ).toBe("b");
  });
  test("지나온 수순만 보기", () => {
    expect(
      findDocSection(
        sections,
        sans("e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5"),
        undefined,
        true,
      )?.section.anchor,
    ).toBe("c");
    expect(
      findDocSection(sections, sans("e4 c5 Nf3"), undefined, true)?.section
        .anchor,
    ).toBe("a");
  });
  test("다른 수순이면 없음", () => {
    expect(findDocSection(sections, sans("d4 d5"))).toBeNull();
  });
});

describe("오프닝 상세", () => {
  test("나이도르프: 상위·하위 변형", () => {
    const entry = findBySlug(book, "sicilian-defense-najdorf-variation")!;
    const detail = openingDetail(book, entry);
    expect(detail.ancestors.map((a) => a.name)).toContain("Sicilian Defense");
    expect(detail.children.length).toBeGreaterThan(3);
    expect(detail.children.every((c) => c.name !== entry.name)).toBe(true);
    expect(detail.descendants).toBeGreaterThanOrEqual(detail.children.length);
  });
  test("모든 이름의 주소가 서로 겹치지 않고 다시 찾아짐", () => {
    for (const entry of book.catalog()) {
      expect(findBySlug(book, normalizeFileName(entry.name))?.name).toBe(
        entry.name,
      );
    }
  });
});

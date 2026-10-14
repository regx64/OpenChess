/**
 * Lichess 퍼즐 데이터베이스(CC0, https://database.lichess.org/#puzzles)에서
 * 오프닝 정보가 붙은 퍼즐을 골라 public/data/puzzles.json을 만듭니다.
 *
 * 사용법 (zstd가 있는 환경):
 *   curl -s https://database.lichess.org/lichess_db_puzzle.csv.zst | zstd -dc | head -n 400000 > puzzles.csv
 *   bun run bin/build-puzzles.ts puzzles.csv
 *
 * 고르는 기준
 * - 오프닝 태그가 있고, 인기도 85 이상, 풀이 300회 이상, 레이팅 편차 90 이하
 * - 오프닝 계열마다 최대 PER_FAMILY개, 레이팅 구간을 고르게 섞어서
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import data from "../src/data/opening-tree.json";
import { OpeningBook, type OpeningTreeData } from "../src/lib/openingBook";

const PER_FAMILY = 70;
const OUTPUT = "public/data/puzzles.json";
const BANDS = [0, 1200, 1500, 1800, 2100, 9999];

const book = new OpeningBook(data as unknown as OpeningTreeData);
const compact = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
const nameByCompact = new Map(
  book.catalog().map((entry) => [compact(entry.name), entry.name]),
);

/** Lichess 오프닝 태그(예: Sicilian_Defense_Najdorf_Variation)를 데이터셋 이름으로 */
const tagToName = (tag: string) => nameByCompact.get(compact(tag));

/** 따옴표를 고려하지 않는 간단한 CSV 파서 (퍼즐 CSV에는 쉼표가 든 칸이 없음) */
const rows = readFileSync(process.argv[2], "utf8").trim().split("\n");
const header = rows.shift()!.split(",");
const col = (name: string) => header.indexOf(name);
const [ID, FEN, MOVES, RATING, RD, POP, PLAYS, THEMES, TAGS] = [
  "PuzzleId",
  "FEN",
  "Moves",
  "Rating",
  "RatingDeviation",
  "Popularity",
  "NbPlays",
  "Themes",
  "OpeningTags",
].map(col);

interface Candidate {
  id: string;
  fen: string;
  moves: string;
  rating: number;
  popularity: number;
  themes: string;
  family: string;
  opening: string;
}

const byFamily = new Map<string, Candidate[]>();
for (const row of rows) {
  const f = row.split(",");
  if (!f[TAGS]) continue;
  if (+f[POP] < 85 || +f[PLAYS] < 300 || +f[RD] > 90) continue;
  const tags = f[TAGS].split(" ");
  const family = tagToName(tags[0]);
  if (!family) continue;
  const opening = (tags[1] && tagToName(tags[1])) || family;
  const list = byFamily.get(family) ?? [];
  list.push({
    id: f[ID],
    fen: f[FEN],
    moves: f[MOVES],
    rating: +f[RATING],
    popularity: +f[POP],
    themes: f[THEMES],
    family,
    opening,
  });
  byFamily.set(family, list);
}

const picked: Candidate[] = [];
for (const list of byFamily.values()) {
  // 레이팅 구간별로 인기 순 정렬 후 번갈아 뽑기
  const bands = BANDS.slice(0, -1).map((low, i) =>
    list
      .filter((p) => p.rating >= low && p.rating < BANDS[i + 1])
      .sort((a, b) => b.popularity - a.popularity),
  );
  let taken = 0;
  for (let round = 0; taken < PER_FAMILY; round++) {
    let any = false;
    for (const band of bands) {
      if (band[round] && taken < PER_FAMILY) {
        picked.push(band[round]);
        taken++;
        any = true;
      }
    }
    if (!any) break;
  }
}

picked.sort((a, b) => a.rating - b.rating);
mkdirSync("public/data", { recursive: true });
// [id, fen, 수(UCI), 레이팅, 테마, 오프닝 이름]
writeFileSync(
  OUTPUT,
  JSON.stringify(
    picked.map((p) => [p.id, p.fen, p.moves, p.rating, p.themes, p.opening]),
  ) + "\n",
);
console.log(
  `${byFamily.size}개 계열에서 퍼즐 ${picked.length}개를 ${OUTPUT}에 저장했습니다.`,
);

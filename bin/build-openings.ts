/**
 * Lichess 공개 오프닝 데이터셋(CC0, https://github.com/lichess-org/chess-openings)을 받아
 * 위치(EPD) → 오프닝 정보 매핑 파일(src/data/openings.json)을 생성합니다.
 *
 * 사용법: bun run openings:build
 */
import { Chess } from "chess.js";
import { writeFile } from "fs/promises";
import { fenToEpd } from "../src/lib/epd";

const BASE_URL =
  "https://raw.githubusercontent.com/lichess-org/chess-openings/master";
const FILES = ["a.tsv", "b.tsv", "c.tsv", "d.tsv", "e.tsv"];
const OUTPUT = "src/data/openings.json";
const NAMES_OUTPUT = "src/data/opening-names.json";

async function buildOpenings() {
  const book: Record<string, [eco: string, name: string]> = {};
  // 검색용: 이름별로 가장 짧은(대표) 수순 하나만 보관
  const names = new Map<string, [eco: string, name: string, pgn: string]>();

  for (const file of FILES) {
    const response = await fetch(`${BASE_URL}/${file}`);
    if (!response.ok) {
      throw new Error(`${file} 다운로드 실패: HTTP ${response.status}`);
    }

    const rows = (await response.text()).trim().split("\n").slice(1);
    for (const row of rows) {
      const [eco, name, pgn] = row.split("\t");
      const game = new Chess();
      game.loadPgn(pgn);
      // 같은 위치에 여러 이름이 있으면 데이터셋에서 나중에 나온(더 구체적인) 이름을 사용
      book[fenToEpd(game.fen())] = [eco, name];

      const existing = names.get(name);
      if (!existing || pgn.length < existing[2].length) {
        names.set(name, [eco, name, pgn]);
      }
    }
  }

  const sorted = Object.fromEntries(
    Object.entries(book).sort(([a], [b]) => a.localeCompare(b)),
  );
  await writeFile(OUTPUT, JSON.stringify(sorted, null, 0) + "\n");
  console.log(
    `${Object.keys(sorted).length}개 위치를 ${OUTPUT}에 저장했습니다.`,
  );

  const nameList = [...names.values()].sort((a, b) => a[1].localeCompare(b[1]));
  await writeFile(NAMES_OUTPUT, JSON.stringify(nameList) + "\n");
  console.log(
    `${nameList.length}개 오프닝 이름을 ${NAMES_OUTPUT}에 저장했습니다.`,
  );
}

buildOpenings();

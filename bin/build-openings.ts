/**
 * Lichess 공개 오프닝 데이터셋(CC0, https://github.com/lichess-org/chess-openings)을 받아
 * 오프닝 수순 트리 파일(src/data/opening-tree.json)을 생성합니다.
 *
 * 모든 수순을 한 트리로 합치고, 각 노드에 그 위치의 조회 키(positionKey)를 미리 계산해 둡니다.
 * 브라우저에서는 이 파일만으로 오프닝 판별·탐색·트랜스포지션 감지를 할 수 있습니다.
 *
 * 사용법: bun run openings:build
 */
import { Chess } from "chess.js";
import { writeFile } from "fs/promises";
import { positionKey } from "../src/lib/epd";
import type { OpeningTreeData } from "../src/lib/openingBook";

const BASE_URL =
  "https://raw.githubusercontent.com/lichess-org/chess-openings/master";
const FILES = ["a.tsv", "b.tsv", "c.tsv", "d.tsv", "e.tsv"];
const OUTPUT = "src/data/opening-tree.json";

async function buildOpenings() {
  const data: OpeningTreeData = {
    names: [],
    parent: [-1],
    san: [""],
    key: [positionKey(new Chess().fen())],
    name: [-1],
  };
  const nameIndex = new Map<string, number>();
  const childIndex = new Map<string, number>();

  for (const file of FILES) {
    const response = await fetch(`${BASE_URL}/${file}`);
    if (!response.ok) {
      throw new Error(`${file} 다운로드 실패: HTTP ${response.status}`);
    }

    const rows = (await response.text()).trim().split("\n").slice(1);
    for (const row of rows) {
      const [eco, name, pgn] = row.split("\t");
      const moves = new Chess();
      moves.loadPgn(pgn);

      const game = new Chess();
      let node = 0;
      for (const san of moves.history()) {
        game.move(san);
        const id = `${node} ${san}`;
        let child = childIndex.get(id);
        if (child === undefined) {
          child = data.parent.length;
          data.parent.push(node);
          data.san.push(san);
          data.key.push(positionKey(game.fen()));
          data.name.push(-1);
          childIndex.set(id, child);
        }
        node = child;
      }

      // 같은 이름이 여러 ECO 코드에 걸쳐 있는 경우가 있어 (ECO, 이름) 쌍으로 구분
      let index = nameIndex.get(`${eco}\t${name}`);
      if (index === undefined) {
        index = data.names.length;
        data.names.push([eco, name]);
        nameIndex.set(`${eco}\t${name}`, index);
      }
      data.name[node] = index;
    }
  }

  await writeFile(OUTPUT, JSON.stringify(data) + "\n");
  console.log(
    `${data.names.length}개 오프닝, ${data.parent.length}개 위치를 ${OUTPUT}에 저장했습니다.`,
  );
}

buildOpenings();

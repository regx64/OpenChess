/**
 * openings/*.mdx 문서를 검사합니다.
 * - frontmatter 필수 항목 확인
 * - 대표 수순(pgn)이 오프닝 데이터셋에서 frontmatter의 name(또는 그 하위 변형)으로 판별되는지 확인
 * - 본문 `1. ...` 형태의 모든 수순이 합법적인 수인지 확인
 *
 * 사용법: bun run openings:check
 */
import { Chess } from "chess.js";
import { readdir, readFile } from "fs/promises";
import matter from "gray-matter";
import data from "../src/data/opening-tree.json";
import { OpeningBook, type OpeningTreeData } from "../src/lib/openingBook";

const book = new OpeningBook(data as unknown as OpeningTreeData);
const REQUIRED = ["title", "name", "eco", "pgn", "group", "summary"];

/** 수순을 두어 보고, 지나온 위치 중 가장 마지막으로 알려진 오프닝 이름을 반환 */
function playLine(pgn: string): { lastKnown?: string[] } {
  const game = new Chess();
  game.loadPgn(pgn);
  const history = game.history();
  const replay = new Chess();
  let lastKnown: string[] | undefined;
  for (const move of history) {
    replay.move(move);
    const opening = book.openingAt(replay.fen());
    if (opening) lastKnown = [opening.eco, opening.name];
  }
  return { lastKnown };
}

async function check() {
  const files = (await readdir("openings")).filter((f) => f.endsWith(".mdx"));
  const errors: string[] = [];

  for (const file of files) {
    const { data, content } = matter(
      await readFile(`openings/${file}`, "utf8"),
    );

    for (const key of REQUIRED) {
      if (!data[key]) errors.push(`${file}: frontmatter '${key}' 없음`);
    }

    try {
      const { lastKnown } = playLine(data.pgn);
      if (!lastKnown) {
        errors.push(`${file}: 대표 수순이 데이터셋에 없음`);
      } else {
        const [eco, name] = lastKnown;
        if (name !== data.name && !name.startsWith(`${data.name}:`)) {
          errors.push(
            `${file}: 대표 수순이 '${name}'(으)로 판별됨 (기대: ${data.name})`,
          );
        }
        if (eco !== data.eco) {
          errors.push(`${file}: ECO ${data.eco} ≠ 데이터셋 ${eco}`);
        }
      }
    } catch (error) {
      errors.push(`${file}: 대표 수순 오류 – ${(error as Error).message}`);
    }

    for (const [, line] of content.matchAll(/`(1\. [^`]+)`/g)) {
      try {
        new Chess().loadPgn(line);
      } catch (error) {
        errors.push(
          `${file}: 잘못된 수순 "${line}" – ${(error as Error).message}`,
        );
      }
    }
  }

  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log(`문서 ${files.length}개 검사 통과`);
}

check();

import type { Metadata } from "next";
import Link from "next/link";
import { MODEL_GAMES } from "@/data/games";
import { listOpeningDocs } from "@/lib/openings";

export const metadata: Metadata = {
  title: "명국 감상",
  description: "오프닝별 명국을 한 수씩 감상합니다.",
};

export default async function GamesPage() {
  const docs = await listOpeningDocs();
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <Link
        href="/train"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← 학습
      </Link>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">명국 감상</h1>
      <p className="mt-2 text-muted-foreground">
        오프닝의 아이디어가 실전에서 어떻게 꽃피는지 보여 주는 대국들입니다.
        기보는 해설 문서에 실린 것을 그대로 쓰며, 모두 체스 규칙 엔진으로
        확인했습니다.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {MODEL_GAMES.map((game) => {
          const doc = docs.find((d) => d.slug === game.doc);
          return (
            <li key={game.id}>
              <Link
                href={`/train/games/${game.id}`}
                className="block h-full rounded-lg border p-4 hover:bg-muted"
              >
                <span className="block font-semibold">{game.title}</span>
                <span className="block text-sm">
                  {game.white} – {game.black} · {game.result}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {game.site}, {game.year}
                  {doc && ` · ${doc.title}`}
                </span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  {game.summary}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

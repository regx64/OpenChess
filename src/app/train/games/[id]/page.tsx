import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { MODEL_GAMES } from "@/data/games";
import LineViewer from "@/components/board/LineViewer";
import { listOpeningDocs } from "@/lib/openings";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return MODEL_GAMES.map((game) => ({ id: game.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const game = MODEL_GAMES.find((g) => g.id === id);
  return game
    ? {
        title: `${game.title} (${game.white} – ${game.black}, ${game.year})`,
        description: game.summary,
      }
    : {};
}

export default async function GamePage({ params }: Props) {
  const { id } = await params;
  const game = MODEL_GAMES.find((g) => g.id === id);
  if (!game) notFound();
  const doc = (await listOpeningDocs()).find((d) => d.slug === game.doc);
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <Link
        href="/train/games"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← 명국 감상
      </Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <div className="lg:order-2">
          <h1 className="text-3xl font-bold">{game.title}</h1>
          <p className="mt-2 font-medium">
            {game.white} (백) – {game.black} (흑) · {game.result}
          </p>
          <p className="text-sm text-muted-foreground">
            {game.site}, {game.year}
          </p>
          <p className="mt-4">{game.summary}</p>
          {doc && (
            <Link
              href={`/openings/${doc.slug}`}
              className="mt-4 inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <BookOpen className="size-4" />
              {doc.title} 해설
            </Link>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            ▶ 버튼으로 자동 재생하거나, 보드를 누른 뒤 ← → 키로 한 수씩 넘겨
            보세요.
          </p>
        </div>
        <div className="lg:order-1">
          <LineViewer
            pgn={game.pgn}
            initialPly={0}
            orientation={game.result === "0-1" ? "b" : "w"}
          />
        </div>
      </div>
    </div>
  );
}

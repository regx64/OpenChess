import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="flex flex-col items-center justify-center align-center gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-2 md:items-start md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with <Heart className="inline-block h-4 w-4 text-red-500" />{" "}
            by{" "}
            <a
              href="https://github.com/RedBe-an"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              RedBe-an
            </a>
            . Powered by{" "}
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Next.js
            </a>{" "}
            and{" "}
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Vercel
            </a>
            .
          </p>
          <p className="text-center text-xs text-muted-foreground md:text-left">
            오프닝·퍼즐 데이터: Lichess (CC0) · 체스 엔진:{" "}
            <a
              href="/engine/README.txt"
              className="underline underline-offset-4"
            >
              Stockfish (GPL-3)
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

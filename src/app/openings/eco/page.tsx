import type { Metadata } from "next";
import Link from "next/link";
import { serverBook } from "@/lib/serverBook";
import { ECO_VOLUMES, ECO_VOLUME_KEYS, ecoCodes } from "@/lib/eco";
import { koreanName } from "@/lib/koName";

export const metadata: Metadata = {
  title: "ECO 분류",
  description: "ECO 코드(A00–E99)로 모든 체스 오프닝을 분류해 봅니다.",
};

/**
 * ECO 분류 개요: 다섯 권과 코드별 오프닝 수
 */
export default function EcoIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <Link
        href="/openings"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← 오프닝
      </Link>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">ECO 분류</h1>
      <p className="mt-2 text-muted-foreground">
        ECO(체스 오프닝 백과사전) 코드는 오프닝을 A–E 다섯 권, 권마다 00–99로
        나눕니다. 칸을 누르면 그 코드에 속한 오프닝을 볼 수 있습니다. 칸의
        진하기는 오프닝 수를 나타냅니다.
      </p>

      {ECO_VOLUME_KEYS.map((volume) => {
        const codes = ecoCodes(serverBook, volume);
        const byCode = new Map(codes.map((code) => [code.code, code]));
        const max = Math.max(...codes.map((code) => code.entries.length));
        const total = codes.reduce((sum, code) => sum + code.entries.length, 0);
        return (
          <section key={volume} className="mt-10">
            <h2 className="flex flex-wrap items-baseline gap-x-3 text-xl font-semibold">
              <Link
                href={`/openings/eco/${volume}`}
                className="hover:underline"
              >
                {volume}권 · {ECO_VOLUMES[volume].title}
              </Link>
              <span className="text-sm font-normal text-muted-foreground">
                {total}개
              </span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {ECO_VOLUMES[volume].description}
            </p>
            <div className="mt-3 grid grid-cols-10 gap-1">
              {Array.from({ length: 100 }, (_, i) => {
                const code = `${volume}${String(i).padStart(2, "0")}`;
                const info = byCode.get(code);
                if (!info) {
                  return (
                    <span
                      key={code}
                      className="flex aspect-square items-center justify-center rounded bg-muted/30 font-mono text-[10px] text-muted-foreground/50"
                    >
                      {String(i).padStart(2, "0")}
                    </span>
                  );
                }
                const strength = 0.15 + 0.85 * (info.entries.length / max);
                return (
                  <Link
                    key={code}
                    href={`/openings/eco/${volume}#${code}`}
                    title={`${code} · ${koreanName(info.family)} · ${info.entries.length}개`}
                    className="flex aspect-square items-center justify-center rounded font-mono text-[10px] font-semibold text-foreground ring-primary hover:ring-2 sm:text-xs"
                    style={{
                      backgroundColor: `hsl(var(--primary) / ${strength})`,
                    }}
                  >
                    {String(i).padStart(2, "0")}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

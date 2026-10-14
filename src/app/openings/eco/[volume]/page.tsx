import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { serverBook } from "@/lib/serverBook";
import {
  ECO_VOLUMES,
  ECO_VOLUME_KEYS,
  ecoCodes,
  type EcoVolume,
} from "@/lib/eco";
import { koreanName } from "@/lib/koName";
import { boardHref, openingHref } from "@/lib/openingDetail";

type Props = { params: Promise<{ volume: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return ECO_VOLUME_KEYS.map((volume) => ({ volume }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { volume } = await params;
  const info = ECO_VOLUMES[volume as EcoVolume];
  if (!info) return {};
  return {
    title: `ECO ${volume}권 · ${info.title}`,
    description: info.description,
  };
}

/**
 * ECO 한 권: 코드마다 그 코드에 속한 모든 오프닝
 */
export default async function EcoVolumePage({ params }: Props) {
  const { volume } = await params;
  if (!ECO_VOLUME_KEYS.includes(volume as EcoVolume)) notFound();
  const codes = ecoCodes(serverBook, volume as EcoVolume);
  const info = ECO_VOLUMES[volume as EcoVolume];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <Link
        href="/openings/eco"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← ECO 분류
      </Link>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
        ECO {volume}권 · {info.title}
      </h1>
      <p className="mt-2 text-muted-foreground">{info.description}</p>

      <nav className="mt-6 flex flex-wrap gap-1" aria-label="권 이동">
        {ECO_VOLUME_KEYS.map((key) => (
          <Link
            key={key}
            href={`/openings/eco/${key}`}
            className={`rounded-md px-3 py-1 text-sm font-semibold ${key === volume ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}
          >
            {key}
          </Link>
        ))}
      </nav>

      <div className="mt-8 space-y-8">
        {codes.map(({ code, family, entries }) => (
          <section key={code} id={code} className="scroll-mt-20">
            <h2 className="flex flex-wrap items-baseline gap-x-2 border-b pb-1 text-lg font-semibold">
              <span className="font-mono">{code}</span>
              <span>{koreanName(family)}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {entries.length}개
              </span>
            </h2>
            <ul className="mt-2 divide-y">
              {entries.map((entry) => (
                <li key={entry.name} className="py-2">
                  <Link
                    href={openingHref(entry.name)}
                    className="font-medium hover:underline"
                  >
                    {koreanName(entry.name)}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {entry.name}
                  </div>
                  <Link
                    href={boardHref(entry.pgn)}
                    className="break-words font-mono text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {entry.pgn}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

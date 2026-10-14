import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TRAPS } from "@/data/traps";
import TrapPractice from "@/components/training/TrapPractice";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return TRAPS.map((trap) => ({ id: trap.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const trap = TRAPS.find((t) => t.id === id);
  return trap ? { title: trap.title, description: trap.summary } : {};
}

export default async function TrapPage({ params }: Props) {
  const { id } = await params;
  const trap = TRAPS.find((t) => t.id === id);
  if (!trap) notFound();
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <Link
        href="/train/traps"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← 함정 모음
      </Link>
      <div className="mt-4">
        <TrapPractice trap={trap} />
      </div>
    </div>
  );
}

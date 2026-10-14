import type { Metadata } from "next";
import Link from "next/link";
import { Puzzle, Repeat, Swords, Target, Trophy } from "lucide-react";
import TrainStatus from "@/components/training/TrainStatus";

export const metadata: Metadata = {
  title: "학습",
  description:
    "오프닝 트레이너, 간격 반복 복습, 퀴즈, 함정, 오프닝별 퍼즐, 명국으로 오프닝을 익힙니다.",
};

const MODES = [
  {
    href: "/train/drill",
    icon: Repeat,
    title: "오프닝 트레이너",
    description:
      "오프닝과 색을 고르면 상대 수는 자동으로 두고, 내 수를 맞힙니다. 결과에 따라 복습 날짜가 정해집니다.",
  },
  {
    href: "/train/quiz",
    icon: Target,
    title: "오프닝 퀴즈",
    description:
      "장면을 보고 이름 맞히기, 이름을 보고 수순 두기, 수순을 보고 ECO 맞히기.",
  },
  {
    href: "/train/traps",
    icon: Swords,
    title: "함정 모음",
    description:
      "유명한 오프닝 함정을 직접 걸어 보고, 반대로 피하는 연습을 합니다.",
  },
  {
    href: "/train/puzzles",
    icon: Puzzle,
    title: "오프닝별 퍼즐",
    description:
      "실제 대국에서 나온 5천여 개의 전술 퍼즐을 오프닝·전술별로 풉니다.",
  },
  {
    href: "/train/games",
    icon: Trophy,
    title: "명국 감상",
    description:
      "오페라 게임, 불멸의 게임, 세기의 대국 등 오프닝별 명국을 한 수씩 봅니다.",
  },
];

export default function TrainPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <h1 className="text-3xl font-bold sm:text-4xl">학습</h1>
      <p className="mt-2 text-muted-foreground">
        오프닝을 보는 것에서 끝내지 않고, 직접 두고 맞히고 복습해서 내 것으로
        만드세요.
      </p>
      <div className="mt-6">
        <TrainStatus />
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {MODES.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted"
          >
            <Icon className="mt-0.5 size-6 shrink-0 text-primary" />
            <span>
              <span className="block font-semibold">{title}</span>
              <span className="block text-sm text-muted-foreground">
                {description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

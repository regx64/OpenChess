import type { Metadata } from "next";
import Link from "next/link";
import { COURSES } from "@/data/courses";
import { CourseProgressBar } from "@/components/courses/CourseView";
import { listOpeningDocs } from "@/lib/openings";

export const metadata: Metadata = {
  title: "학습 코스",
  description:
    "입문부터 고급까지, 해설·트레이너·함정·퍼즐·퀴즈를 순서대로 따라가는 오프닝 코스",
};

export default async function CoursesPage() {
  const docNames = Object.fromEntries(
    (await listOpeningDocs()).map((doc) => [doc.slug, doc.name]),
  );
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <Link
        href="/train"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← 학습
      </Link>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">학습 코스</h1>
      <p className="mb-6 mt-2 text-muted-foreground">
        해설 읽기 → 트레이너 → 함정·퍼즐·명국 → 퀴즈 순서로 따라가면 오프닝
        하나를 확실히 내 것으로 만들 수 있습니다.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {COURSES.map((course) => (
          <li key={course.id}>
            <Link
              href={`/courses/${course.id}`}
              className="block h-full space-y-2 rounded-lg border p-4 hover:bg-muted"
            >
              <span className="text-xs font-medium text-primary">
                {course.level}
              </span>
              <span className="block font-semibold">{course.title}</span>
              <span className="block text-sm text-muted-foreground">
                {course.description}
              </span>
              <CourseProgressBar course={course} docNames={docNames} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

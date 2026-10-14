import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COURSES } from "@/data/courses";
import CourseView from "@/components/courses/CourseView";
import { listOpeningDocs } from "@/lib/openings";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return COURSES.map((course) => ({ id: course.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const course = COURSES.find((c) => c.id === id);
  return course ? { title: course.title, description: course.description } : {};
}

export default async function CoursePage({ params }: Props) {
  const { id } = await params;
  const course = COURSES.find((c) => c.id === id);
  if (!course) notFound();
  const docNames = Object.fromEntries(
    (await listOpeningDocs()).map((doc) => [doc.slug, doc.name]),
  );
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <Link
        href="/courses"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← 학습 코스
      </Link>
      <p className="mt-4 text-sm font-medium text-primary">{course.level}</p>
      <h1 className="text-3xl font-bold sm:text-4xl">{course.title}</h1>
      <p className="mb-6 mt-2 text-muted-foreground">{course.description}</p>
      <CourseView course={course} docNames={docNames} />
    </div>
  );
}

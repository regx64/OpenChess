import Link from "next/link";
import type { OpeningDetail } from "@/lib/openingDetail";
import { boardHref, openingHref } from "@/lib/openingDetail";
import { koreanName } from "@/lib/koName";

/** ECO 코드 배지 (ECO 분류 페이지로 연결) */
export function EcoBadge({ eco }: { eco: string }) {
  return (
    <Link
      href={`/openings/eco/${eco[0]}#${eco}`}
      className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold hover:ring-1 hover:ring-primary"
      title={`ECO ${eco} 분류 보기`}
    >
      {eco}
    </Link>
  );
}

/** 수순 문자열 (누르면 분석 보드) */
export function LineLink({
  pgn,
  className,
}: {
  pgn: string;
  className?: string;
}) {
  return (
    <Link
      href={boardHref(pgn)}
      className={`break-words font-mono text-sm hover:underline ${className ?? ""}`}
      title="분석 보드에서 보기"
    >
      {pgn}
    </Link>
  );
}

/** 상위 오프닝 경로 */
export function OpeningBreadcrumbs({ detail }: { detail: OpeningDetail }) {
  if (!detail.ancestors.length) return null;
  return (
    <nav
      aria-label="상위 오프닝"
      className="flex flex-wrap items-center gap-x-1 text-sm text-muted-foreground"
    >
      {detail.ancestors.map((ancestor) => (
        <span key={ancestor.name} className="flex items-center gap-1">
          <Link
            href={openingHref(ancestor.name)}
            className="hover:text-foreground hover:underline"
          >
            {koreanName(ancestor.name)}
          </Link>
          <span aria-hidden>›</span>
        </span>
      ))}
    </nav>
  );
}

/**
 * 데이터셋으로 본 오프닝 정보: 다른 수순, 같은 위치의 다른 이름, 하위 변형
 */
export function OpeningSections({ detail }: { detail: OpeningDetail }) {
  const { lines, sameWith, children, descendants } = detail;
  return (
    <div className="space-y-8">
      {lines.length > 1 && (
        <section>
          <h2 className="text-lg font-semibold">이 오프닝에 도달하는 수순</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            수순이 달라도 같은 오프닝이 됩니다(트랜스포지션).
          </p>
          <ul className="mt-3 space-y-1.5">
            {lines.map((line) => (
              <li key={line}>
                <LineLink pgn={line} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {sameWith.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">같은 위치의 다른 이름</h2>
          <ul className="mt-3 space-y-2">
            {sameWith.map((other) => (
              <li
                key={other.name}
                className="flex flex-wrap items-baseline gap-2"
              >
                <EcoBadge eco={other.eco} />
                <Link
                  href={openingHref(other.name)}
                  className="font-medium hover:underline"
                >
                  {koreanName(other.name)}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {other.name}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold">
          하위 변형{" "}
          <span className="text-sm font-normal text-muted-foreground">
            바로 아래 {children.length}개 · 전체 {descendants}개
          </span>
        </h2>
        {children.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            데이터셋에 이 오프닝의 하위 변형이 없습니다.
          </p>
        ) : (
          <ul className="mt-3 divide-y rounded-lg border">
            {children.map((child) => (
              <li
                key={child.name}
                className="flex flex-col gap-1 p-3 sm:flex-row sm:items-start sm:gap-3"
              >
                <EcoBadge eco={child.eco} />
                <div className="min-w-0 flex-1">
                  <Link
                    href={openingHref(child.name)}
                    className="font-medium hover:underline"
                  >
                    {koreanName(child.name)}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {child.name}
                  </div>
                  <LineLink
                    pgn={child.pgn}
                    className="mt-1 block text-xs text-muted-foreground"
                  />
                </div>
                {child.lines > 1 && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    하위 {child.lines - 1}개
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

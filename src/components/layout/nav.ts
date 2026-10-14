import {
  BookOpen,
  GraduationCap,
  LayoutGrid,
  ListTree,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** 이 경로로 시작하면 활성 표시 */
  match: (pathname: string) => boolean;
}

/** 상단(데스크톱)·하단(모바일) 내비게이션 항목 */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "보드",
    icon: LayoutGrid,
    match: (pathname) => pathname === "/",
  },
  {
    href: "/openings",
    label: "오프닝",
    icon: BookOpen,
    match: (pathname) => pathname.startsWith("/openings"),
  },
  {
    href: "/train",
    label: "학습",
    icon: GraduationCap,
    match: (pathname) =>
      ["/train", "/courses", "/recommend"].some((path) =>
        pathname.startsWith(path),
      ),
  },
  {
    href: "/repertoire",
    label: "레퍼토리",
    icon: ListTree,
    match: (pathname) =>
      pathname.startsWith("/repertoire") || pathname.startsWith("/my-games"),
  },
];

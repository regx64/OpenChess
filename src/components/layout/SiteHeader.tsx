"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import SettingsDialog from "@/components/settings/SettingsDialog";
import { NAV_ITEMS } from "./nav";

/** 상단 바: 로고, (데스크톱) 메뉴, 설정 */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-12 max-w-[1400px] items-center gap-4 px-3 lg:h-14 lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Image
            src="/logo.png"
            alt=""
            width={28}
            height={28}
            className="size-7"
            priority
          />
          <span>OpenChess</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="주 메뉴">
          {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted",
                match(pathname) ? "text-foreground" : "text-muted-foreground",
              )}
              aria-current={match(pathname) ? "page" : undefined}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <SettingsDialog />
        </div>
      </div>
    </header>
  );
}

/** 모바일 하단 탭 바 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div
        className="grid h-14"
        style={{
          gridTemplateColumns: `repeat(${NAV_ITEMS.length}, minmax(0, 1fr))`,
        }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
              match(pathname) ? "text-primary" : "text-muted-foreground",
            )}
            aria-current={match(pathname) ? "page" : undefined}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

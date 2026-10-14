"use client";

import { useRouter } from "next/navigation";
import OpeningSearch from "@/components/OpeningSearch";
import type { DocRef } from "@/lib/docsIndex";
import { openingHref } from "@/lib/openingDetail";

/** 오프닝 허브 검색창: 고르면 그 오프닝 페이지로 이동 */
export default function HubSearch({ docs }: { docs: DocRef[] }) {
  const router = useRouter();
  return (
    <OpeningSearch
      docs={docs}
      onSelect={(result) =>
        router.push(
          result.doc
            ? `/openings/${result.doc.slug}`
            : openingHref(result.name),
        )
      }
    />
  );
}

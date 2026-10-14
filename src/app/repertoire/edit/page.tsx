import type { Metadata } from "next";
import RepertoireEditor from "@/components/repertoire/RepertoireEditor";
import { listOpeningDocs } from "@/lib/openings";

export const metadata: Metadata = { title: "레퍼토리 편집" };

export default async function RepertoireEditPage() {
  const docs = await listOpeningDocs();
  return <RepertoireEditor docs={docs} />;
}

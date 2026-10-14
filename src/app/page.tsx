import AnalysisBoard from "@/components/analysis/AnalysisBoard";
import { listOpeningDocs } from "@/lib/openings";

/**
 * 홈: 분석 보드
 */
export default async function HomePage() {
  const docs = await listOpeningDocs();
  return <AnalysisBoard docs={docs} />;
}

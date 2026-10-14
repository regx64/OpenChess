import "server-only";
import data from "@/data/opening-tree.json";
import { OpeningBook, type OpeningTreeData } from "@/lib/openingBook";

/** 서버(페이지 생성)에서 쓰는 오프닝 트리 */
export const serverBook = new OpeningBook(data as unknown as OpeningTreeData);

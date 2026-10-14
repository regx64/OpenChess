import { searchOpenings } from "@/lib/openingSearch";

/**
 * GET /api/openings/search?q=najdorf
 * → { results: OpeningSearchResult[] }
 */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length > 100) {
    return Response.json({ error: "query too long" }, { status: 400 });
  }

  const results = query ? await searchOpenings(query) : [];
  return Response.json({ results });
}

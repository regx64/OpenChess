import { lookupOpening } from "@/lib/openingBook";

/** 한 번에 조회할 수 있는 최대 위치 수 */
const MAX_FENS = 400;

/**
 * POST /api/opening  { fens: string[] }
 * → { opening: OpeningInfo | null, index: number }
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const fens: unknown = body?.fens;

  if (
    !Array.isArray(fens) ||
    fens.length === 0 ||
    fens.length > MAX_FENS ||
    !fens.every((fen) => typeof fen === "string")
  ) {
    return Response.json({ error: "invalid fens" }, { status: 400 });
  }

  const result = lookupOpening(fens);
  return Response.json(result ?? { opening: null, index: -1 });
}

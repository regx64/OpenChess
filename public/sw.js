/*
 * OpenChess 서비스 워커: 한 번 본 페이지와 앱 파일을 저장해 오프라인에서도 쓸 수 있게 합니다.
 * - 정적 파일(/_next/static, 기물 그림, 아이콘, 엔진): 저장본 우선 (파일 이름에 해시가 있거나 거의 바뀌지 않음)
 * - 데이터(/data: 퍼즐, 문서 색인): 저장본을 먼저 주고 뒤에서 새로 받음
 * - 페이지와 페이지 데이터: 네트워크 우선, 실패하면 저장본 → 오프라인 안내 페이지
 * 저장 방식이 바뀌면 VERSION을 올려 예전 저장소를 지웁니다.
 */
const VERSION = "v2";
const STATIC_CACHE = `openchess-static-${VERSION}`;
const PAGE_CACHE = `openchess-pages-${VERSION}`;
const OFFLINE_URL = "/offline";

const PIECES = ["p", "n", "b", "r", "q", "k"].flatMap((type) => [
  `/pieces/white/w${type}.svg`,
  `/pieces/black/b${type}.svg`,
]);
const PRECACHE = [OFFLINE_URL, "/", "/manifest.webmanifest", "/icons/icon-192.png", "/logo.png", ...PIECES];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGE_CACHE);
      // 하나가 실패해도 나머지는 저장
      await Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => undefined)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = [STATIC_CACHE, PAGE_CACHE];
      for (const key of await caches.keys()) {
        if (key.startsWith("openchess-") && !keep.includes(key)) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

const isStatic = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/pieces/") ||
  url.pathname.startsWith("/icons/") ||
  url.pathname.startsWith("/engine/") ||
  url.pathname.startsWith("/data/");

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

/** 저장본을 바로 주고, 뒤에서 새로 받아 저장 (데이터 파일이 바뀌어도 다음 번엔 새 것) */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const update = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached ?? (await update) ?? Response.error();
}

async function networkFirst(request, isNavigation) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGE_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request, { ignoreVary: true });
    if (cached) return cached;
    if (isNavigation) {
      // 주소의 ?pgn= 같은 값이 달라도 같은 페이지 저장본을 씀
      const url = new URL(request.url);
      const page = await caches.match(url.origin + url.pathname, { ignoreVary: true });
      if (page) return page;
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_vercel/")) return;

  if (url.pathname.startsWith("/data/")) {
    event.respondWith(staleWhileRevalidate(request));
  } else if (isStatic(url)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request, request.mode === "navigate"));
  }
});

// "오프라인 준비": 앱에서 보낸 주소들을 미리 저장
self.addEventListener("message", (event) => {
  if (event.data?.type !== "precache") return;
  const urls = event.data.urls ?? [];
  event.waitUntil(
    (async () => {
      const pages = await caches.open(PAGE_CACHE);
      const statics = await caches.open(STATIC_CACHE);
      const assets = new Set();
      let done = 0;
      for (const url of urls) {
        try {
          const response = await fetch(url, { cache: "no-cache" });
          if (response.ok) {
            const isPage = (response.headers.get("content-type") ?? "").includes("text/html");
            if (isPage) {
              // 페이지가 쓰는 스크립트·스타일도 저장해야 오프라인에서 화면이 동작함
              const html = await response.clone().text();
              for (const [asset] of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) assets.add(asset);
            }
            await (isStatic(new URL(url, self.location.origin)) ? statics : pages).put(url, response);
          }
        } catch {
          // 실패한 주소는 건너뜀
        }
        done++;
        // 마지막 1단계는 페이지가 쓰는 파일 저장
        event.source?.postMessage({ type: "precache-progress", done, total: urls.length + 1 });
      }
      for (const asset of assets) {
        if (await statics.match(asset)) continue;
        try {
          const response = await fetch(asset);
          if (response.ok) await statics.put(asset, response);
        } catch {
          // 건너뜀
        }
      }
      event.source?.postMessage({
        type: "precache-progress",
        done: urls.length + 1,
        total: urls.length + 1,
      });
    })(),
  );
});

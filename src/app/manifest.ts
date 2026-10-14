import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OpenChess — 모든 체스 오프닝",
    short_name: "OpenChess",
    description:
      "3,177개 체스 오프닝을 찾고, 익히고, 내 것으로 만드는 오프닝 학습 앱",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "ko",
    background_color: "#111111",
    theme_color: "#111111",
    categories: ["education", "games"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "분석 보드", url: "/" },
      { name: "오늘 복습", url: "/train/drill?mode=review" },
      { name: "오프닝 찾기", url: "/openings" },
      { name: "정복 현황", url: "/progress" },
    ],
  };
}

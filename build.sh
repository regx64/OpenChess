#!/bin/bash

# OpenChess 빌드 최적화 스크립트
set -e

echo "🚀 OpenChess 빌드 시작..."

# 1. 의존성 설치 (필요한 경우)
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  echo "📦 의존성 설치 중..."
  bun install --frozen-lockfile
fi

# 2. 이전 빌드 정리
echo "🧹 이전 빌드 정리 중..."
bun run clean

# 3. 타입 체크
echo "🔍 타입 체크 중..."
bun run type-check

# 4. 린팅
echo "✨ 코드 포맷팅 중..."
bun run lint:check

# 5. 빌드 실행
echo "🏗️ Next.js 빌드 중..."
NODE_ENV=production bun run build

echo "✅ 빌드 완료!"

# 빌드 크기 정보 출력
if [ -d ".next" ]; then
  echo "📊 빌드 통계:"
  du -sh .next
  echo "페이지별 크기:"
  find .next/static -name "*.js" -exec ls -lh {} \; | head -10
fi
#!/bin/bash
# Khởi động toàn bộ hệ thống CineVé
# Backend: http://localhost:3001  |  Frontend (frontend-moi): http://localhost:3000

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🎬 Khởi động CineVé..."

# Dừng các tiến trình cũ trên 3000 & 3001 nếu có
fuser -k 3001/tcp 2>/dev/null
fuser -k 3000/tcp 2>/dev/null

# 1. Backend (NestJS + TypeORM + MySQL)
cd "$DIR/backend"
if [ ! -d node_modules ]; then npm install; fi
echo "⚙ Đang build backend NestJS..."
npm run build > /tmp/cinema-backend-build.log 2>&1
echo "▶ Backend API: http://localhost:3001"
nohup node dist/main.js > /tmp/cinema-backend.log 2>&1 &

# 2. Frontend (frontend-moi: TanStack Router + Vite + Tailwind CSS 4)
cd "$DIR/frontend-moi"
if [ ! -d node_modules ]; then npm install; fi
echo "▶ Frontend UI: http://localhost:3000"
nohup npx vite --port 3000 > /tmp/cinema-frontend.log 2>&1 &

echo ""
echo "✅ Hệ thống đang khởi động..."
echo "   🌐 Giao diện chính: http://localhost:3000"
echo "   🔌 API Backend:     http://localhost:3001"
echo "   📋 Log backend:     tail -f /tmp/cinema-backend.log"
echo "   📋 Log frontend:    tail -f /tmp/cinema-frontend.log"
echo "   ⏹ Dừng hệ thống:   bash stop.sh"

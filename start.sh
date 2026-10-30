#!/usr/bin/env bash
# Khởi động hệ thống đặt vé xem phim (backend + frontend)
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# Ưu tiên Node 20 nếu có sẵn (cần cho Vite 8 + rolldown)
if [ -x "/tmp/node-v20.19.0-linux-x64/bin/node" ]; then
  export PATH="/tmp/node-v20.19.0-linux-x64/bin:$PATH"
  echo "[NODE] Sử dụng Node $(node -v)"
fi

# Mặc định port
export PORT=${PORT:-3001}
export VITE_API_URL=${VITE_API_URL:-http://localhost:$PORT}

echo "=== CineBook - Khởi động ==="
echo "Backend: http://localhost:$PORT"
echo "Frontend: sẽ mở ở cổng mặc định của Vite/TanStack"
echo ""

# Backend
if [ -f "backend/.env" ]; then
  echo "[1/3] Khởi động backend..."
  (cd backend && npm run start:dev) &
  BACKEND_PID=$!
  sleep 5
else
  echo "Thiếu backend/.env, bỏ qua backend"
fi

# Frontend
if [ -f "frontend/package.json" ]; then
  echo "[2/3] Khởi động frontend..."
  (cd frontend && npm run dev) &
  FRONTEND_PID=$!
else
  echo "Thiếu frontend/package.json"
fi

echo "[3/3] Đang chạy..."
echo "Nhấn Ctrl+C để dừng cả hai tiến trình"
wait $BACKEND_PID $FRONTEND_PID 2>/dev/null

#!/usr/bin/env bash
pkill -f "nest start.*dat-ve-xem-phim/backend" 2>/dev/null
pkill -f "ts-node.*dat-ve-xem-phim/backend" 2>/dev/null
pkill -f "vite.*dat-ve-xem-phim/frontend" 2>/dev/null
pkill -f "tanstack.*dat-ve-xem-phim/frontend" 2>/dev/null
echo "Đã dừng các tiến trình liên quan đến dự án."

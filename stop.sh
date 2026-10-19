#!/bin/bash
# Dừng toàn bộ hệ thống CineVé
fuser -k 3001/tcp 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
echo "⏹ Đã dừng backend (3001) và frontend (3000)"

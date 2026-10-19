#!/bin/bash
# Khởi động MySQL daemon bên trong dev container
# Được gọi từ postStartCommand trong devcontainer.json
set -e

if ! mysqladmin ping --silent 2>/dev/null; then
  echo "▶ Khởi động MySQL..."
  sudo mkdir -p /var/run/mysqld && sudo chown mysql:mysql /var/run/mysqld
  sudo service mysql start || sudo mysqld_safe --skip-grant-tables=0 &
  for i in $(seq 1 30); do
    mysqladmin ping --silent 2>/dev/null && break
    sleep 1
  done
  echo "✔ MySQL đã chạy"
else
  echo "✔ MySQL đang chạy sẵn"
fi

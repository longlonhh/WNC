# Dev Container: Node 18 + MySQL 8 trong cùng một container
FROM mcr.microsoft.com/devcontainers/javascript-node:1-18-bullseye

# Cài MySQL Server + client
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        mysql-server mysql-client \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Thư mục socket/pid cho MySQL (user mysql được tạo khi cài package)
RUN mkdir -p /var/run/mysqld /var/log/mysql \
    && chown -R mysql:mysql /var/run/mysqld /var/log/mysql

# Script khởi động MySQL mỗi lần mở container
COPY .devcontainer/start-mysql.sh /usr/local/bin/start-mysql.sh
RUN chmod +x /usr/local/bin/start-mysql.sh

FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bullseye

# Install additional tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    mysql-client \
    curl \
    git \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install global packages
RUN npm install -g npm@latest nestjs/cli ts-node

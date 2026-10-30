#!/bin/bash
set -e

echo "🚀 Setting up Cinema Booking App devcontainer..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd /workspaces/$(basename /workspaces/*) 2>/dev/null || cd /workspaces/$(ls /workspaces | head -1)
cd backend
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
until mysqladmin ping -h"localhost" -uroot -p04112005 --silent 2>/dev/null; do
  echo "MySQL is unavailable - sleeping"
  sleep 2
done
echo "✅ MySQL is ready!"

# Seed database if needed
echo "🌱 Seeding database..."
cd ../backend
npm run seed 2>/dev/null || echo "⚠️  Seeding might have failed or already done - continuing..."

echo "✨ Setup complete!"
echo ""
echo "To start the app, run: ./start.sh"
echo "Or manually:"
echo "  Backend: cd backend && npm run start:dev"
echo "  Frontend: cd frontend && npm run dev"

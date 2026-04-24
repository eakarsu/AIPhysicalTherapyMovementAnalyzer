#!/bin/bash

# ============================================================
# AI Physical Therapy Movement Analyzer - Start Script
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=3001
FRONTEND_PORT=3000

echo "============================================================"
echo "  AI Physical Therapy Movement Analyzer"
echo "  Starting Application..."
echo "============================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ---- Clean up used ports ----
echo -e "${YELLOW}[1/6] Cleaning up ports ${BACKEND_PORT} and ${FRONTEND_PORT}...${NC}"
cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  else
    echo "  Port $port is free."
  fi
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT
echo ""

# ---- Check PostgreSQL ----
echo -e "${YELLOW}[2/6] Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
  echo -e "${RED}PostgreSQL (psql) not found. Please install PostgreSQL.${NC}"
  exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
  echo "  Starting PostgreSQL..."
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || {
    echo -e "${RED}Failed to start PostgreSQL. Please start it manually.${NC}"
    exit 1
  }
  sleep 2
fi
echo -e "  ${GREEN}PostgreSQL is running.${NC}"
echo ""

# ---- Load .env ----
echo -e "${YELLOW}[3/6] Loading environment variables...${NC}"
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
  echo -e "  ${GREEN}.env loaded.${NC}"
else
  echo -e "${RED}.env file not found at $PROJECT_DIR/.env${NC}"
  exit 1
fi
echo ""

# ---- Create database if not exists ----
echo -e "${YELLOW}[4/6] Setting up database...${NC}"
DB_NAME="${DB_NAME:-pt_movement_analyzer}"
DB_USER="${DB_USER:-postgres}"

# Create database if it doesn't exist
if psql -U "$DB_USER" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo "  Database '$DB_NAME' already exists."
else
  echo "  Creating database '$DB_NAME'..."
  createdb -U "$DB_USER" "$DB_NAME" 2>/dev/null || psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || {
    echo -e "${YELLOW}  Could not create database automatically. Trying with default user...${NC}"
    createdb "$DB_NAME" 2>/dev/null || true
  }
fi

# ---- Install dependencies ----
echo -e "${YELLOW}[5/6] Installing dependencies...${NC}"
echo "  Installing backend dependencies..."
cd "$PROJECT_DIR/backend"
npm install --silent 2>&1 | tail -1

echo "  Installing frontend dependencies..."
cd "$PROJECT_DIR/frontend"
npm install --silent 2>&1 | tail -1
echo -e "  ${GREEN}Dependencies installed.${NC}"
echo ""

# ---- Seed database ----
echo -e "${YELLOW}[6/6] Seeding database...${NC}"
cd "$PROJECT_DIR/backend"
node seed.js
echo -e "${GREEN}Database seeded successfully.${NC}"
echo ""

# ---- Start services with hot reload ----
echo "============================================================"
echo -e "${GREEN}  Starting services with hot reload...${NC}"
echo "============================================================"
echo ""
echo -e "  ${BLUE}Backend:${NC}  http://localhost:${BACKEND_PORT}"
echo -e "  ${BLUE}Frontend:${NC} http://localhost:${FRONTEND_PORT}"
echo -e "  ${BLUE}Login:${NC}    admin@ptclinic.com / password123"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services.${NC}"
echo ""

# Trap to kill all background processes on exit
trap 'echo ""; echo "Shutting down..."; kill 0; exit 0' SIGINT SIGTERM

# Start backend with nodemon for hot reload (or node --watch)
cd "$PROJECT_DIR/backend"
if command -v npx &> /dev/null; then
  npx --yes nodemon server.js &
else
  node --watch server.js 2>/dev/null || node server.js &
fi
BACKEND_PID=$!

# Start frontend with Vite (built-in hot reload)
cd "$PROJECT_DIR/frontend"
npx vite --port $FRONTEND_PORT --host &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

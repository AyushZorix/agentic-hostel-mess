#!/bin/bash
# One-Click Stop Script for Hostel Operations Platform (HostelOps)

echo "=========================================================="
echo "  Stopping Hostel Operations Platform (HostelOps)"
echo "=========================================================="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# 1. Stop Frontend, Backend, and ngrok processes
echo "[1/2] Terminating FastAPI, Next.js, and ngrok processes..."
pkill -f "uvicorn src.api:app" > /dev/null 2>&1 || true
pkill -f "next dev" > /dev/null 2>&1 || true
pkill -f "next start" > /dev/null 2>&1 || true
pkill -f "ngrok http" > /dev/null 2>&1 || true

# 2. Stop Docker PostgreSQL
echo "[2/2] Stopping PostgreSQL container..."
docker compose stop

echo "=========================================================="
echo "  All HostelOps services stopped successfully."
echo "=========================================================="

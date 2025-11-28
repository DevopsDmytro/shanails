#!/bin/bash

# SHANAILS LIVE MONITOR
# Filters out SQL noise and shows only API hits and Errors

echo "Starting Live Monitor... (Ctrl+C to stop)"
echo "----------------------------------------"

docker compose logs -f -n 0 backend traefik | grep --line-buffered -E \
  "(\"GET /api|\"POST /api|\"PUT /api|\"DELETE /api| 401 | 403 | 500 |ERROR|CRITICAL)" \
  | grep -v "OPTIONS" \
  | grep -v "sql"

#!/bin/bash

# Clear screen
clear

echo "======================================================="
echo "   🕵️  SHANAILS DEBUG MONITOR (Backend & Traefik)    "
echo "======================================================="
echo "Listening for API requests, Auth errors (401/403), and CORS issues..."
echo "Press [CTRL+C] to stop."
echo "-------------------------------------------------------"

# We follow logs for backend and traefik.
# We grep for:
# - "api/v1" (To see the request path)
# - "401" (Unauthorized errors)
# - "403" (Forbidden errors)
# - "500" (Server crashes)
# - "OPTIONS" (CORS pre-flight checks)
# - "Authorize" (To see if Traefik is stripping headers)

docker compose logs -f --tail=0 backend traefik | grep --line-buffered -E -i "api/v1|401|403|500|OPTIONS|token|cookie"

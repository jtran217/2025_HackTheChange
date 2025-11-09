#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"
PORT="${1:-3000}"

get_ip() {
  local candidate
  for iface in en0 en1; do
    if candidate=$(ipconfig getifaddr "$iface" 2>/dev/null); then
      echo "$candidate"
      return 0
    fi
  done
  if candidate=$(ipconfig getifaddr lo0 2>/dev/null); then
    echo "$candidate"
    return 0
  fi
  return 1
}

if ! IP_ADDRESS=$(get_ip); then
  echo "Unable to determine local IP address" >&2
  exit 1
fi

cat >"${ENV_FILE}" <<EOF
## Put backend url here
EXPO_PUBLIC_API_URL=http://${IP_ADDRESS}:${PORT}
EOF

echo "Updated ${ENV_FILE} with EXPO_PUBLIC_API_URL=http://${IP_ADDRESS}:${PORT}"

#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
mkdir -p "$UNIT_DIR"

chmod +x "$ROOT/scripts/shadvert-watchdog.sh"
sed "s|/home/jamajka/projekty/moje-app|$ROOT|g" "$ROOT/scripts/shadvert-watchdog.service" > "$UNIT_DIR/shadvert-watchdog.service"
cp "$ROOT/scripts/shadvert-watchdog.timer" "$UNIT_DIR/shadvert-watchdog.timer"

systemctl --user daemon-reload
systemctl --user enable --now shadvert-watchdog.timer
echo "Watchdog nainstalován (každé 2 min)."
systemctl --user list-timers shadvert-watchdog.timer --no-pager || true

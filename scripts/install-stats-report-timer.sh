#!/usr/bin/env bash
# Install systemd user timer for Shadvert stats report on this Lenovo PC.
# Usage:
#   ./scripts/install-stats-report-timer.sh           # weekly Mon 08:00
#   ./scripts/install-stats-report-timer.sh daily      # every day 08:00
#   ./scripts/install-stats-report-timer.sh uninstall  # remove timer
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
MODE="${1:-weekly}"

SERVICE_SRC="$ROOT/scripts/shadvert-stats-report.service"
TIMER_SRC="$ROOT/scripts/shadvert-stats-report.timer"
SERVICE_DST="$UNIT_DIR/shadvert-stats-report.service"
TIMER_DST="$UNIT_DIR/shadvert-stats-report.timer"

mkdir -p "$UNIT_DIR"

if [[ "$MODE" == "uninstall" ]]; then
  systemctl --user disable --now shadvert-stats-report.timer 2>/dev/null || true
  rm -f "$SERVICE_DST" "$TIMER_DST"
  systemctl --user daemon-reload
  echo "Timer odinstalován."
  exit 0
fi

if [[ ! -f "$SERVICE_SRC" || ! -f "$TIMER_SRC" ]]; then
  echo "Chybí unit soubory v scripts/" >&2
  exit 1
fi

# Rewrite WorkingDirectory / paths if project not under default (portable)
sed "s|/home/jamajka/projekty/moje-app|$ROOT|g" "$SERVICE_SRC" > "$SERVICE_DST"

if [[ "$MODE" == "daily" ]]; then
  cat > "$TIMER_DST" <<EOF
[Unit]
Description=Timer: ShadowGuard stats report (daily 08:00)

[Timer]
OnCalendar=*-*-* 08:00:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
EOF
  echo "Režim: denně v 08:00"
elif [[ "$MODE" == "weekly" ]]; then
  sed "s|/home/jamajka/projekty/moje-app|$ROOT|g" "$TIMER_SRC" > "$TIMER_DST"
  echo "Režim: týdně (pondělí 08:00)"
else
  echo "Neznámý režim: $MODE (weekly|daily|uninstall)" >&2
  exit 1
fi

systemctl --user daemon-reload
systemctl --user enable --now shadvert-stats-report.timer

echo
echo "Nainstalováno:"
systemctl --user status shadvert-stats-report.timer --no-pager -l || true
echo
echo "Další běh:"
systemctl --user list-timers shadvert-stats-report.timer --no-pager || true
echo
echo "Ruční spuštění teď:"
echo "  systemctl --user start shadvert-stats-report.service"
echo "  # nebo: python3 $ROOT/scripts/daily-stats-report.py --dry-run"
echo
echo "SMTP: doplň REPORT_SMTP_USER + REPORT_SMTP_PASS do .env.local (Gmail App Password)."
echo "Bez SMTP se report jen uloží do data/reports/."

#!/usr/bin/env bash
# Keep Lenovo awake on AC so Shadvert + Cloudflare Tunnel survive idle / closed lid.
set -euo pipefail

echo "Vypínám suspend na AC (uživatelská nastavení)…"

if command -v gsettings >/dev/null 2>&1; then
  gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing' 2>/dev/null || true
  gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-timeout 0 2>/dev/null || true
  gsettings set org.gnome.settings-daemon.plugins.power lid-close-ac-action 'blank' 2>/dev/null || true
  gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-battery-type 'nothing' 2>/dev/null || true
fi

if command -v xfconf-query >/dev/null 2>&1; then
  # 0 = never / do nothing
  xfconf-query -c xfce4-power-manager -p /xfce4-power-manager/inactivity-on-ac -n -t int -s 0
  xfconf-query -c xfce4-power-manager -p /xfce4-power-manager/lid-action-on-ac -n -t uint -s 0
  xfconf-query -c xfce4-power-manager -p /xfce4-power-manager/inactivity-sleep-mode-on-ac -n -t uint -s 0 2>/dev/null || true
fi

UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$UNIT_DIR"
cp "$ROOT/scripts/shadvert-stay-awake.service" "$UNIT_DIR/shadvert-stay-awake.service"
systemctl --user daemon-reload
systemctl --user enable --now shadvert-stay-awake.service

echo
echo "Stay-awake služba:"
systemctl --user is-active shadvert-stay-awake.service
systemd-inhibit --list 2>/dev/null | grep -i shadvert || true
echo
echo "BIOS (ručně, jednou): Restore on AC / Power on after power loss = Enabled"
echo "Bez toho delší výpadek proudu PC samo nezapne."

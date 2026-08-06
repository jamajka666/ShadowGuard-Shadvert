# Automatický report statistik (Lenovo PC)

**Cíl:** jednou týdně (nebo denně) sestavit souhrn z `data/family.json` a volitelně poslat e-mail na `23jamajka666@gmail.com` — **lokálně na PC**, ne přes veřejné API appky.

Souvisí s klientským `mailto` v appce (ruční odeslání z telefonu). Cron je **druhý kanál** pro data, která už dorazila rodinným syncem na server.

---

## Co report obsahuje

- počet registrovaných zařízení, kolik jich bylo vidět za 24 h  
- počty kontrol: důvěryhodné / opatrnost / PODVOD (+ %)  
- „vysoká jistota podvodu“ (trustScore ≤ 10 nebo `phishing_kill`)  
- výběr záznamů PODVOD (headline, skóre, zařízení, URL)  

**Neobsahuje:** FAMILY_CODE, ADMIN_TOKEN, jména testerů, hesla.

---

## Rychlý start

```bash
cd ~/projekty/moje-app

# 1) Zkusit report bez e-mailu
python3 scripts/daily-stats-report.py --dry-run

# 2) Nainstalovat systemd timer (doporučeno — už používáš shadvert.service)
./scripts/install-stats-report-timer.sh          # pondělí 08:00
# nebo:
./scripts/install-stats-report-timer.sh daily    # každý den 08:00

# 3) (Volitelně) SMTP pro opravdové odeslání — viz níže
```

Soubory reportů: `data/reports/stats-report-*.txt` a `data/reports/latest.txt` (gitignored).

---

## Gmail App Password (odesílání)

1. Google účet → [App passwords](https://myaccount.google.com/apppasswords) (vyžaduje 2FA).  
2. Vytvoř heslo pro „Mail“ / „Other: Shadvert Lenovo“.  
3. Do `.env.local` doplň:

```bash
REPORT_TO_EMAIL="23jamajka666@gmail.com"
REPORT_SMTP_HOST="smtp.gmail.com"
REPORT_SMTP_PORT="587"
REPORT_SMTP_USER="23jamajka666@gmail.com"
REPORT_SMTP_PASS="xxxx xxxx xxxx xxxx"   # App Password, ne běžné heslo
REPORT_SMTP_FROM="23jamajka666@gmail.com"
REPORT_STATS_DAYS=7
# REPORT_DRY_RUN=1   # vynutit jen soubor i bez --dry-run
```

4. Test odeslání:

```bash
python3 scripts/daily-stats-report.py
# nebo hned teď přes systemd:
systemctl --user start shadvert-stats-report.service
journalctl --user -u shadvert-stats-report.service -n 40 --no-pager
```

Bez `REPORT_SMTP_*` skript **neselže** — uloží report a skončí 0 (vhodné pro první dny).

---

## Systemd (preferované)

| Unit | Účel |
|------|------|
| `shadvert-stats-report.service` | jednorázový běh skriptu |
| `shadvert-stats-report.timer` | plán (weekly / daily) |

```bash
systemctl --user list-timers shadvert-stats-report.timer
systemctl --user start shadvert-stats-report.service   # teď
./scripts/install-stats-report-timer.sh uninstall      # vypnout
```

Aby timer běžel i po odhlášení z desktopu (server stále běží):

```bash
loginctl enable-linger jamajka
```

(U tebe už pravděpodobně běží `shadvert.service` přes user systemd — linger můžeš mít zapnutý.)

---

## Klasický cron (alternativa)

```bash
crontab -e
# Týdně pondělí 8:00:
0 8 * * 1 /usr/bin/python3 /home/jamajka/projekty/moje-app/scripts/daily-stats-report.py >> /home/jamajka/projekty/moje-app/data/reports/cron.log 2>&1
```

---

## Ověření

```bash
python3 scripts/daily-stats-report.py --dry-run
test -f data/reports/latest.txt && head -40 data/reports/latest.txt
systemctl --user is-enabled shadvert-stats-report.timer   # po install
```

---

## Bezpečnost

- SMTP heslo jen v `.env.local` (už v `.gitignore`).  
- Report neposílá se na internet přes Express API.  
- Interval default **týden** — méně „strašení“ sběrem dat; app banner v klientovi je nezávislý a vypnutelný.

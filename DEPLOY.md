# Nasazení ShadowGuard Shadvert (PC + Cloudflare Tunnel)

Cíl: telefony mimo LAN otevřou **https://shadowguard-shadvert.site** (nebo **https://www.shadowguard-shadvert.site**) s HTTPS (nutné pro mikrofon a hlas).

## 0. Předpoklady

- Doména `shadowguard-shadvert.site` u Namecheap (DNS nameservery → Cloudflare)
- Účet [Cloudflare](https://dash.cloudflare.com) (zdarma)
- Na PC: Node.js 20+ (NVM OK), `cloudflared` v `~/.local/bin`
- V projektu `.env.local` s `GEMINI_API_KEY`, `ADMIN_TOKEN`, `FAMILY_CODE`, `APP_URL`

## 1. DNS domény u Cloudflare

1. Přidej doménu do Cloudflare → zkopíruj nameservery.
2. U Namecheap nastav tyto nameservery (ne URL Redirect / parking A záznamy).
3. Počkej na Active.
4. Pro apex (`@` / `shadowguard-shadvert.site`) **nesmí** zůstat ruční A/AAAA parking — tunnel vytvoří CNAME na `UUID.cfargotunnel.com`.

## 2. Instalace cloudflared

```bash
# aktuální binárka (příklad)
mkdir -p ~/.local/bin
curl -L --output /tmp/cloudflared \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x /tmp/cloudflared
mv /tmp/cloudflared ~/.local/bin/cloudflared
export PATH="$HOME/.local/bin:$PATH"
cloudflared --version
```

## 3. Přihlášení a named tunnel

```bash
export PATH="$HOME/.local/bin:$PATH"
cloudflared tunnel login
# Prohlížeč → vyber zónu shadowguard-shadvert.site
# Uloží ~/.cloudflared/cert.pem

cloudflared tunnel create shadowguard
# Zapamatuj Tunnel ID (UUID) a credentials JSON

# DNS CNAME na tunnel (u apex: nejdřív smaž existující A/AAAA v CF DNS)
cloudflared tunnel route dns --overwrite-dns shadowguard shadowguard-shadvert.site
cloudflared tunnel route dns --overwrite-dns shadowguard www.shadowguard-shadvert.site
```

### Apex konflikt (A/AAAA už existuje)

V [Cloudflare DNS](https://dash.cloudflare.com) pro zónu:

1. Smaž záznamy typu **A** a **AAAA** pro jméno `@` / `shadowguard-shadvert.site` (parking / Namecheap forward).
2. Znovu:

```bash
cloudflared tunnel route dns --overwrite-dns shadowguard shadowguard-shadvert.site
```

Nebo ručně CNAME `@` → `<TUNNEL_ID>.cfargotunnel.com` (Proxy **ON**).

## 4. Konfigurace tunnelu

`~/.cloudflared/config.yml` (uprav `TUNNEL_ID`):

```yaml
tunnel: TUNNEL_ID
credentials-file: /home/jamajka/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: shadowguard-shadvert.site
    service: http://127.0.0.1:3000
  - hostname: www.shadowguard-shadvert.site
    service: http://127.0.0.1:3000
  - service: http_status:404
```

**Nikdy** necommituj `cert.pem`, `*.json` credentials ani `config.yml` s citlivými cestami do veřejného repa (credentials jsou mimo git v `~/.cloudflared/`).

## 4b. Automatický report statistik (volitelné)

Týdenní souhrn z `data/family.json` na tomto PC (systemd timer).  
Návod: **`docs/DAILY-STATS-CRON.md`**.

```bash
python3 scripts/daily-stats-report.py --dry-run
./scripts/install-stats-report-timer.sh   # Mon 08:00
# Pro e-mail: REPORT_SMTP_* (Gmail App Password) v .env.local
```

## 5. Build a spuštění aplikace

```bash
cd ~/projekty/moje-app

# .env.local — nikdy do gitu
cp .env.example .env.local
# doplň GEMINI_API_KEY, ADMIN_TOKEN, FAMILY_CODE, APP_URL=https://shadowguard-shadvert.site

export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"   # pokud NVM
npm install
npm run build
NODE_ENV=production npm start
# Server: http://0.0.0.0:3000
```

Ověření:

```bash
curl -sS http://127.0.0.1:3000/api/health
curl -sS https://www.shadowguard-shadvert.site/api/health
curl -sS https://shadowguard-shadvert.site/api/health
```

## 6. Systemd (běží po restartu / odhlášení)

### Aplikace — `~/.config/systemd/user/shadvert.service`

```ini
[Unit]
Description=ShadowGuard Shadvert
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/jamajka/projekty/moje-app
Environment=NODE_ENV=production
Environment=PATH=/home/jamajka/.nvm/versions/node/v20.20.2/bin:/usr/bin:/bin
EnvironmentFile=/home/jamajka/projekty/moje-app/.env.local
ExecStart=/home/jamajka/.nvm/versions/node/v20.20.2/bin/node /home/jamajka/projekty/moje-app/dist/server.cjs
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

### Tunnel — `~/.config/systemd/user/cloudflared-shadvert.service`

```ini
[Unit]
Description=Cloudflare Tunnel ShadowGuard
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/home/jamajka/.local/bin/cloudflared tunnel --config /home/jamajka/.cloudflared/config.yml run shadowguard
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user enable --now shadvert.service cloudflared-shadvert.service
loginctl enable-linger $USER   # běží i po odhlášení (PC musí být zapnuté)
```

## 7. Tablet / telefon (rodina)

1. Chrome → `https://www.shadowguard-shadvert.site` (nebo apex, až DNS sedí)
2. Menu → **Přidat na plochu** / Nainstalovat aplikaci
3. Povolit mikrofon při prvním hlasu
4. **Rodinné propojení**:
   - název zařízení (`Táta tablet`)
   - **FAMILY_CODE** (stejný jako v `.env.local` na serveru)
   - zapni sync historie

## 8. Admin (ty)

1. `https://www.shadowguard-shadvert.site/admin`
2. Vlož **ADMIN_TOKEN** z `.env.local`
3. Online zařízení, synchronizované kontroly
4. **Force update všech** — reload PWA na klientech (do ~45 s)

## 9. Aktualizace kódu

```bash
cd ~/projekty/moje-app
git pull
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
npm install
npm run build
systemctl --user restart shadvert.service
# Volitelně v /admin: Force update
```

## 10. Dočasný quick tunnel (jen test, ne produkce)

```bash
./scripts/quick-tunnel.sh
# → náhodná https://*.trycloudflare.com URL
```

Pro rodinu vždy používej **named tunnel** + doménu.

## Řešení problémů

| Problém | Řešení |
|--------|--------|
| Hlas nefunguje | Jen HTTPS + Chrome/Edge; zámek 🔒 u URL |
| 502 od Cloudflare | Běží app na :3000? `curl localhost:3000/api/health` |
| Tunnel offline | `systemctl --user status cloudflared-shadvert` |
| Apex timeout, www OK | Smaž A/AAAA parking u `@` v CF DNS, znovu `tunnel route dns` |
| Gemini chyby | Klíč v `.env.local`, restart `shadvert.service` |
| Starý obsah na telefonu | Admin → Force update / smazat data webu v Chrome |

## Bezpečnost

- `.env.local` **nikdy** necommituj
- `ADMIN_TOKEN` a `FAMILY_CODE` sdílej jen v rodině; při prozrazení rotuj
- `~/.cloudflared/*.json` a `cert.pem` jsou tajné
- Doména má HTTPS od Cloudflare automaticky
- PC vypnutý / spánek = web offline

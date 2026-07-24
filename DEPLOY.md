# Nasazení ShadowGuard Shadvert (PC Německo + Cloudflare Tunnel)

Cíl: telefony v ČR otevřou **https://shadowguard-shadvert.site** s HTTPS (nutné pro mikrofon a hlas).

## 0. Předpoklady

- Doména `shadowguard-shadvert.site` (už máš)
- Účet [Cloudflare](https://dash.cloudflare.com) (zdarma)
- Na PC běží Node.js 20+
- V projektu existuje `.env.local` s `GEMINI_API_KEY`, `ADMIN_TOKEN`, `FAMILY_CODE`

## 1. DNS domény u Cloudflare

1. Přidej doménu do Cloudflare → zkopíruj nameservery.
2. U registrátora domény nastav tyto nameservery.
3. Počkej na Active (minuty až hodiny).
4. V DNS **zatím nic** pro A/AAAA ručně nevytvářej — tunnel to udělá.

## 2. Instalace cloudflared na Linux PC

```bash
# Debian/Ubuntu (nebo stáhni .deb z GitHub releases cloudflare/cloudflared)
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
cloudflared --version
```

## 3. Přihlášení a tunnel

```bash
cloudflared tunnel login
# Otevře prohlížeč — vyber doménu shadowguard-shadvert.site

cloudflared tunnel create shadowguard
# Zapamatuj si Tunnel ID (UUID)

cloudflared tunnel route dns shadowguard shadowguard-shadvert.site
# Vytvoří CNAME na tunnel
```

## 4. Konfigurace tunnelu

Soubor `~/.cloudflared/config.yml` (uprav `TUNNEL_ID` a cestu k credentials):

```yaml
tunnel: TUNNEL_ID
credentials-file: /home/JMENO/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: shadowguard-shadvert.site
    service: http://127.0.0.1:3000
  - service: http_status:404
```

## 5. Build a spuštění aplikace

```bash
cd ~/projekty/moje-app   # nebo kde máš repo

# .env.local musí existovat (necommituje se)
cp .env.example .env.local
# doplň GEMINI_API_KEY, ADMIN_TOKEN, FAMILY_CODE, APP_URL

export NODE_ENV=production
npm install
npm run build
npm start
# Server: http://0.0.0.0:3000
```

V druhém terminálu:

```bash
cloudflared tunnel run shadowguard
```

Ověření:

```bash
curl -s https://shadowguard-shadvert.site/api/health
```

## 6. Systemd (aby běželo po restartu PC)

### Aplikace — `~/.config/systemd/user/shadvert.service`

```ini
[Unit]
Description=ShadowGuard Shadvert
After=network.target

[Service]
Type=simple
WorkingDirectory=%h/projekty/moje-app
Environment=NODE_ENV=production
EnvironmentFile=%h/projekty/moje-app/.env.local
ExecStart=/usr/bin/node dist/server.cjs
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
ExecStart=/usr/local/bin/cloudflared tunnel run shadowguard
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user enable --now shadvert.service
systemctl --user enable --now cloudflared-shadvert.service
loginctl enable-linger $USER   # běží i po odhlášení
```

## 7. Tablet / telefon (táta)

1. Chrome → `https://shadowguard-shadvert.site`
2. Menu → **Přidat na plochu** / Nainstalovat aplikaci
3. Povolit mikrofon při prvním hlasu
4. V sekci **Rodinné propojení** nastav:
   - název zařízení (`Táta tablet`)
   - **FAMILY_CODE** (stejný jako v `.env.local` na serveru)
   - zapni sync historie

## 8. Admin (ty)

1. `https://shadowguard-shadvert.site/admin`
2. Vlož **ADMIN_TOKEN** z `.env.local`
3. Uvidíš online zařízení a synchronizované kontroly
4. **Force update všech** — vynutí reload PWA na klientech (do ~45 s)

## 9. Aktualizace kódu

```bash
cd ~/projekty/moje-app
git pull
npm install
npm run build
systemctl --user restart shadvert.service
# Volitelně v /admin: Force update
```

## Řešení problémů

| Problém | Řešení |
|--------|--------|
| Hlas nefunguje | Jen HTTPS + Chrome/Edge; zkontroluj zámek 🔒 u URL |
| 502 od Cloudflare | Běží `npm start` na :3000? `curl localhost:3000/api/health` |
| Tunnel offline | `cloudflared tunnel run` / systemd status |
| Gemini chyby | Klíč v `.env.local`, fallback analýza pořád funguje |
| Starý obsah na telefonu | Admin → Force update, nebo smazat data webu v Chrome |

## Bezpečnost

- `.env.local` **nikdy** necommituj do gitu
- `ADMIN_TOKEN` a `FAMILY_CODE` sdílej jen v rodině
- Doména má HTTPS od Cloudflare automaticky

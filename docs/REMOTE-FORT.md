# FORT 1 — dálkový vstup k Shadvertu (Lenovo)

Cíl: když jsi pryč (ČR, víkend) a kontrola visí, z telefonu **vidíš stav** a umíš **restartovat služby**. Neprovozuješ server na telefonu.

## Co umí a co ne

| Situace | FORT pomůže? |
|---------|----------------|
| App nebo tunnel na zapnutém Lenovu visí | Ano — Admin → Restart |
| Lenovo usnulo / je vypnuté / bez proudu | Ne. Nejdřív vrstva „nespát“ + BIOS Restore on AC. |

## 1. Tailscale na FORT 1

Na Lenovu už Tailscale běží (`lenovo-shadvert`). Na telefon:

1. Play Store → **Tailscale**
2. Přihlaš **stejný účet** jako na Lenovu (`23jamajka666@` / tvůj Tailscale login)
3. Zapni VPN. V seznamu uvidíš `lenovo-shadvert` a `asus`.

Veřejná app (`https://shadowguard-shadvert.site`) Tailscale **nepotřebuje** — ta jde přes Cloudflare. Tailscale je záloha, když chceš SSH.

## 2. Admin z telefonu (hlavní cesta)

1. Chrome → `https://shadowguard-shadvert.site/admin`
2. `ADMIN_TOKEN` z `.env.local` (stejný jako na PC)
3. Karta **Stav Lenova**: app / tunnel active, uptime, Gemini klíč
4. **Restart tunnel** / **Restart app** / **Restart obojí**

Když se `/admin` vůbec nenačte, Lenovo spí nebo je offline. Pak z telefonu nic neprobudíš.

## 3. SSH záloha (Termux / ConnectBot)

```bash
ssh jamajka@lenovo-shadvert
systemctl --user status shadvert.service cloudflared-shadvert.service --no-pager
systemctl --user restart cloudflared-shadvert.service
systemctl --user restart shadvert.service
curl -sS http://127.0.0.1:3000/api/health
```

Funguje jen když je Lenovo vzhůru a Tailscale connected.

## 4. BIOS (jednou, u PC)

V BIOS Lenova (většinou F2 / Novo): **Restore on AC / Power on after power loss = Enabled**.  
Krátký výpadek proudu pak PC samo zapne a linger zvedne Shadvert.

## 5. Co na FORT nedávat

Gemini API klíč, `FAMILY_CODE`, cloudflared `cert.pem` / credentials JSON. Telefon je řízení, ne druhý server.

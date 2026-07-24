# ShadowGuard Shadvert

Rodinný bezpečnostní štít pro kontrolu inzerátů, e-shopů a podezřelých odkazů.  
Primárně pro Android (PWA) + desktop Chrome/Edge. Server běží na tvém PC v Německu za doménou **shadowguard-shadvert.site**.

## Rychlý start (vývoj)

```bash
cp .env.example .env.local
# doplň GEMINI_API_KEY, ADMIN_TOKEN, FAMILY_CODE

npm install
npm run dev
# → http://localhost:3000
```

Admin panel: http://localhost:3000/admin

## Produkce

```bash
npm run build
NODE_ENV=production npm start
```

Nasazení přes Cloudflare Tunnel: viz **[DEPLOY.md](./DEPLOY.md)**.

## Hlasové ovládání

- Funguje v **Google Chrome / Edge** (Web Speech API).
- Na telefonu **vyžaduje HTTPS** (proto Cloudflare Tunnel + doména).
- Příkazy: „historie“, „kvíz“, „kontrola“, „přečti výsledek“, „zastavit“…
- Diktát textu inzerátu: ikona mikrofonu u polí formuláře.

## Rodina a remote správa

1. Na serveru v `.env.local` nastav `FAMILY_CODE` a `ADMIN_TOKEN`.
2. Na tabletu v sekci **Rodinné propojení** zadej stejný kód a zapni sync.
3. Ty: `/admin` → seznam zařízení, historie kontrol, **Force update**.

## Struktura

- `server.ts` — Express API (analýza, SSL, family, admin)
- `src/` — React UI
- `public/brand/` — optimalizovaná loga a krátká videa
- `data/` — runtime JSON (gitignore)

## Bezpečnost

Nikdy necommituj `.env.local` ani skutečné API klíče.  
`.env.example` obsahuje jen placeholdery.

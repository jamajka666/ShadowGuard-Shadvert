# Closed beta — jednotný feedback formulář

**Stav:** podklad pro Google Form + sjednocení s First Creation lab  
**Navazuje na:** SGW-007 Feature Trust Gate, plán Trust Sprint 2026-08-06  
**Cíl:** táta + 5–10 testerů odpovídá na **stejné** otázky

---

## Kanál

| Pro koho | Jak |
|----------|-----|
| Netechničtí (táta, rodina) | **Google Form** (odkaz v návodu / WhatsApp) |
| Zakladatel / lab | Export JSON z First Creation Design Lab (lokálně) |

Otázky v Formu i v labu mají být **shodné** (stejné pořadí, stejné škály).

---

## Otázky (povinná sada)

### 1. Bylo jasné, co výsledek znamená?
- Typ: škála **1–5** (1 = vůbec ne, 5 = úplně ano)

### 2. Věřil/a jste vysvětlení „proč“?
- Typ: škála **1–5**

### 3. Bylo ovládání jednoduché?
- Typ: škála **1–5**

### 4. Něco vás zmatlo?
- Typ: **volný text** (volitelné, ale doporučené)

### 5. Cítíte se po použití…
- Typ: volba
  - jistěji  
  - stejně  
  - nejistěji  

### 6. Který vzhled aplikace vám nejvíce vyhovoval?
- Typ: volba (doplnit podle aktuálních variant)
  - First Creation (současná live verze)  
  - Jednoduchý / Calm (design-v2, pokud tester viděl)  
  - Design Lab vzorkovnice (pokud zkoušel barvy)  
  - Jiný / nevím  
- Volitelně: krátký text „proč“

### 7. Doporučili byste tuto aplikaci?
- Typ: volba
  - Ano  
  - Spíše ano  
  - Spíše ne  
  - Ne  
- Volitelně: krátký text „proč“

### 8. Připomínky
- Typ: **volný text**

---

## Metadata (volitelné na konci Formu)

- Jméno / přezdívka (ne povinné)  
- Zařízení (telefon / tablet / PC)  
- Datum testu  
- Verze / režim (First Creation / simple flag), pokud ví

---

## Google Form — checklist pro zakladatele

1. Vytvořit Form s otázkami 1–8 níže (copy-paste).  
2. Odpovědi do Google Sheet (pro srovnání).  
3. Odkaz dát do `docs/TESTER-PACK.md` / WhatsApp a sem.  
4. Sem doplnit **URL formuláře** po vytvoření:

```
FEEDBACK_FORM_URL=
```

Návod pro testery (WhatsApp + instalace): **`docs/TESTER-PACK.md`**.

---

## Copy-paste: přesné znění pro Google Form

**Název formuláře:** ShadowGuard Shadvert — closed beta feedback  
**Popis:** Děkujeme za vyzkoušení. Stačí 2–3 kontroly v aplikaci a pak těchto 8 otázek. Žádná registrace, žádné osobní údaje povinné.

| # | Otázka (text) | Typ v Google Form | Možnosti / nastavení |
|---|----------------|-------------------|----------------------|
| 1 | Bylo jasné, co výsledek znamená? | Lineární škála | 1–5; popisky: 1 = vůbec ne, 5 = úplně ano; **povinné** |
| 2 | Věřil/a jste vysvětlení „proč“? | Lineární škála | 1–5; 1 = vůbec ne, 5 = úplně ano; **povinné** |
| 3 | Bylo ovládání jednoduché? | Lineární škála | 1–5; 1 = vůbec ne, 5 = úplně ano; **povinné** |
| 4 | Něco vás zmatlo? | Odstavec (dlouhá odpověď) | volitelné |
| 5 | Cítíte se po použití… | Výběr z možností (jedna) | jistěji · stejně · nejistěji; **povinné** |
| 6 | Který vzhled aplikace vám nejvíce vyhovoval? | Výběr z možností (jedna) | First Creation (současná live verze) · Jednoduchý / Calm (pokud jste viděli `?mode=simple`) · Design Lab vzorkovnice (pokud jste zkoušeli barvy) · Jiný / nevím; **povinné** |
| 6b | (volitelně) Proč vám ten vzhled vyhovoval? | Krátká odpověď | volitelné |
| 7 | Doporučili byste tuto aplikaci? | Výběr z možností (jedna) | Ano · Spíše ano · Spíše ne · Ne; **povinné** |
| 8 | Připomínky | Odstavec | volitelné |

**Metadata na konci (vše volitelné):**

| # | Otázka | Typ |
|---|--------|-----|
| M1 | Jméno / přezdívka | Krátká odpověď |
| M2 | Zařízení | Výběr: telefon · tablet · PC · jiné |
| M3 | Datum testu | Datum |
| M4 | Režim (pokud víte) | Výběr: First Creation · Jednoduchý (`?mode=simple`) · nevím |

### Nastavení Formu

1. [forms.google.com](https://forms.google.com) → prázdný formulář.  
2. Vložit otázky podle tabulky (pořadí 1→8, pak metadata).  
3. Odpovědi → **Propojit s Tabulkami** (Sheet).  
4. Odesílání: **kdokoli s odkazem** (closed beta — odkaz posílej jen známým).  
5. Zkopírovat odkaz → `FEEDBACK_FORM_URL=` sem + do WhatsApp textu v `TESTER-PACK.md`.

### Po 5–7 odpovědích se dívej hlavně na

- **1** srozumitelnost výsledku  
- **2** důvěra v „proč“  
- **5** jistota po použití  
- **8** připomínky  

Shrnutí → Chronicle + případně Book of Decisions.

---

## Proč ne víc otázek

Víc než ~8 otázek unaví seniora.  
Detail techniky řešíš ty z logů a lab exportu — ne táta.

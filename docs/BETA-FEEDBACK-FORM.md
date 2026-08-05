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

1. Vytvořit Form s otázkami 1–8 výše.  
2. Odpovědi do Google Sheet (pro srovnání).  
3. Odkaz dát do návodu pro tátu a do WhatsApp pro testery.  
4. Sem doplnit **URL formuláře** po vytvoření:

```
FEEDBACK_FORM_URL=
```

---

## Proč ne víc otázek

Víc než ~8 otázek unaví seniora.  
Detail techniky řešíš ty z logů a lab exportu — ne táta.

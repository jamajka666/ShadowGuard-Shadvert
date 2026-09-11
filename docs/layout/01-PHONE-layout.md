# ShadowGuard Shadvert — Šablona PHONE (telefon)

**Breakpoint:** šířka viewportu &lt; 768px (portrait)  
**Princip:** využít **výšku** — vše nad sebou, velké a čitelné  
**Master:** viz `00-MASTER-layout-foundation.md` §2 (above-the-fold lock)

---

## Above-the-fold (povinné pořadí)

```
┌─────────────────────────────┐
│ [Logo/Název]    [Připojeno] │
│ Stručný │ Detailní          │
│ Hlasové ovládání │ Nastavení│
├─────────────────────────────┤
│                             │
│   Okno: zadání inzerátu     │
│   (kroky 1–3 pod sebou)     │
│                             │
├─────────────────────────────┤
│ ████ PROVĚŘIT… (zlaté) ████ │
└─────────────────────────────┘
     ↑ konec foldu (100dvh)
```

Pod foldem (scroll): ukázkové inzeráty, rodinné propojení, atd.

---

## Header

| Prvek | Pravidlo |
|--------|----------|
| Název | 1. řádek vlevo; font ≥ 20px; nesmí se zalamovat do nečitelnosti |
| Připojeno | 1. řádek vpravo; kompaktní pill |
| Stručný / Detailní | 2. řádek; min. výška 44px; mohou být 2 vedle sebe |
| Hlasové / Nastavení | 3. řádek nebo wrap pod režimy; min. 44px |
| Zakázáno | horizontální mačkání všech 4+Připojeno do jedné drobné řady |

---

## Okno inzerátu

- Jeden rámeček (brand border), padding ≥ 12px  
- Kroky **1 → 2 → 3 vždy pod sebou** (1 sloupec)  
- Input font ≥ 18px; placeholdery ≥ 16px a doplněné viditelným labelem  
- Quick akce (mikrofon, schránka): pod labely nebo jako ikony ≥ 44×44, ne tři úzké sloupce  
- SSL / pomocné akce pod URL polem, full-width nebo 2× half max  

---

## CTA

- Full width v rámci bezpečného okraje (margin ≥ 12px)  
- Min. výška **48px**, font ≥ 18px tučně  
- Celé CTA viditelné bez scrollu na typickém telefonu (~667–844 CSS px výšky)  
- Žádný splash / overlay přes CTA  

---

## Typografie a hustota

| Role | Min. velikost |
|------|----------------|
| Body | 18px |
| Label kroku | 20px |
| Název app | 20–22px |
| CTA | 18–20px |

Line-height ≥ 1.4. Mezery mezi klikacími prvky ≥ 12px.

---

## Nesmí

- Desktop layout zmenšený (`transform: scale` / pevná šířka karty &gt; viewport)  
- 2–3 karty ukázek vedle sebe nad foldem  
- Text &lt; 16px jako jediný návod  

---

## Kontrola po nasazení

- [ ] Fold = jen header + vstup + CTA  
- [ ] CTA dole viditelné bez scrollu  
- [ ] 1 sloupec, čitelné pro seniory  
- [ ] API / verdikty beze změny  

# ShadowGuard Shadvert — Šablona MONITOR

**Breakpoint:** 1025px–1919px  
**Princip:** využít **šířku** — rozložení víc do stran, stejná skládanka  
**Master:** `00-MASTER-layout-foundation.md`

---

## Above-the-fold

```
┌─────────────────────────────────────────────────────────┐
│ [Logo Název]   Stručný  Detailní  Hlas  Nastavení  [Připojeno] │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────┐  ┌──────────────────┐  │
│  │ Okno: zadání inzerátu       │  │ Quick akce       │  │
│  │ kroky 1–3 (stack nebo       │  │ mikrofon/schránka│  │
│  │ URL plná šířka + side help) │  │ (volitelné)      │  │
│  └─────────────────────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────┤
│              ████████ PROVĚŘIT… ████████                 │
└─────────────────────────────────────────────────────────┘
```

Quick akce **nesmí** vytlačit CTA pod fold. Pokud nevychází výška: quick akce zpět do vstupního stacku.

---

## Header

- Jedna horizontální řada, roztažená  
- Název vlevo, ovládání střed/pravá část, Připojeno vpravo  
- Stejné 4 ovládací prvky + Připojeno  

---

## Okno inzerátu

- Karta max ~960–1100px nebo fluid s max-width  
- Monitor smí: hlavní pole vlevo, úzký sloupec akcí vpravo  
- Stále jeden vizuální „blok zadání“ — ne roztříštěné widgety po celé stránce  

---

## CTA

- Zarovnané na šířku vstupní karty  
- Min. výška **48–56px**  
- Zlaté, poslední nad foldem  

---

## Typografie

| Role | Doporučení |
|------|------------|
| Body | 16–18px (monitor čtecí vzdálenost; nesmí klesnout pod 16) |
| Label | 18–20px |
| Název | 24px+ |
| CTA | 18–20px |

Pozn.: na monitoru je body smí být o 1 stupeň menší než telefon, ale **hierarchie a skládanka musí sedět** s PHONE/TABLET.

---

## Zakázáno

- Zmenšený mobilní stack uprostřed obří prázdné zelené plochy bez využití šířky **a zároveň** bez viditelného CTA  
- Jiné pořadí bloků než header → vstup → CTA  

---

## Kontrola po nasazení

- [ ] Fold lock drží  
- [ ] Side-by-side jen uvnitř vstupní zóny  
- [ ] Vizuálně „stejná appka“ jako na telefonu  

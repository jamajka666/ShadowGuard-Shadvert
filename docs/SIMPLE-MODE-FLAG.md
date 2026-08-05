# Režim Jednoduchý — closed beta flag (Fáze 3)

**Stav:** připraveno na větvi · **default live = First Creation**  
**Rozhodnutí:** D-021 · D-019  

---

## Jak zapnout (testeři)

| Způsob | Příklad |
|--------|---------|
| Query | `https://shadowguard-shadvert.site/?mode=simple` |
| Alternativa | `?simple=1` · `?mode=jednoduchy` |
| Cesta | `https://shadowguard-shadvert.site/simple` |

Po prvním otevření s flagem se volba **uloží** do `localStorage` (`sg_ui_mode=simple`), aby senior nemusel pokaždé skládat URL.

## Jak vypnout (zpět na First Creation)

| Způsob | Příklad |
|--------|---------|
| Query | `?mode=classic` nebo `?simple=0` |
| V app | odkaz „Zpět na klasický vzhled“ v banneru |

## Co se změní

- Výsledek = **SimpleResultCard** (semafor · proč · co teď · zobrazit podrobnosti).
- „Zobrazit více podrobností“ → plný **ResultDisplay** (First Creation detail).
- Méně navigace (bez kvízu / hlasu v defaultní simple cestě).
- Klidné světlé pozadí u výsledku.

## Co se **nezmění**

- Default bez flagu = First Creation (táta beze změny).
- Sandbox karet zůstává na `/design-v2` (jen statické příklady).
- API / security beze změny chování verdiktu.

## Odkazy pro zakladatele

- Spec karty: `docs/SIMPLE-RESULT-CARD.md`
- Feedback otázky: `docs/BETA-FEEDBACK-FORM.md` (otázka 6 = vzhled)

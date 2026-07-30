# ShadowGuard Shadvert — pojmenování verzí (mezi námi)

Tento dokument drží **pořádek v názvech**, ať víme, o čem mluvíme s AI i mezi sebou.

---

## First Creation (živé na produkci)

| | |
|--|--|
| **Interní jméno** | **First Creation** |
| **Kde běží** | Lenovo → `shadowguard-shadvert.site` |
| **Git** | větev `main` (+ tag `first-creation` až po drobných úpravách) |
| **Účel** | Původní hotová app pro tátu + „kapesní propagační balíček“ / inspirace |
| **Vizuál** | **Zamčený** — neměnit layout ani chování default cesty bez vědomého rozhodnutí |
| **Co smí** | Security hotfixy, drobné bugfixy, **volitelná** lab tlačítka dole (vzorkovnice, dotazník) která nemění hlavní tok pro tátu |
| **Co nesmí** | Tiché redesigny, přepínání default tématu, mazání funkcí tátovi bez opt-in |
| **Osud** | Až přijde nová generace, First Creation jde na **cestnou výstavku** (archiv / demo), nová verze nahradí live |

> First Creation není „špatná stará verze“.  
> Je to **základní kámen** — někoho chytne vzhled, jiného jednoduchost, jiného co umí.  
> Není to primární marketing Shadvertu, ale **inspirace a důkaz**, že to vzniklo z reálné péče.

### Proč First Creation vznikla (a proč ji nikdy nesmažeme)

Vznikla z **reálné péče o tátu** — funkční app na kontrole inzerátů a odkazů, ne z pitch decku.  
Na ní jsme se naučili: že default pro člověka se nesmí tiše přepisovat; že lab může sbírat názory bez trackingu; že security a důvěra jdou před „hezčí redesign“.  
Až přijde nová generace, First Creation nepůjde do koše, ale do **Origin Gallery** (čestná galerie) — archiv, demo, show-and-tell: *tady to všechno začalo.*  
Viz Foundation **SGF-012 Evolution Principles** a rozhodnutí **D-019 / D-020**.

| Dřívější termín | Oficiálně |
|-----------------|-----------|
| „cestná / čestná výstavka“ | **Origin Gallery** (EN) · **čestná galerie** (CZ) |

---

## Další linie (vývoj)

| Jméno | Git větev (návrh) | Účel |
|-------|-------------------|------|
| **Design v2** | `ui/design-v2` | Calm Security, světlá klidná zelená, režim Jednoduchý (SGF-007) |
| **Craft / features** | `feature/*` | Nové funkce po design shodě |
| **Stabilní produkce** | `main` = First Creation dokud neřekneme jinak | Live pro tátu |

Křížovatka: všechny větší změny nejdřív na větvi → review → teprve rozhodnutí o nasazení na First Creation **nebo** o přechodu na novou generaci.

---

## Pravidlo pro tátu

**Tátovi se po aktualizaci nesmí „překopat“ obrazovka.**  
Nové věci: schované, opt-in, nebo jen v lab zóně dole (vzorkovnice / dotazník).

---

## Lab na First Creation (současná live)

Dole v patičce:

1. **Vzorkovnice barev** — 10–15 mini náhledů (včetně nečekaných), jen inspirace, **neaplikuje se automaticky na celou app**.  
2. **Krátký dotazník** — 5–10 otázek, uložení lokálně / export JSON pro zakladatele.

---

## Časová osa (2026-07 / 08)

| Kdy | Co |
|-----|-----|
| Live teď | First Creation + lab — stabilní pro instalaci tátovi |
| Příští týden | Instalace tátovi (CR); zakladatel DE |
| + cca týden | Start sběru dat (lab + reálné použití) |
| Paralelně | Vývoj **pouze** na `ui/design-v2` — viz `docs/DESIGN-V2-BRIEF.md` (na té větvi) |
| Později | Nasazení nové generace tátovi jen po rozhodnutí v Book of Decisions |

---

*Aktualizováno 2026-07-30 — Grok Build + zakladatel*

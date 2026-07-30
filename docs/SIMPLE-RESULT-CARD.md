# Výsledková karta — režim Jednoduchý (ui/design-v2)

**Stav:** podklad připravený (ChatGPT + Grok Build)  
**Větev:** `ui/design-v2`  
**Live First Creation:** beze změny  
**Navazuje na:** `docs/DESIGN-V2-BRIEF.md`, SGF-007, SGF-012

---

## Proč je to nejdůležitější

V režimu Jednoduchý je výsledková karta **jediná věc, která musí být srozumitelná na první pohled** (včetně člověka 70+).  
Vstupní obrazovka a Rozšířený režim přijdou později — struktura karty se **nesmí** lišit mezi stavy.

---

## Společná struktura (všechny stavy)

```
1. StatusBadge          — velký badge + ikona + krátký název stavu
2. MainVerdict          — největší text na stránce (hlavní věta)
3. ReasonList           — 2–4 body „Proč“
4. ActionAdvice         — 1–2 věty „Co teď“
5. ShowMoreButton       — „Zobrazit více podrobností“ → Rozšířený
```

**Nic jiného na první obrazovce výsledku.**

| Stav API (`safetyLevel`) | UI stav | Badge barva |
|--------------------------|---------|-------------|
| `DUVERYHODNE` | Důvěryhodné | Klidná zelená |
| `OPATRNOSTI` | Opatrnost | Jantar / teplá oranžová |
| `PODVOD` | Podvod | Klidná červená (ne neon, ne glow) |

---

## 1. Důvěryhodné

| Prvek | Obsah (vzor) |
|-------|----------------|
| Badge | Zelený štít / fajfka + **Důvěryhodné** |
| Hlavní věta | „Tento inzerát vypadá v pořádku.“ |
| Proč | • Doména působí důvěryhodně · • Nenašli jsme podezřelé odkazy · • Nejde o známý podvodný vzor |
| Rada | „Můžete pokračovat. I tak doporučujeme osobní předání, pokud je to možné.“ |
| Akce | Zobrazit více podrobností |

---

## 2. Opatrnost

| Prvek | Obsah (vzor) |
|-------|----------------|
| Badge | Jantarový štít + **Opatrnost** |
| Hlavní věta | „Buďte opatrní.“ |
| Proč | • Některé údaje chybí nebo působí nejasně · • Cena je výrazně výhodnější než obvykle · • Doména je relativně nová |
| Rada | „Neposílejte peníze předem. Trvejte na osobním předání nebo ověřené platbě.“ |
| Akce | Zobrazit více podrobností |

---

## 3. Podvod

| Prvek | Obsah (vzor) |
|-------|----------------|
| Badge | Klidná červená + **Podvod** |
| Hlavní věta | „Toto vypadá jako podvod.“ |
| Proč | • Jde o známý podvodný vzor · • Odkaz vede na podezřelou doménu · • Požaduje údaje o kartě nebo platbu předem |
| Rada | „Na odkaz neklikajte a nic neplaťte. Pokud už jste něco zadali, kontaktujte banku.“ |
| Akce | Zobrazit více podrobností |

---

## Pravidla textů

1. Srozumitelné člověku **70+**.  
2. **Žádný** technický žargon (SSL, WHOIS, trust score…).  
3. Krátké věty.  
4. Rada vždy říká **co udělat**, ne jen co je špatně.  
5. Červená u Podvodu: klidná, čitelná — **žádný glow, žádné blikání**.  
6. Barvy a formulace doladit podle Vzorkovnice / dotazníku, až budou data.

---

## Komponenty (kód)

```
src/design-v2/
  simpleResultTypes.ts     — view-model
  mapSimpleResult.ts       — AdCheckResult → view-model
  SimpleResultCard.tsx     — jedna karta, tři stavy = data
  DesignV2Sandbox.tsx      — náhled /design-v2 (jen tato větev)
  tokens.ts                — světlá klidná zelená + stavy
```

```
SimpleResultCard
├── StatusBadge
├── MainVerdict
├── ReasonList
├── ActionAdvice
└── ShowMoreButton
```

Mapování ze stávajícího API:

| View-model | Zdroj z `AdCheckResult` |
|------------|-------------------------|
| status | `safetyLevel` |
| mainVerdict | `headline` (fallback: šablona podle stavu) |
| reasons | `riskFactors` / `positiveFactors` (max 4, lidské title) |
| advice | `actionAdvice` joined / `summaryForSenior` fallback |

---

## Náhled

Na větvi `ui/design-v2` (ne na live):

- cesta **`/design-v2`** — tři ukázkové karty + živé mapování mock dat  
- **ne** nasazovat na Lenovo, dokud nebude rozhodnutí

---

## Review (Gemini + Grok) — 2026-07-30

| Zdroj | Verdikt |
|-------|---------|
| **Gemini** | Směr SGF-007 v praxi; hierarchie a lidskost OK |
| **Grok** | Použitelný základ; doladit kontrast varování, vzduch, hierarchii akcí |

### Zapracováno (polish v1)

- [x] Silnější klidná saturace badge **Opatrnost** / **Podvod**  
- [x] Hlavní věta u Podvodu s vyšší váhou písma  
- [x] Blok **Co teď** u Podvodu výraznější (okraj + inset akcent)  
- [x] „Zkontrolovat jiný inzerát“ o stupeň tišší než primární tlačítko  
- [x] Víc vzduchu mezi sekcemi (gap ~24–28px)

### Volitelně později

- [ ] Konkrétní úpravy textů podle labu  
- [ ] Kontrola na starším Androidu / slabším displeji  

---

## Co ještě není (další iterace)

- [ ] Vstupní obrazovka Jednoduchý (jedno pole + Ověřit)  
- [ ] Skutečné napojení do `App.tsx` default cesty  
- [ ] Rozšířený / Analýza obsah  
- [ ] Tmavý režim opt-in  
- [ ] Doladění textů z labu  

---

*ChatGPT podklad + Grok Build kostra + polish dle Grok/Gemini review, 2026-07-30*

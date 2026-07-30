# Zadání: ui/design-v2 — Režim Jednoduchý podle SGF-007

**Větev:** `ui/design-v2`  
**Cíl:** Připravit nový výchozí vzhled a chování režimu **Jednoduchý**, aniž by se cokoli měnilo na live verzi pro tátu.  
**Stav live:** beze změny (vizuální freeze First Creation).  
**Zdroj:** Grok (web) + shoda Gemini + SGF-007; uloženo Grok Build 2026-07-30.

---

## 0. Časový kontext (zakladatel)

- Instalace First Creation tátovi: **příští týden** (táta ČR, zakladatel DE).
- Poté **sběr dat** (lab + reálné použití) — trvá chvíli.
- Tato větev smí vznikat **paralelně**; nasazení tátovi **až po** rozhodnutí v Book of Decisions a po vyhodnocení labu, ne dřív.

---

## 1. Základní pravidla

- Live (`main` / produkce na Lenovo) se **nemění**.
- Veškerá práce probíhá výhradně ve větvi `ui/design-v2`.
- Nový vzhled se tátovi nenasazuje, dokud nebude explicitní rozhodnutí v Book of Decisions.
- Režim **Jednoduchý** je výchozí.

---

## 2. Vizuální směr (schválený hybrid)

| Prvek | Rozhodnutí |
|-------|------------|
| Výchozí téma | **Světlá klidná zelená** |
| Tmavý režim | Pouze volitelný (Nastavení) |
| Zlatá / hood logo | Jen splash, about, Initiative — ne v běžném UI |
| Akcent důvěry | Klidná desaturovaná zelená |
| Text | Tmavý charcoal, velký, vysoký kontrast |
| Styly | Měkké karty, jasně oddělené plochy, žádný neon, žádný glow |

---

## 3. Co má obsahovat režim Jednoduchý

### A. Vstupní obrazovka

- Jedno velké pole pro odkaz / text
- Možnost vložit foto (ponechat)
- Jedno výrazné tlačítko **„Ověřit“**
- Krátká nápověda „Jak vložit inzerát“ (rozbalovací nebo modal)
- Žádný sidebar, žádné widgety, žádné kvízy, žádné grahy

### B. Výsledková karta (nejdůležitější část)

Stejná hierarchie pro všechny tři stavy:

1. **Semafor + krátký verdikt** (velký)
2. **Jedna silná věta** v lidské češtině
3. **2–4 body „Proč“**
4. **Jasná rada „Co teď udělat“**
5. Odkaz/tlačítko **„Zobrazit více podrobností“** → přepne do Rozšířeného režimu

#### Stavy (musí mít stejnou strukturu)

| Stav | Barva | Příklad verdiktu |
|------|-------|------------------|
| Důvěryhodné | Klidná zelená | „Tento inzerát vypadá v pořádku.“ |
| Opatrnost | Jantarová / teplá oranžová | „Buďte opatrní.“ |
| Podvod | Klidná červená (ne neon, ne glow) | „Toto vypadá jako podvod.“ |

### C. Co v Jednoduchém režimu **není**

- Trust score jako číslo
- SSL/WHOIS detaily
- Price comparison
- Energy aura / animace
- Scam quiz
- Hlasové příkazy (mohou zůstat schované)
- Sidebar s mnoha položkami
- Jakékoli technické údaje

---

## 4. Mapování ostatních funkcí

| Funkce | Kam patří |
|--------|-----------|
| Historie kontrol | Rozšířený |
| Scam alerts | Rozšířený (zjednodušeně) |
| Alternativní e-shopy | Rozšířený |
| Odeslat synovi | Rozšířený |
| SSL / doména detaily | Analýza |
| Trust score číslo | Analýza |
| Admin panel / family devices | Jen syn / admin |
| Tmavý vzhled | Nastavení (opt-in) |
| Velikost písma | Nastavení |

---

## 5. Technické poznámky

- Zachovat stávající logiku detekce a API.
- Měnit primárně frontend (komponenty + styly + podmíněné renderování podle režimu).
- Režim ukládat do `localStorage` (výchozí = `jednoduchy`).
- Při prvním spuštění **neptat se** na výběr režimu — rovnou Jednoduchý.

---

## 6. Akceptační kritéria

- [ ] V režimu Jednoduchý je na první pohled jasný výsledek i pro člověka 70+
- [ ] Všechny tři stavy (Důvěryhodné / Opatrnost / Podvod) mají stejnou hierarchii
- [ ] Kontrast textu a ploch je dostatečný i při horším zraku
- [ ] Žádné technické údaje a žádné zbytečné widgety v defaultu
- [ ] Live verze zůstává beze změny
- [ ] Tmavý režim funguje jako přepínač, ne jako výchozí stav

---

## 7. Reference

- SGF-007 Design Principles
- Vizuální rozhodnutí z 2026-07-30 (světlá klidná zelená)
- `AI_komunikace/grok-build-mezi-nami/2026-07-30_vizual-navrhy-nazor.md`
- First Creation: `docs/VERSIONS.md`, D-019

---

## 8. Vstup z labu (po sběru)

Až budou hlasy ze Vzorkovnice a JSON z dotazníku, doladit:

- preferovanou paletu (default světlá zelená zůstává výchozí návrh, dokud data neřeknou jinak),
- jestli „moc věcí na homepage“ potvrzuje skrytí widgetů,
- preferenci tmavého režimu (opt-in vs. vůbec).

---

*Oficiální zadání větve — Grok + zakladatel; souhlas Gemini 2026-07-30*

# ShadowGuard Shadvert — Master layout foundation (neměnná pravidla)

**Status:** návrh k odsouhlasení (po schválení → dokumentace Initiative)  
**Účel:** pevný základ, který se nerozhází při přidání/odebrání prvků  
**Platí pro:** telefon, tablet, monitor, TV  
**Jazyk UI:** čeština s diakritikou  

---

## 1. Cíl

Na všech zařízeních musí úvodní stránka působit **stejným stylem a stejnou skládankou**, aby uživatel (včetně seniorů) nemusel zjišťovat, „proč to vypadá jinak“.  
Liší se jen **rozměry, typografie a rozložení** podle šířky displeje — ne hierarchie ani význam prvků.

---

## 2. Above-the-fold lock (povinné, neměnné)

Bez scrollování musí být vždy vidět **pouze** tato skládanka shora dolů:

1. **Header**
   - Název: ShadowGuard (+ Shadvert dle stávajícího brandu)
   - Režimy: **Stručný** | **Detailní**
   - **Hlasové ovládání**
   - **Nastavení**
   - Stav **Připojeno** (indikátor připojení)
2. **Okno pro zadání inzerátu** (URL / text / fotka — stávající 3 kroky uvnitř jednoho bloku)
3. **Zlaté primární CTA** „Prověřit důvěryhodnost inzerátu“ (nebo ekvivalent se stejnou funkcí) jako **poslední viditelná věc nad foldem**

### Zakázáno nad foldem

- Ukázkové inzeráty  
- Rodinné propojení / admin  
- Marketingové sekce, návody delší než krátká nápověda uvnitř vstupního okna  
- Splash, který překrývá CTA  
- Jakýkoli obsah, kvůli kterému by uživatel musel scrollovat, aby spustil kontrolu  

### Kontrola na 3–4 stisky

Typický happy path bez scrollu: vložení vstupu → (volitelně režim) → **Prověřit**.

Veškerý ostatní obsah smí být **až pod foldem** (pro ty, kdo chtějí).

---

## 3. Synchronizace vzhledu (stejný styl)

| Prvek | Neměnné | Smí se měnit dle zařízení |
|--------|---------|---------------------------|
| Pořadí bloků | Header → vstup → CTA | ne |
| Význam CTA | spouští kontrolu | label text jen se schválením copy |
| Barva CTA | zlatá / brand gold | přesný hex dle tokenů |
| Header ovládání | 4 akce + Připojeno | wrap / velikost / řady |
| Vstupní blok | jeden kontejner | vnitřní stack vs. side-by-side |
| Trust Contract | viz §5 | ne |

---

## 4. Breakpointy (šablony)

| ID | Zařízení | Šířka (orientační) | Layout vstupů | Priorita prostoru |
|----|----------|--------------------|---------------|-------------------|
| PHONE | telefon portrait | &lt; 768px | **1 sloupec** (nad sebou) | výška |
| TABLET | tablet | 768–1024px | 1 sloupec, víc vzduchu | vyváženě |
| MONITOR | monitor / notebook | 1025–1919px | **více vedle sebe** | šířka |
| TV | TV / velké displeje | ≥ 1920px | jako monitor, méně hustoty | velikost typografie |

Detailní rozměry: soubory `01`–`04` v této sadě.

---

## 5. Trust Contract (výsledková karta — navázáno)

I když tento dokument řeší **úvod**, nové prvky nesmí rozbít:

- `safetyLevel` ∈ `DUVERYHODNE` | `OPATRNOSTI` | `PODVOD` řídí **barvu + label + vysvětlující větu**
- `trustScore` jen **číslo u stejné úrovně** — nikdy nenahrazuje `safetyLevel`
- Labely: **Důvěryhodné** / **Opatrnost** / **Podvod** (s diakritikou)
- `riskFactors` jen rizika (ne marketingové zelené fajfky)

---

## 6. Přístupnost (senioři)

- Základní text min. **18px** (PHONE+), labely **20–22px+**
- Primární CTA min. výška **48px**, na TV více
- Kontrast textu vůči pozadí dostatečný (tmavé UI + světlý text / zlaté CTA)
- Touch mezery ≥ **12px**
- Žádné „drobné placeholdery“ jako jediný návod

---

## 7. Co smí Grok Build / vývoj měnit bez nového schválení layoutu

- Fine-tuning px v rámci šablony zařízení  
- Opravy bugů, které neporušují §2 a §5  

## Co vyžaduje nové schválení

- Přidání prvku **nad fold**  
- Změna pořadí header → vstup → CTA  
- Nový breakpoint mimo tabulku §4  
- Změna Trust Contract labelů/barev  

---

## 8. Schvalovací tok

1. Design (Troy) dodá / aktualizuje tuto sadu dokumentů  
2. Implementace (Grok Build) podle šablon  
3. Kontrola: Grogu (viewport + API baseline), Shadow (čitelnost + labely/FAQ)  
4. User OK → dokumenty do dokumentace ShadowGuard Initiative (neměnné základy)

---

## 9. Související soubory

- `01-PHONE-layout.md`  
- `02-TABLET-layout.md`  
- `03-MONITOR-layout.md`  
- `04-TV-layout.md`  

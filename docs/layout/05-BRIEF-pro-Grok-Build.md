# BRIEF pro Grok Build — ShadowGuard Shadvert live (layout only)

## Úkol
Uprav **live** úvodní stránku Shadvert tak, aby na telefonu / tabletu / monitoru / TV vypadala **stejným stylem a stejnou skládankou**.  
Povoleny jen úpravy rozměrů, fontů, rámečků, ikon a pozic dle breakpointů.  
**Nemeň** API, verdikty, Trust Contract, ani nepřidávej nový vizuální redesign (dark/gold landing).

## Above-the-fold lock (povinné na všech zařízeních)
Bez scrollu musí být vidět **jen**:
1. Header: název + **Stručný** / **Detailní** + **Hlasové ovládání** + **Nastavení** + **Připojeno**
2. Jedno okno pro zadání inzerátu (stávající kroky uvnitř)
3. Zlaté tlačítko **Prověřit důvěryhodnost inzerátu** jako poslední viditelná věc

Vše ostatní (ukázky, rodina, …) **až pod foldem**.  
Kontrola = max 3–4 stisky, bez nutnosti scrollovat.

## Breakpointy
| | šířka | layout |
|--|-------|--------|
| PHONE | &lt; 768px | 1 sloupec (stack). **Vizuální měřítko = tablet** — stejná čitelnost, ne zmenšený desktop. Fonty ≥ 18/20px, CTA ≥ 48px full-width |
| TABLET | 768–1024px | stejná skládanka, víc vzduchu, header 1–2 řady |
| MONITOR | 1025–1919px | víc do stran (quick akce smí vedle vstupu), CTA dole na šířku karty |
| TV | ≥ 1920px | jako monitor, větší typografie, CTA ≥ 64px, méně hustoty |

## Nesmí
- Desktop layout zmenšený do telefonu
- Splash přes CTA
- Nové prvky nad foldem
- Měnit `safetyLevel` mapování (Důvěryhodné / Opatrnost / Podvod)

## Zdroj pravdy
Přiložené dokumenty:
- `00-MASTER-layout-foundation.md`
- `01-PHONE-layout.md`
- `02-TABLET-layout.md`
- `03-MONITOR-layout.md`
- `04-TV-layout.md`

Dodrž je jako specifikaci. Po nasazení ověří tým (Grogu viewport+API, Shadow čitelnost/labely).

# Closed beta — tester balíček

**Stav:** připraveno k odeslání po smoke PASSED  
**Cíl:** táta + 5–10 známých lidí (ne veřejně)  
**Odkaz app:** https://shadowguard-shadvert.site  
**Feedback:** viz `docs/BETA-FEEDBACK-FORM.md` (`FEEDBACK_FORM_URL=`)

---

## 1. WhatsApp / SMS (zkopíruj a doplň)

```
Ahoj,
připravil jsem malou rodinnou aplikaci, která pomáhá kontrolovat podezřelé inzeráty a odkazy.
Jmenuje se ShadowGuard Shadvert.

Není to žádná hra ani reklama. Chci vědět, jestli je to opravdu srozumitelné a jestli se díky ní cítíš na internetu o něco jistěji.

Odkaz: https://shadowguard-shadvert.site
(nainstaluj si ji na plochu – funguje jako normální aplikace)

Rodinný kód (pro synchronizaci historie, pokud chceš): [TVŮJ_FAMILY_CODE]

Až to vyzkoušíš (stačí 2–3 kontroly), prosím vyplň krátký formulář (8 otázek):
[ODKAZ_NA_GOOGLE_FORM]

Díky moc.
```

**Poznámka pro zakladatele:** `[TVŮJ_FAMILY_CODE]` ber z Lenovo `.env.local` — **nikdy** do gitu ani veřejného chatu s neznámými.

---

## 2. Jak nainstalovat (pro tátu)

### Android (Chrome)

1. Otevři odkaz v **Chrome**.  
2. Tři tečky vpravo nahoře → **Přidat na plochu** / **Instalovat aplikaci**.  
3. Hotovo — ikona na ploše.

### iPhone (Safari)

1. Otevři odkaz v **Safari** (ne v Chrome).  
2. Tlačítko **Sdílet** (čtvereček se šipkou) → **Přidat na plochu**.  
3. Hlas na iPhonu často nefunguje — to je v pořádku; stačí psát, vkládat odkaz nebo fotit.

---

## 3. Co má tester udělat (minimum)

1. Otevřít aplikaci.  
2. Vložit **2–3** různé věci:
   - jeden **normální** odkaz (známý e-shop / seznam.cz),
   - jeden **podezřelý** text (např. „kurýr chce číslo karty“),
   - volitelně vlastní reálnou zprávu, kterou dostal.  
3. Podívat se na výsledek (co to říká a **proč**).  
4. Vyplnit formulář (8 otázek).

**Volitelně (pokud chceš srovnat vzhled):**  
Jednoduchý režim: https://shadowguard-shadvert.site/?mode=simple  
(není výchozí — jen pro ty, kdo chtějí zkusit klidnější obrazovku)

---

## 4. Co NEdělat v closed betě

- Nedávat odkaz **veřejně** (Facebook, skupiny, fóra).  
- Neposílat najednou víc než **~10** lidí.  
- Neptat se testerů na technické detaily (to řešíš ty z logů a lab exportu).  
- **Nezapínat** default Jednoduchý režim — zůstává pod flag (D-019 First Creation freeze).

---

## 5. Pro zakladatele (checklist)

1. Smoke live: `BASE_URL=https://shadowguard-shadvert.site npm run smoke` → PASSED.  
2. Vytvoř Google Form z `docs/BETA-FEEDBACK-FORM.md` (copy-paste sekce).  
3. Odpovědi ukládej do Google Sheet.  
4. Doplň `FEEDBACK_FORM_URL=` do `BETA-FEEDBACK-FORM.md` a commit.  
5. Pošli balíček **tátovi + 2–3** nejbližším (ne hned plných 10).  
6. Po 5–7 odpovědích: otázky 1, 2, 5, 8 → shrnutí do Chronicle + případně Book of Decisions.  
7. V `/admin` po deployi volitelně **Force update** (PWA na tabletu).

---

## 6. Pořadí Trust Sprint (připomínka)

Deploy + smoke → tester balíček → táta → feedback → teprve pak Design v2 / Founding Edition.

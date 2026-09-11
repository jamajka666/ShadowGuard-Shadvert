# ShadowGuard Shadvert — Šablona TABLET

**Breakpoint:** 768px–1024px  
**Princip:** stejná skládanka jako telefon, **více vzduchu**, header častěji v jedné až dvou řadách  
**Master:** `00-MASTER-layout-foundation.md`

---

## Above-the-fold

```
┌──────────────────────────────────────────┐
│ [Logo Název]  Stručný Detailní  Hlas Nast. [Připojeno] │
├──────────────────────────────────────────┤
│                                          │
│        Okno: zadání inzerátu             │
│        (kroky pod sebou, širší pole)     │
│                                          │
├──────────────────────────────────────────┤
│      ████████ PROVĚŘIT… ████████         │
└──────────────────────────────────────────┘
```

---

## Header

- Preferovat **jednu řadu**, pokud se vejdou touch targety ≥ 44px  
- Pokud ne: název + Připojeno nahoře; ovládání druhá řada  
- Stejné prvky jako PHONE — žádný nový prvek nad foldem  

---

## Okno inzerátu

- Max. šířka karty cca 720–900px, **centrovaná**  
- Kroky stále pod sebou (stabilita vs. telefon)  
- Větší padding (16–24px)  
- Volitelně quick akce vpravo **uvnitř** karty jen pokud CTA zůstane viditelné bez scrollu; jinak pod sebou  

---

## CTA

- Šířka karty (ne nutně edge-to-edge obrazovky)  
- Min. výška **52px**  
- Poslední viditelný prvek foldu  

---

## Typografie

| Role | Min. |
|------|------|
| Body | 18–20px |
| Label | 20–22px |
| Název | 22–24px |
| CTA | 20px |

---

## Kontrola po nasazení

- [ ] Stejná hierarchie jako telefon  
- [ ] Žádný „pár obřích prvků + prázdno“ bez CTA na foldu  
- [ ] Pod foldem zbytek obsahu  

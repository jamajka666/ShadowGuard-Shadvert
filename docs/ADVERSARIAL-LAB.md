# ShadowGuard Adversarial Lab (Shadvert)

**Canonical:** Initiative Working `SGW-009-Adversarial-Security-Review.md`  
**Baseline code:** `main` @ Truth Contract merge (`79ab6ff`+)  
**Status:** Lab open — **not** feature development

## Question we ask now

> How do we force the system to say something untrue — or claim more than evidence allows?

Not: “Does the happy path work?”

## Already proven (regression — do not weaken)

| Attack | Expected | Tests |
|--------|----------|--------|
| Cheap TLD alone → PODVOD | OPATRNOSTI / signal only | truthContract |
| Official host alone → DUVERYHODNE | OPATRNOSTI | truthContract |
| Educational courier article → PODVOD | not PODVOD | truthContract |
| AI invent IČO / softens PODVOD | reject | truthContract |
| Phishing match Why status | NALEZENO + “Nalezena shoda” | truthContract |
| Invalid TLS Why status | NALEZENO not SELHALO | truthContract |
| Orphan evidence | none | assertNoOrphanEvidence |

## Next lab rounds (see SGW-009 matrix)

Priority UNKNOWN → tests:

1. Homoglyph / punycode / `brand.evil.tld`  
2. Redirect chain (input vs final host)  
3. AI injection corpus (live Gemini optional / deferred)  
4. Signal stacking → overclaim PODVOD  
5. Verdict cache stale after rules change  

## Six questions per attack

1. What was manipulated?  
2. Which layer should catch it?  
3. What evidence exists?  
4. What if that evidence is missing?  
5. Could the attacker force a **stronger** claim?  
6. If yes — why?

## Rule

Do **not** add 500 heuristics. Prefer honest NEVÍME / OPATRNOSTI over false certainty.

# ShadowGuard Truth Contract (Shadvert mirror)

**Canonical Working doc:** `ShadowGuard-Initiative/Working/SGW-008-Truth-Contract.md`  
**Decision:** D-022 (2026-08-08)  
**Version:** 1.0

This file is the **implementation reference** inside the Shadvert repository.  
If text diverges, **SGW-008 in Initiative wins**.

---

## Axiom

Do not assert as fact anything without a verified source, measurable evidence, or a transparent calculation from facts.

Guarantee: **100% claim traceability** relative to listed evidence — not absolute truth about the external world.

## Layers

1. **FACTS** — DNS, TLS, RDAP, phishing DB, exact host match  
2. **ANALYSIS** — Rule Engine (`src/trust/ruleEngine.ts`) owns `safetyLevel` + `trustScore`  
3. **AI** — Gemini explains only (`src/trust/aiPresentation.ts`); never invents verdict  

## Kill switch

`src/trust/aiOutputValidator.ts` — on FAIL, user sees hybrid/template text (`verdictSource: ai_rejected`), never the invalid AI claims.

## Forbidden categories

- LIKELY_AUTHENTIC  
- VERIFIED_SAFE  
- confidence as substitute for evidence  

Use: `VERIFIED | UNVERIFIED`, `NO_VERIFIED_THREAT_FOUND`, internal `NEVIME` → UI `OPATRNOSTI`.

## Code map

| Module | Role |
|--------|------|
| `src/trust/truthContract.ts` | enums, banlist, official hosts |
| `src/trust/facts.ts` | Layer 1 FACT bundle |
| `src/trust/ruleEngine.ts` | Layer 2 decision |
| `src/trust/aiPresentation.ts` | prompts |
| `src/trust/aiOutputValidator.ts` | reject |
| `src/trust/mergeResult.ts` | API response merge |
| `server.ts` | wire analyze-ad + scam-alerts + family lockout |

## UI note

Trust score = **internal score by our rules**, not “% safe”.

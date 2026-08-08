# FAMILY authorization design (per-device)

**Status:** design only (partial interim hardening in code)  
**Finding:** FAM-001 (Audit 2)  
**Decision context:** D-021 (full enrollment outside Trust Sprint) · D-022 (design + lockout now)

---

## Problem

Today:

```
FAMILY_CODE (one shared secret)
        ↓
"you may write family history / heartbeat / exports"
```

Anyone with the code can register devices and inject history. No per-device revoke, no scope, hard to rotate.

## Target model

```
Family
 ├── Family identity (logical)
 ├── FAMILY_CODE = bootstrap / pairing only (short-lived or rate-limited)
 ├── Device A → deviceId + device credential (long-lived, revocable)
 ├── Device B → …
 └── Admin can revoke one device without rotating whole family
```

### Pairing flow (proposed)

1. Admin/parent generates or knows `FAMILY_CODE`.  
2. New device posts `POST /api/family/pair` with code + label → server returns `deviceToken` (random, high entropy).  
3. Device stores `deviceToken` (not only the family code).  
4. Heartbeat/history/export send `Authorization: Bearer <deviceToken>` or `deviceToken` field.  
5. Admin lists devices; `POST /api/family/revoke` invalidates one token.  
6. Optional: rotate `FAMILY_CODE` without killing already-paired devices.

### Storage

- Server: `data/family.json` extended with `devices[deviceId].tokenHash` (hash only).  
- Client: prefer non-extractable storage where possible; still better isolation than one shared code.

## Interim hardening (implemented 2026-08-08)

- Stricter rate limit on family **write** endpoints.  
- In-memory fail counter + temporary lockout per IP after repeated invalid codes.  
- **Does not** fix single-secret model — only reduces brute-force.

## Non-goals for first enrollment PR

- OAuth / third-party IdP  
- End-to-end encrypted family history  
- HttpOnly cookie for admin (separate P1)

## Acceptance criteria (future PR)

- [ ] Pairing issues unique device credential  
- [ ] Write endpoints reject bare FAMILY_CODE after grace period (or accept code only on `/pair`)  
- [ ] Revoke works without breaking other devices  
- [ ] Docs for parent (how to add tablet / remove lost phone)  
- [ ] Tests: wrong token 403; revoked token 403; rate-limit  

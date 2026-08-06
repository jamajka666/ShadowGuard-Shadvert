#!/usr/bin/env python3
"""
ShadowGuard / Shadvert — denní/týdenní report z family.json na Lenovo PC.

Běží lokálně na serveru (systemd timer / cron), ne přes veřejné API.
Odesílá e-mail jen pokud je v .env.local nastaveno SMTP (Gmail App Password).
Bez SMTP jen uloží report do data/reports/ a skončí 0 (dry log).

Usage:
  python3 scripts/daily-stats-report.py
  python3 scripts/daily-stats-report.py --dry-run
  python3 scripts/daily-stats-report.py --days 7
"""

from __future__ import annotations

import argparse
import json
import os
import smtplib
import ssl
import sys
from collections import Counter
from datetime import datetime, timezone, timedelta
from email.message import EmailMessage
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FAMILY = ROOT / "data" / "family.json"
DEFAULT_ENV = ROOT / ".env.local"
REPORTS_DIR = ROOT / "data" / "reports"
DEFAULT_TO = "23jamajka666@gmail.com"


def load_dotenv(path: Path) -> dict[str, str]:
    """Minimal .env loader (KEY=value, optional quotes). Does not override existing env."""
    out: dict[str, str] = {}
    if not path.is_file():
        return out
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip()
        if (val.startswith('"') and val.endswith('"')) or (
            val.startswith("'") and val.endswith("'")
        ):
            val = val[1:-1]
        out[key] = val
        if key not in os.environ:
            os.environ[key] = val
    return out


def env(key: str, default: str = "") -> str:
    return (os.environ.get(key) or default).strip()


def load_family(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {"devices": {}, "history": []}
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        return {"devices": {}, "history": []}
    data.setdefault("devices", {})
    data.setdefault("history", [])
    return data


def is_proven_scam(item: dict[str, Any]) -> bool:
    if str(item.get("safetyLevel") or "") != "PODVOD":
        return False
    if item.get("verdictSource") == "phishing_kill":
        return True
    try:
        return float(item.get("trustScore", 100)) <= 10
    except (TypeError, ValueError):
        return False


def ms_to_iso(ms: Any) -> str:
    try:
        t = int(ms)
        if t > 1_000_000_000_000:  # ms
            t = t / 1000.0
        return datetime.fromtimestamp(t, tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    except (TypeError, ValueError, OSError):
        return "?"


def filter_history(history: list[dict[str, Any]], days: int | None) -> list[dict[str, Any]]:
    if not days or days <= 0:
        return list(history)
    cutoff = datetime.now(tz=timezone.utc) - timedelta(days=days)
    cutoff_ms = cutoff.timestamp() * 1000
    out = []
    for h in history:
        ts = h.get("timestamp") or h.get("receivedAt") or 0
        try:
            t = float(ts)
            if t < 1_000_000_000_000:
                t *= 1000
            if t >= cutoff_ms:
                out.append(h)
        except (TypeError, ValueError):
            continue
    return out


def build_report(
    db: dict[str, Any],
    *,
    days: int | None,
    host_label: str,
) -> str:
    devices = db.get("devices") or {}
    if not isinstance(devices, dict):
        devices = {}
    history_all = db.get("history") or []
    if not isinstance(history_all, list):
        history_all = []

    history = filter_history(history_all, days)
    levels = Counter(str(h.get("safetyLevel") or "?") for h in history)
    total = len(history)
    scam = levels.get("PODVOD", 0)
    caution = levels.get("OPATRNOSTI", 0)
    safe = levels.get("DUVERYHODNE", 0)
    proven = sum(1 for h in history if is_proven_scam(h))

    def pct(n: int) -> str:
        if total <= 0:
            return "0 %"
        return f"{round(n * 1000 / total) / 10} %"

    now = datetime.now(tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    window = f"posledních {days} dní" if days else "celá serverová historie (max ~100)"

    lines = [
        "ShadowGuard / Shadvert — automatický report (Lenovo PC)",
        f"Vygenerováno: {now}",
        f"Host: {host_label}",
        f"Okno: {window}",
        "",
        "=== Zařízení (rodinný sync) ===",
        f"Registrovaných zařízení: {len(devices)}",
    ]

    # Online-ish: lastSeen within 24h
    now_ms = datetime.now(tz=timezone.utc).timestamp() * 1000
    recent_dev = 0
    for d in devices.values():
        if not isinstance(d, dict):
            continue
        try:
            if now_ms - float(d.get("lastSeen") or 0) < 24 * 3600 * 1000:
                recent_dev += 1
        except (TypeError, ValueError):
            pass
    lines.append(f"Viděno za posledních 24 h: {recent_dev}")

    # Top labels
    labels = Counter(
        str((d.get("label") if isinstance(d, dict) else None) or "Zařízení")
        for d in devices.values()
    )
    if labels:
        lines.append("Popisky (top): " + ", ".join(f"{k}×{v}" for k, v in labels.most_common(8)))

    lines += [
        "",
        "=== Statistiky kontrol (sync historie) ===",
        f"Celkem záznamů v okně: {total}",
        f"Důvěryhodné: {safe} ({pct(safe)})",
        f"Opatrnost: {caution} ({pct(caution)})",
        f"Podvod (PODVOD): {scam} ({pct(scam)})",
        f"Vysoká jistota podvodu (trust≤10 / phishing_kill): {proven} ({pct(proven)})",
        f"Celkem v DB (bez filtru): {len(history_all)}",
        "",
        "=== Databáze podvodů (výběr) ===",
    ]

    scams = [
        h
        for h in history
        if isinstance(h, dict) and str(h.get("safetyLevel") or "") == "PODVOD"
    ]
    scams.sort(key=lambda h: float(h.get("timestamp") or h.get("receivedAt") or 0), reverse=True)

    if not scams:
        lines.append("(žádný PODVOD v okně)")
    else:
        for i, h in enumerate(scams[:20], 1):
            when = ms_to_iso(h.get("timestamp") or h.get("receivedAt"))
            score = h.get("trustScore", "?")
            proven_flag = "ANO" if is_proven_scam(h) else "ne"
            headline = str(h.get("headline") or "")[:90]
            url = str(h.get("inputUrl") or "")[:80]
            dev = str(h.get("deviceLabel") or "")[:40]
            lines.append(
                f"{i}. [{when}] score={score} proven={proven_flag} · {dev}"
            )
            lines.append(f"   {headline}")
            if url:
                lines.append(f"   url: {url}")
        if len(scams) > 20:
            lines.append(f"… a dalších {len(scams) - 20} podvodů.")

    lines += [
        "",
        "Poznámky:",
        "- Data jen z family sync na tomto PC (ne jména testerů, ne FAMILY_CODE).",
        "- Report běží lokálně; veřejný server e-mail neposílá z API.",
        "- Ruční report z appky (mailto) je nezávislý kanál.",
        "",
    ]
    return "\n".join(lines)


def send_smtp(subject: str, body: str, to_addr: str) -> None:
    host = env("REPORT_SMTP_HOST", "smtp.gmail.com")
    port = int(env("REPORT_SMTP_PORT", "587") or "587")
    user = env("REPORT_SMTP_USER")
    password = env("REPORT_SMTP_PASS")
    from_addr = env("REPORT_SMTP_FROM") or user or to_addr

    if not user or not password:
        raise RuntimeError(
            "Chybí REPORT_SMTP_USER / REPORT_SMTP_PASS v .env.local "
            "(Gmail: App Password, ne běžné heslo)."
        )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_addr
    msg.set_content(body)

    context = ssl.create_default_context()
    with smtplib.SMTP(host, port, timeout=60) as smtp:
        smtp.ehlo()
        smtp.starttls(context=context)
        smtp.ehlo()
        smtp.login(user, password)
        smtp.send_message(msg)


def main() -> int:
    parser = argparse.ArgumentParser(description="Shadvert family stats report (Lenovo)")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Neodesílat e-mail, jen vypsat/uložit report",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=None,
        help="Filtr historie (dny). Default: REPORT_STATS_DAYS nebo 7",
    )
    parser.add_argument(
        "--family-db",
        type=Path,
        default=DEFAULT_FAMILY,
        help="Cesta k family.json",
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        default=DEFAULT_ENV,
        help="Cesta k .env.local",
    )
    args = parser.parse_args()

    load_dotenv(args.env_file)

    days = args.days
    if days is None:
        raw = env("REPORT_STATS_DAYS", "7")
        try:
            days = int(raw) if raw else 7
        except ValueError:
            days = 7
    if days == 0:
        days = None  # all history

    to_addr = env("REPORT_TO_EMAIL", DEFAULT_TO) or DEFAULT_TO
    host_label = env("REPORT_HOST_LABEL") or env("HOSTNAME") or "Lenovo"

    db = load_family(args.family_db)
    body = build_report(db, days=days, host_label=host_label)

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(tz=timezone.utc).strftime("%Y%m%d-%H%M%S")
    out_path = REPORTS_DIR / f"stats-report-{stamp}.txt"
    out_path.write_text(body, encoding="utf-8")
    # Keep last report pointer
    (REPORTS_DIR / "latest.txt").write_text(body, encoding="utf-8")

    history = db.get("history") or []
    n = len(history) if isinstance(history, list) else 0
    subject = (
        f"[Shadvert] Report · {n} v DB · okno {days or 'all'} dní · "
        f"{datetime.now(tz=timezone.utc).strftime('%Y-%m-%d')}"
    )

    print(f"Report uložen: {out_path}")
    print(f"Příjemce: {to_addr}")
    print("---")
    print(body[:2000] + ("…" if len(body) > 2000 else ""))

    force_send = env("REPORT_FORCE_SEND", "").lower() in ("1", "true", "yes")
    dry = args.dry_run or env("REPORT_DRY_RUN", "").lower() in ("1", "true", "yes")

    if dry and not force_send:
        print("\n[dry-run] E-mail neodeslán. Pro odeslání: nastav SMTP a spusť bez --dry-run.")
        return 0

    if not env("REPORT_SMTP_USER") or not env("REPORT_SMTP_PASS"):
        print(
            "\n[skip] SMTP není nastavené — report jen v souboru.\n"
            "Doplň do .env.local: REPORT_SMTP_USER, REPORT_SMTP_PASS "
            "(Gmail App Password), volitelně REPORT_TO_EMAIL.",
            file=sys.stderr,
        )
        return 0

    try:
        send_smtp(subject, body, to_addr)
        print(f"\nE-mail odeslán na {to_addr}")
        return 0
    except Exception as exc:  # noqa: BLE001 — log and fail for cron/systemd
        print(f"\nCHYBA odesílání e-mailu: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

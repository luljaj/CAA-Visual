from __future__ import annotations

import ast
import asyncio
import csv
from datetime import datetime, timezone
import io
import json
import os
import time
from typing import Any
from urllib.parse import quote, urlparse
from zoneinfo import ZoneInfo

import aiohttp
from dotenv import dotenv_values
from supabase import Client, create_client

from sample_archive import compute_totals, finalize_roster, get_sample_archive

APP_TIMEZONE = ZoneInfo("America/New_York")
SERVER_ICON = (
    "https://images-ext-1.discordapp.net/external/"
    "8zvqGh0uPdc05QkNHhjjb2Fk5mWJo9347j8ifJcT8k8/%3Fsize%3D256/"
    "https/cdn.discordapp.com/icons/938810131800543333/"
    "9cec5b222e8564fb73c3ca1f9c9944fd.png"
    "?format=webp&quality=lossless&width=512&height=512"
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SIBLING_BOT_ENV = os.path.join(os.path.dirname(BASE_DIR), "CAA-Bot", ".env")
LOCAL_ENV = os.path.join(BASE_DIR, ".env")


def parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None

    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, str):
        raw_value = value.strip()
        if not raw_value:
            return None
        if raw_value.endswith("Z"):
            raw_value = f"{raw_value[:-1]}+00:00"

        if "." in raw_value:
            prefix, suffix = raw_value.split(".", 1)
            timezone_suffix = ""
            microseconds = suffix

            for separator in ("+", "-"):
                offset_index = suffix.find(separator)
                if offset_index > 0:
                    microseconds = suffix[:offset_index]
                    timezone_suffix = suffix[offset_index:]
                    break

            microseconds = (microseconds + "000000")[:6]
            raw_value = f"{prefix}.{microseconds}{timezone_suffix}"

        try:
            parsed = datetime.fromisoformat(raw_value)
        except ValueError:
            return None
    else:
        return None

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=APP_TIMEZONE)

    return parsed.astimezone(APP_TIMEZONE)


def format_application_date(value: datetime | None) -> str:
    if value is None:
        return "N/A"
    return value.astimezone(APP_TIMEZONE).strftime("%Y-%m-%d %H:%M %Z")


def normalize_application_record(raw_record: Any) -> dict[str, Any] | None:
    if not raw_record:
        return None

    record = raw_record[0] if isinstance(raw_record, list) else raw_record
    if not record:
        return None

    if isinstance(record, dict):
        inviter_raw = record.get("inviter")
        if isinstance(inviter_raw, str):
            inviter_clean = inviter_raw.strip()
            if inviter_clean.casefold() in ("", "none", "null", "n/a"):
                inviter_raw = None
            else:
                inviter_raw = inviter_clean

        return {
            "roblox_username": record.get("roblox_username") or record.get("username"),
            "reason": record.get("reason"),
            "inviter": inviter_raw,
            "inviter_id": _as_str_id(record.get("inviter_id")),
            "created_at": parse_datetime(
                record.get("date")
                or record.get("submission_date")
                or record.get("created_at")
                or record.get("created")
                or record.get("raw_date")
            ),
        }

    values = list(record.values()) if hasattr(record, "values") else []
    return {
        "roblox_username": values[2] if len(values) > 2 else None,
        "reason": values[3] if len(values) > 3 else None,
        "inviter": values[4] if len(values) > 4 else None,
        "created_at": parse_datetime(values[5] if len(values) > 5 else None),
        "inviter_id": _as_str_id(values[6] if len(values) > 6 else None),
    }


def _as_str_id(value: Any) -> str | None:
    if value is None or value == "":
        return None
    text = str(value).strip()
    return text or None


def _as_int(value: Any, default: int = 0) -> int:
    if value is None or value == "":
        return default
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _parse_awards(value: Any) -> list[str]:
    if not value:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        raw = value.strip()
        if not raw or raw == "[]":
            return []
        for parser in (json.loads, ast.literal_eval):
            try:
                parsed = parser(raw)
                if isinstance(parsed, list):
                    return [str(item).strip() for item in parsed if str(item).strip()]
            except Exception:
                continue
        return [part.strip() for part in raw.split(",") if part.strip()]
    return []


def _infer_position_and_tier(
    *,
    explicit_position: str | None,
    reports: int,
    event_wins: int,
    awards_count: int,
) -> tuple[str, str]:
    if explicit_position:
        pos = explicit_position.strip()
        lower = pos.casefold()
        if any(k in lower for k in ("director", "founder", "executive", "advisor", "admin", "lead", "management", "manager")):
            return pos, "leadership"
        if "intern" in lower or "probation" in lower:
            return pos, "intern"
        return pos, "made"

    score = (reports * 8) + (event_wins * 120) + (awards_count * 150)
    if score >= 1800:
        return "Respected Employee", "made"
    if score >= 600:
        return "Senior Employee", "made"
    if reports >= 5 or event_wins >= 1 or awards_count >= 1:
        return "Employee", "made"
    return "Intern", "intern"


def _normalize_strike(
    raw_strike: dict[str, Any],
    name_lookup: dict[str, str],
) -> dict[str, Any]:
    created_dt = parse_datetime(raw_strike.get("created_at") or raw_strike.get("createdAt"))
    expires_dt = parse_datetime(raw_strike.get("expires_at") or raw_strike.get("expiresAt"))
    now_utc = datetime.now(timezone.utc)
    days_remaining: int | None = None
    if expires_dt is not None:
        delta = expires_dt.astimezone(timezone.utc) - now_utc
        days_remaining = max(0, delta.days)

    issued_by = _as_str_id(raw_strike.get("issued_by") or raw_strike.get("issuedBy"))
    return {
        "reason": str(raw_strike.get("reason") or "N/A"),
        "count": max(1, _as_int(raw_strike.get("count"), 1)),
        "issuedBy": issued_by,
        "issuedByName": name_lookup.get(issued_by) if issued_by else None,
        "createdAt": created_dt.isoformat() if created_dt else None,
        "expiresAt": expires_dt.isoformat() if expires_dt else None,
        "formattedIssued": created_dt.strftime("%Y-%m-%d") if created_dt else "N/A",
        "formattedExpires": expires_dt.strftime("%Y-%m-%d") if expires_dt else "N/A",
        "daysRemaining": days_remaining,
    }


def _build_dossier(
    *,
    entry_id: int,
    discord_id: str,
    username: str,
    stats_row: dict[str, Any],
    app_record: dict[str, Any] | None,
    invitees: list[dict[str, Any]],
    referrals_override: int | None,
    strikes_raw: list[dict[str, Any]],
    name_lookup: dict[str, str],
    source: str,
) -> dict[str, Any]:
    awards = _parse_awards(stats_row.get("awards"))
    event_wins = _as_int(stats_row.get("eventswon") or stats_row.get("event_wins"), 0)
    reports = _as_int(stats_row.get("reports_answered") or stats_row.get("reports"), 0)

    position, rank_tier = _infer_position_and_tier(
        explicit_position=stats_row.get("position") or stats_row.get("role"),
        reports=reports,
        event_wins=event_wins,
        awards_count=len(awards),
    )

    created_dt = app_record.get("created_at") if app_record else None
    weeks_since: int | None = None
    if created_dt is not None:
        elapsed = datetime.now(timezone.utc) - created_dt.astimezone(timezone.utc)
        weeks_since = max(0, elapsed.days // 7)

    reason_text = (app_record.get("reason") if app_record else None) or "Unknown"
    inviter_text = app_record.get("inviter") if app_record else None
    inviter_id = _as_str_id(app_record.get("inviter_id")) if app_record else None
    if not inviter_text and inviter_id:
        inviter_text = name_lookup.get(inviter_id)

    is_legacy = reason_text.strip().casefold() == "unknown" and not inviter_text and not inviter_id

    strikes = [_normalize_strike(s, name_lookup) for s in strikes_raw]
    total_active_strikes = sum(s["count"] for s in strikes)

    referrals = referrals_override if referrals_override is not None else len(invitees)

    return {
        "id": entry_id,
        "discordId": discord_id,
        "username": username,
        "displayName": str(stats_row.get("display_name") or username),
        "position": position,
        "rankTier": rank_tier,
        "source": source,
        "avatarUrl": None,
        "application": {
            "robloxUsername": (app_record.get("roblox_username") if app_record else None) or username,
            "reason": reason_text,
            "inviter": inviter_text,
            "inviterId": inviter_id,
            "createdAt": created_dt.isoformat() if created_dt else None,
            "formattedDate": format_application_date(created_dt),
            "isLegacyMigrated": is_legacy,
            "weeksSinceApplication": weeks_since,
        },
        "stats": {
            "eventWins": event_wins,
            "reports": reports,
            "referrals": referrals,
            "awards": awards,
            "awardsCount": len(awards),
        },
        "ranks": {
            "eventWins": 0,
            "reports": 0,
            "referrals": 0,
            "awardsCount": 0,
        },
        "invitees": invitees,
        "strikes": strikes,
        "totalActiveStrikes": total_active_strikes,
    }


class LedgerDataProvider:
    def __init__(self) -> None:
        self.supabase: Client | None = None
        self.live_configured: bool = False
        self.live_connected: bool = False
        self.live_error: str | None = None
        self.imported_roster: list[dict[str, Any]] | None = None
        self._avatar_cache: dict[str, tuple[float, dict[str, str | None]]] = {}
        self._avatar_pending: dict[str, asyncio.Task[dict[str, str | None]]] = {}
        self._avatar_semaphore = asyncio.Semaphore(4)
        self._roster_lock = asyncio.Lock()
        self._archive_cache: list[dict[str, Any]] | None = None
        self._live_roster_cache: tuple[float, list[dict[str, Any]]] | None = None
        self._live_reports_called_cache: int | None = None
        self._live_podium_cache: tuple[float, tuple[dict[str, list[dict[str, Any]]], list[dict[str, Any]]]] | None = None
        self._auto_init_supabase()

    def _read_env_credentials(self) -> tuple[str | None, str | None]:
        url = os.getenv("SUPABASE_DB_URL")
        key = os.getenv("SUPABASE_KEY")
        if url and key:
            return url.strip(), key.strip()

        for env_path in (LOCAL_ENV, SIBLING_BOT_ENV):
            if os.path.isfile(env_path):
                values = dotenv_values(env_path)
                e_url = (values.get("SUPABASE_DB_URL") or "").strip()
                e_key = (values.get("SUPABASE_KEY") or "").strip()
                if e_url and e_key:
                    return e_url, e_key
        return None, None

    def _auto_init_supabase(self) -> None:
        url, key = self._read_env_credentials()
        if not url or not key:
            return
        self.live_configured = True
        try:
            self.supabase = create_client(url, key)
            # Client construction does not verify database reachability.
            self.live_connected = False
            self.live_error = None
        except Exception as exc:
            self.supabase = None
            self.live_connected = False
            self.live_error = str(exc)

    def get_archive_members(self) -> list[dict[str, Any]]:
        if self._archive_cache is None:
            self._archive_cache = get_sample_archive()
        return self._archive_cache

    def get_status(self) -> dict[str, Any]:
        default_source = "live" if self.live_connected else ("imported" if self.imported_roster else "archive")
        return {
            "liveConfigured": self.live_configured,
            "liveConnected": self.live_connected,
            "liveError": self.live_error,
            "hasImported": self.imported_roster is not None,
            "importedCount": len(self.imported_roster) if self.imported_roster else 0,
            "archiveCount": len(self.get_archive_members()),
            "serverIcon": SERVER_ICON,
            "defaultSource": default_source,
        }

    def connect(self, url: str, key: str) -> dict[str, Any]:
        clean_url = (url or "").strip()
        clean_key = (key or "").strip()
        if not clean_url or not clean_key:
            return {
                "connected": False,
                "error": "Both SUPABASE_DB_URL and SUPABASE_KEY are required.",
                "status": self.get_status(),
            }

        try:
            client = create_client(clean_url, clean_key)
            # Lightweight reachability check using existing bot RPCs
            try:
                client.rpc("top_points").execute()
            except Exception:
                client.rpc("get_strike_duration").execute()

            self.supabase = client
            self.live_configured = True
            self.live_connected = True
            self.live_error = None
            self._live_roster_cache = None
            self._live_podium_cache = None
            return {
                "connected": True,
                "error": None,
                "status": self.get_status(),
            }
        except Exception as exc:
            self.live_connected = False
            self.live_error = str(exc)
            return {
                "connected": False,
                "error": str(exc),
                "status": self.get_status(),
            }

    def _fetch_single_member_live_sync(self, discord_id: int) -> dict[str, Any] | None:
        if not self.supabase:
            return None

        stats_data: dict[str, Any] = {}
        try:
            res = self.supabase.rpc("fetchstats", params={"uid": discord_id}).execute()
            if isinstance(res.data, list) and res.data:
                stats_data = res.data[0]
            elif isinstance(res.data, dict):
                stats_data = res.data
        except Exception:
            stats_data = {}

        app_record: dict[str, Any] | None = None
        try:
            res = self.supabase.rpc("fetchapplication", params={"uid": discord_id}).execute()
            app_record = normalize_application_record(res.data)
        except Exception:
            app_record = None

        if not stats_data and not app_record:
            return None

        invite_count = 0
        try:
            res = self.supabase.rpc("get_user_invite_count", params={"uid": discord_id}).execute()
            if res.data:
                row = res.data[0] if isinstance(res.data, list) else res.data
                if isinstance(row, dict):
                    invite_count = _as_int(row.get("invite_count"), 0)
        except Exception:
            pass

        invitees: list[dict[str, Any]] = []
        try:
            res = self.supabase.rpc("get_user_invitees", params={"uid": discord_id, "lim": 50}).execute()
            rows = res.data if isinstance(res.data, list) else ([res.data] if res.data else [])
            for row in rows:
                if isinstance(row, dict):
                    inv_did = _as_str_id(row.get("discord_id") or row.get("discordid"))
                    if inv_did:
                        invitees.append(
                            {
                                "discordId": inv_did,
                                "robloxUsername": row.get("roblox_username") or row.get("username") or "Unknown",
                                "position": None,
                                "entryId": None,
                            }
                        )
        except Exception:
            pass

        strikes_raw: list[dict[str, Any]] = []
        try:
            res = self.supabase.rpc("get_strikes", params={"user_id": discord_id}).execute()
            if isinstance(res.data, list):
                strikes_raw = res.data
        except Exception:
            pass

        did_str = str(discord_id)
        username = (
            stats_data.get("username")
            or (app_record.get("roblox_username") if app_record else None)
            or f"User-{did_str[-4:]}"
        )
        entry_id = _as_int(stats_data.get("id"), 0) or (discord_id % 10000)

        return _build_dossier(
            entry_id=entry_id,
            discord_id=did_str,
            username=username,
            stats_row=stats_data,
            app_record=app_record,
            invitees=invitees,
            referrals_override=max(invite_count, len(invitees)),
            strikes_raw=strikes_raw,
            name_lookup={did_str: username},
            source="live",
        )

    def _fetch_all_table_rows(
        self,
        table_name: str,
        *,
        order_col: str | None = "id",
        page_size: int = 1000,
    ) -> list[dict[str, Any]]:
        if not self.supabase:
            return []
        rows: list[dict[str, Any]] = []
        start = 0
        while True:
            query = self.supabase.table(table_name).select("*")
            if order_col:
                query = query.order(order_col)
            batch = query.range(start, start + page_size - 1).execute().data or []
            rows.extend(batch)
            if len(batch) < page_size:
                break
            start += page_size
        return rows

    def _stats_activity_score(self, row: dict[str, Any]) -> tuple[int, int]:
        awards = _parse_awards(row.get("awards"))
        score = (
            _as_int(row.get("reports_answered") or row.get("reports"), 0) * 10
            + _as_int(row.get("eventswon") or row.get("event_wins"), 0) * 50
            + len(awards) * 50
        )
        return score, _as_int(row.get("id"), 0)

    def _fetch_live_roster_sync(self, *, refresh: bool = False) -> list[dict[str, Any]]:
        if not self.supabase:
            raise RuntimeError("Supabase is not connected.")

        now = time.time()
        if not refresh and self._live_roster_cache and now - self._live_roster_cache[0] < 60:
            return self._live_roster_cache[1]

        stats_rows: list[dict[str, Any]] = []
        app_rows: list[dict[str, Any]] = []
        strikes_rows: list[dict[str, Any]] = []

        # Attempt paginated direct table reads first
        direct_ok = False
        try:
            stats_rows = self._fetch_all_table_rows("stats", order_col="id")
            app_rows = self._fetch_all_table_rows("applications", order_col="id")
            direct_ok = bool(stats_rows or app_rows)
        except Exception:
            direct_ok = False

        if direct_ok:
            try:
                strikes_rows = self._fetch_all_table_rows("strikes", order_col="id")
            except Exception:
                strikes_rows = []

            try:
                rep_count_resp = (
                    self.supabase.table("reports").select("id", count="exact").limit(1).execute()
                )
                self._live_reports_called_cache = rep_count_resp.count
            except Exception:
                self._live_reports_called_cache = None

            app_by_did: dict[str, dict[str, Any]] = {}
            for row in app_rows:
                did = _as_str_id(row.get("discordid") or row.get("discord_id"))
                if did:
                    normalized = normalize_application_record(row)
                    if normalized:
                        app_by_did[did] = normalized

            stats_by_did: dict[str, dict[str, Any]] = {}
            for row in stats_rows:
                did = _as_str_id(row.get("discordid") or row.get("discord_id"))
                if not did:
                    continue
                existing = stats_by_did.get(did)
                if existing is None or self._stats_activity_score(row) >= self._stats_activity_score(existing):
                    stats_by_did[did] = row

            all_dids = list(dict.fromkeys([*stats_by_did.keys(), *app_by_did.keys()]))
            name_lookup: dict[str, str] = {}
            entry_id_lookup: dict[str, int] = {}
            for idx, did in enumerate(all_dids, start=1):
                st = stats_by_did.get(did, {})
                ap = app_by_did.get(did)
                uname = st.get("username") or (ap.get("roblox_username") if ap else None) or f"Operative-{idx}"
                name_lookup[did] = uname
                entry_id_lookup[did] = _as_int(st.get("id"), idx)

            invitees_by_inviter: dict[str, list[dict[str, Any]]] = {}
            for did in all_dids:
                ap = app_by_did.get(did)
                inv_id = ap.get("inviter_id") if ap else None
                if inv_id:
                    invitees_by_inviter.setdefault(inv_id, []).append(
                        {
                            "discordId": did,
                            "robloxUsername": name_lookup.get(did, "Unknown"),
                            "position": None,
                            "entryId": entry_id_lookup.get(did),
                        }
                    )

            now_utc = datetime.now(timezone.utc)
            strikes_by_did: dict[str, list[dict[str, Any]]] = {}
            for st_row in strikes_rows:
                uid = _as_str_id(st_row.get("user_id") or st_row.get("discordid"))
                if not uid:
                    continue
                exp_dt = parse_datetime(st_row.get("expires_at"))
                if exp_dt is not None and exp_dt.astimezone(timezone.utc) <= now_utc:
                    continue
                strikes_by_did.setdefault(uid, []).append(st_row)

            members: list[dict[str, Any]] = []
            for did in all_dids:
                st = stats_by_did.get(did, {})
                ap = app_by_did.get(did)
                members.append(
                    _build_dossier(
                        entry_id=entry_id_lookup[did],
                        discord_id=did,
                        username=name_lookup[did],
                        stats_row=st,
                        app_record=ap,
                        invitees=invitees_by_inviter.get(did, []),
                        referrals_override=None,
                        strikes_raw=strikes_by_did.get(did, []),
                        name_lookup=name_lookup,
                        source="live",
                    )
                )

            # Hydrate invitee positions
            pos_by_did = {m["discordId"]: m["position"] for m in members}
            for m in members:
                for inv in m["invitees"]:
                    inv["position"] = pos_by_did.get(inv["discordId"])

            finalized = finalize_roster(members)
            self._live_roster_cache = (time.time(), finalized)
            self._live_podium_cache = None
            return finalized

        # Fallback: discover unique IDs via public podium RPCs and hydrate individually
        discovered_ids: list[int] = []
        seen_ids: set[int] = set()
        for rpc_name in ("top_points", "top_donations", "top_recruitment", "top_events", "top_reports"):
            try:
                rows = self.supabase.rpc(rpc_name).execute().data or []
                for row in rows:
                    if not isinstance(row, dict):
                        continue
                    raw_id = row.get("discordid") or row.get("inviter_id")
                    if raw_id:
                        uid = int(raw_id)
                        if uid not in seen_ids:
                            seen_ids.add(uid)
                            discovered_ids.append(uid)
            except Exception:
                continue

        members = []
        for uid in discovered_ids:
            dossier = self._fetch_single_member_live_sync(uid)
            if dossier:
                members.append(dossier)

        if not members:
            raise RuntimeError(
                "Connected to Supabase, but direct table access was restricted by RLS and no podium entries were returned."
            )

        finalized = finalize_roster(members)
        self._live_roster_cache = (time.time(), finalized)
        self._live_podium_cache = None
        return finalized

    async def get_roster(self, source: str = "auto", *, refresh: bool = False) -> dict[str, Any]:
        requested = (source or "auto").lower()

        if requested == "imported":
            if not self.imported_roster:
                return {
                    "source": "archive",
                    "liveError": "No CSV ledger has been imported yet; showing Sample Archive.",
                    "totals": compute_totals(self.get_archive_members()),
                    "members": self.get_archive_members(),
                }
            return {
                "source": "imported",
                "liveError": None,
                "totals": compute_totals(self.imported_roster),
                "members": self.imported_roster,
            }

        if requested in ("auto", "live") and self.supabase is not None:
            try:
                async with self._roster_lock:
                    members = await asyncio.to_thread(self._fetch_live_roster_sync, refresh=refresh)
                self.live_connected = True
                self.live_error = None
                return {
                    "source": "live",
                    "liveError": None,
                    "totals": compute_totals(members, reports_called=self._live_reports_called_cache),
                    "members": members,
                }
            except Exception as exc:
                self.live_connected = False
                self.live_error = str(exc)
                self._live_roster_cache = None
                self._live_podium_cache = None
                if requested == "live" or self.live_configured:
                    return {
                        "source": "live",
                        "liveError": str(exc),
                        "totals": compute_totals([]),
                        "members": [],
                    }

        if requested == "live" or (requested == "auto" and self.live_configured):
            return {
                "source": "live",
                "liveError": self.live_error or "Supabase is not configured.",
                "totals": compute_totals([]),
                "members": [],
            }

        if requested == "auto" and self.imported_roster:
            return {
                "source": "imported",
                "liveError": self.live_error,
                "totals": compute_totals(self.imported_roster),
                "members": self.imported_roster,
            }

        archive = self.get_archive_members()
        return {
            "source": "archive",
            "liveError": self.live_error,
            "totals": compute_totals(archive, reports_called=812),
            "members": archive,
        }

    async def get_member(self, discord_id_str: str) -> dict[str, Any] | None:
        clean_id = (discord_id_str or "").strip()
        if not clean_id:
            return None

        if self.supabase is not None and clean_id.isdigit():
            try:
                dossier = await asyncio.to_thread(
                    self._fetch_single_member_live_sync, int(clean_id)
                )
                if dossier:
                    return dossier
            except Exception as exc:
                self.live_error = str(exc)

        for pool in (self.imported_roster or [], self.get_archive_members()):
            for m in pool:
                if m["discordId"] == clean_id:
                    return m
        return None

    def _podium_from_roster(self, members: list[dict[str, Any]]) -> tuple[dict[str, list[dict[str, Any]]], list[dict[str, Any]]]:
        mapping = {
            "reports": "reports",
            "eventwins": "eventWins",
            "referrals": "referrals",
            "awards": "awardsCount",
        }
        categories: dict[str, list[dict[str, Any]]] = {}
        for cat_key, stat_key in mapping.items():
            ranked = sorted(
                members,
                key=lambda item: (-int(item["stats"].get(stat_key, 0) or 0), int(item["id"])),
            )[:3]
            categories[cat_key] = [
                {
                    "rank": idx,
                    "entryId": m["id"],
                    "discordId": m["discordId"],
                    "username": m["username"],
                    "position": m["position"],
                    "value": int(m["stats"].get(stat_key, 0) or 0),
                }
                for idx, m in enumerate(ranked, start=1)
            ]

        field_ranked = sorted(
            members,
            key=lambda item: (-int(item["stats"].get("reports", 0) or 0), int(item["id"])),
        )[:10]
        field_rankings = [
            {
                "rank": idx,
                "entryId": m["id"],
                "discordId": m["discordId"],
                "username": m["username"],
                "position": m["position"],
                "value": int(m["stats"].get("reports", 0) or 0),
            }
            for idx, m in enumerate(field_ranked, start=1)
        ]
        return categories, field_rankings

    def _fetch_live_podium_sync(
        self,
        members: list[dict[str, Any]],
        *,
        refresh: bool = False,
    ) -> tuple[dict[str, list[dict[str, Any]]], list[dict[str, Any]]]:
        if not self.supabase:
            raise RuntimeError("Supabase is not connected.")

        now = time.time()
        if not refresh and self._live_podium_cache and now - self._live_podium_cache[0] < 60:
            return self._live_podium_cache[1]

        by_did = {m["discordId"]: m for m in members}
        rpc_specs = {
            "referrals": ("top_recruitment", "inviter_id", "invite_count"),
            "eventwins": ("top_events", "discordid", "eventswon"),
            "reports": ("top_reports", "discordid", "reports_answered"),
        }

        categories: dict[str, list[dict[str, Any]]] = {}
        field_rankings: list[dict[str, Any]] = []

        for cat_key, (rpc_name, id_key, val_key) in rpc_specs.items():
            rows = self.supabase.rpc(rpc_name).execute().data or []
            parsed_rows: list[dict[str, Any]] = []
            limit = 10 if cat_key == "reports" else 3
            for idx, row in enumerate(rows[:limit], start=1):
                if not isinstance(row, dict):
                    continue
                did = _as_str_id(row.get(id_key))
                match = by_did.get(did) if did else None
                parsed_rows.append(
                    {
                        "rank": idx,
                        "entryId": match["id"] if match else None,
                        "discordId": did,
                        "username": row.get("username") or (match["username"] if match else "Unknown"),
                        "position": match["position"] if match else None,
                        "value": _as_int(row.get(val_key), 0),
                    }
                )
            categories[cat_key] = parsed_rows[:3]
            if cat_key == "reports":
                field_rankings = parsed_rows[:10]

        roster_categories, _ = self._podium_from_roster(members)
        categories["awards"] = roster_categories.get("awards", [])

        result = (categories, field_rankings)
        self._live_podium_cache = (time.time(), result)
        return result

    async def get_podium(self, source: str = "auto", *, refresh: bool = False) -> dict[str, Any]:
        roster_payload = await self.get_roster(source, refresh=refresh)
        members = roster_payload["members"]
        effective_source = roster_payload["source"]

        if effective_source == "live" and self.supabase is not None and not roster_payload["liveError"]:
            try:
                categories, field_rankings = await asyncio.to_thread(
                    self._fetch_live_podium_sync, members, refresh=refresh
                )
                return {
                    "source": "live",
                    "categories": categories,
                    "fieldRankings": field_rankings,
                }
            except Exception:
                pass

        categories, field_rankings = self._podium_from_roster(members)
        return {
            "source": effective_source,
            "categories": categories,
            "fieldRankings": field_rankings,
        }

    async def resolve_roblox_avatar(self, username: str) -> dict[str, str | None]:
        clean = (username or "").strip()
        if not clean:
            return {"headshotUrl": None, "fullBodyUrl": None}
        key = clean.casefold()
        cached = self._avatar_cache.get(key)
        if cached:
            ts, payload = cached
            has_any = bool(payload.get("headshotUrl") or payload.get("fullBodyUrl"))
            if time.time() - ts < (1800 if has_any else 15):
                return payload
        task = self._avatar_pending.get(key)
        if task is None:
            task = asyncio.create_task(self._resolve_and_cache_avatar(clean, key))
            self._avatar_pending[key] = task
        # One disconnected browser request must not cancel another's lookup.
        return await asyncio.shield(task)

    async def _resolve_and_cache_avatar(self, username: str, key: str) -> dict[str, str | None]:
        try:
            async with self._avatar_semaphore:
                payload = await self._fetch_roblox_avatar(username)
            self._avatar_cache[key] = (time.time(), payload)
            return payload
        finally:
            self._avatar_pending.pop(key, None)

    async def _fetch_thumbnail_url(
        self,
        session: aiohttp.ClientSession,
        endpoint: str,
        roblox_id: str,
    ) -> str | None:
        thumb_url = (
            f"https://thumbnails.roblox.com/v1/users/{endpoint}"
            f"?userIds={roblox_id}&size=420x420&format=Png&isCircular=false"
        )
        for attempt in range(2):
            async with session.get(thumb_url) as resp:
                retry = resp.status == 429
                if resp.status == 200:
                    items = (await resp.json()).get("data") or []
                    item = items[0] if items else {}
                    url = item.get("imageUrl")
                    if item.get("state") == "Completed" and isinstance(url, str):
                        parsed = urlparse(url)
                        if parsed.scheme == "https" and parsed.hostname and not parsed.username and not parsed.password:
                            return url
                    retry = item.get("state") == "Pending"
            if not retry or attempt:
                break
            await asyncio.sleep(0.5)
        return None

    async def _fetch_roblox_avatar(self, username: str) -> dict[str, str | None]:
        timeout = aiohttp.ClientTimeout(total=6)
        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                roblox_id: str | None = None
                try:
                    for attempt in range(2):
                        async with session.post(
                            "https://users.roblox.com/v1/usernames/users",
                            json={"usernames": [username], "excludeBannedUsers": False},
                        ) as resp:
                            if resp.status == 200:
                                data = (await resp.json()).get("data") or []
                                if data and data[0].get("id"):
                                    roblox_id = str(data[0]["id"])
                            retry = resp.status == 429
                        if not retry or attempt:
                            break
                        await asyncio.sleep(0.5)
                except Exception:
                    pass

                if not roblox_id:
                    profile_url = f"https://www.roblox.com/users/profile?username={quote(username)}"
                    async with session.get(profile_url, allow_redirects=True) as resp:
                        parts = urlparse(str(resp.url)).path.split("/")
                        if len(parts) > 2 and parts[1] == "users" and parts[2].isdigit():
                            roblox_id = parts[2]
                if not roblox_id:
                    return {"headshotUrl": None, "fullBodyUrl": None}

                headshot_url, full_body_url = await asyncio.gather(
                    self._fetch_thumbnail_url(session, "avatar-headshot", roblox_id),
                    self._fetch_thumbnail_url(session, "avatar", roblox_id),
                )
                return {"headshotUrl": headshot_url, "fullBodyUrl": full_body_url}
        except Exception:
            pass
        return {"headshotUrl": None, "fullBodyUrl": None}

    def import_csv(self, stats_csv: str | None, applications_csv: str | None) -> list[dict[str, Any]]:
        stats_by_did: dict[str, dict[str, Any]] = {}
        apps_by_did: dict[str, dict[str, Any]] = {}

        if stats_csv and stats_csv.strip():
            reader = csv.DictReader(io.StringIO(stats_csv.lstrip("\ufeff")))
            for row in reader:
                did = _as_str_id(row.get("discordid") or row.get("discord_id"))
                if not did:
                    continue
                stats_by_did[did] = row

        if applications_csv and applications_csv.strip():
            reader = csv.DictReader(io.StringIO(applications_csv.lstrip("\ufeff")))
            for row in reader:
                did = _as_str_id(row.get("discordid") or row.get("discord_id"))
                if not did:
                    continue
                apps_by_did[did] = normalize_application_record(row) or {}

        all_dids = list(dict.fromkeys([*stats_by_did.keys(), *apps_by_did.keys()]))
        if not all_dids:
            raise ValueError("No valid records with a 'discordid' column were found in the uploaded CSV(s).")

        name_lookup: dict[str, str] = {}
        entry_id_lookup: dict[str, int] = {}
        for idx, did in enumerate(all_dids, start=1):
            st = stats_by_did.get(did, {})
            ap = apps_by_did.get(did)
            name_lookup[did] = (
                st.get("username")
                or (ap.get("roblox_username") if ap else None)
                or f"Operative-{idx}"
            )
            entry_id_lookup[did] = _as_int(st.get("id"), idx)

        invitees_by_inviter: dict[str, list[dict[str, Any]]] = {}
        for did in all_dids:
            ap = apps_by_did.get(did)
            inv_id = ap.get("inviter_id") if ap else None
            if inv_id:
                invitees_by_inviter.setdefault(inv_id, []).append(
                    {
                        "discordId": did,
                        "robloxUsername": name_lookup.get(did, "Unknown"),
                        "position": None,
                        "entryId": entry_id_lookup.get(did),
                    }
                )

        members: list[dict[str, Any]] = []
        for did in all_dids:
            st = stats_by_did.get(did, {})
            ap = apps_by_did.get(did)
            members.append(
                _build_dossier(
                    entry_id=entry_id_lookup[did],
                    discord_id=did,
                    username=name_lookup[did],
                    stats_row=st,
                    app_record=ap,
                    invitees=invitees_by_inviter.get(did, []),
                    referrals_override=None,
                    strikes_raw=[],
                    name_lookup=name_lookup,
                    source="imported",
                )
            )

        pos_by_did = {m["discordId"]: m["position"] for m in members}
        for m in members:
            for inv in m["invitees"]:
                inv["position"] = pos_by_did.get(inv["discordId"])

        self.imported_roster = finalize_roster(members)
        return self.imported_roster

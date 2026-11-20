from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

APP_TIMEZONE = ZoneInfo("America/New_York")


def _fmt_dt(dt: datetime) -> str:
    return dt.astimezone(APP_TIMEZONE).strftime("%Y-%m-%d %H:%M %Z")


def get_sample_archive() -> list[dict[str, Any]]:
    """Return 14 synthetic CAA personnel dossiers matching the bot's database schema."""
    now = datetime.now(APP_TIMEZONE)

    raw_members = [
        {
            "id": 1,
            "discordId": "270202464861421568",
            "username": "VinnieVelvet",
            "displayName": "Vinnie Velvet",
            "position": "Director",
            "rankTier": "leadership",
            "appDaysAgo": 620,
            "reason": "Unknown",
            "inviter": None,
            "inviterId": None,
            "isLegacyMigrated": True,
            "points": 2610,
            "income": 14200,
            "eventWins": 14,
            "reports": 318,
            "awards": [
                "Founding Member",
                "Organization Architect",
                "Organization Architect",
                "Executive Council",
            ],
            "strikes": [],
        },
        {
            "id": 2,
            "discordId": "314159265358979323",
            "username": "SalTheClock",
            "displayName": "Sal \"The Clock\" Bellucci",
            "position": "Deputy Director",
            "rankTier": "leadership",
            "appDaysAgo": 540,
            "reason": "Vinnie vouched for me after we cleared three stacked public lobbies at midnight. Looking to run night watch dispatch.",
            "inviter": "VinnieVelvet",
            "inviterId": "270202464861421568",
            "isLegacyMigrated": False,
            "points": 2780,
            "income": 9600,
            "eventWins": 12,
            "reports": 412,
            "awards": [
                "Field Marshal",
                "Night Watch",
                "Night Watch",
                "Teamer Reaper",
            ],
            "strikes": [],
        },
        {
            "id": 3,
            "discordId": "418902341122334455",
            "username": "MinaCorleone",
            "displayName": "Mina Corleone",
            "position": "Senior Advisor",
            "rankTier": "leadership",
            "appDaysAgo": 590,
            "reason": "Unknown",
            "inviter": None,
            "inviterId": None,
            "isLegacyMigrated": True,
            "points": 2340,
            "income": 18500,
            "eventWins": 8,
            "reports": 229,
            "awards": [
                "Golden Ledger",
                "Golden Ledger",
                "Archive Keeper",
            ],
            "strikes": [],
        },
        {
            "id": 4,
            "discordId": "519283746501928374",
            "username": "RookGambino",
            "displayName": "Rook Gambino",
            "position": "Respected Employee",
            "rankTier": "made",
            "appDaysAgo": 470,
            "reason": "Tired of solo-queuing against 5-man teamers. Want a disciplined organization that answers calls in under two minutes.",
            "inviter": "VinnieVelvet",
            "inviterId": "270202464861421568",
            "isLegacyMigrated": False,
            "points": 2940,
            "income": 6800,
            "eventWins": 19,
            "reports": 274,
            "awards": [
                "Event Champion",
                "Event Champion",
                "Event Champion",
                "Arena Lead",
            ],
            "strikes": [],
        },
        {
            "id": 5,
            "discordId": "602918273645102938",
            "username": "DanteVance",
            "displayName": "Dante Vance",
            "position": "Senior Employee",
            "rankTier": "made",
            "appDaysAgo": 410,
            "reason": "Referred straight from the private duel circuit. Ready to back up CAA callers and keep tournament brackets clean.",
            "inviter": "VinnieVelvet",
            "inviterId": "270202464861421568",
            "isLegacyMigrated": False,
            "points": 1980,
            "income": 4500,
            "eventWins": 11,
            "reports": 287,
            "awards": [
                "Heavy Hitter",
                "Rapid Responder",
            ],
            "strikes": [
                {
                    "reason": "Clocked out 20 minutes after sector report closed without caller confirmation.",
                    "count": 1,
                    "issuedBy": "314159265358979323",
                    "issuedDaysAgo": 12,
                    "expiresInDays": 18,
                }
            ],
        },
        {
            "id": 6,
            "discordId": "709182736455112233",
            "username": "NadiaBellini",
            "displayName": "Nadia Bellini",
            "position": "Senior Employee",
            "rankTier": "made",
            "appDaysAgo": 340,
            "reason": "Sal recruited me during weekend anti-teamer sweeps. I play late EU/EST overlap when reports spike.",
            "inviter": "SalTheClock",
            "inviterId": "314159265358979323",
            "isLegacyMigrated": False,
            "points": 1890,
            "income": 5100,
            "eventWins": 6,
            "reports": 256,
            "awards": [
                "Rapid Responder",
                "Rapid Responder",
                "Clean Sheet",
            ],
            "strikes": [],
        },
        {
            "id": 7,
            "discordId": "812345678901234567",
            "username": "TobyBrass",
            "displayName": "Toby \"Brass\" Moretti",
            "position": "Employee",
            "rankTier": "made",
            "appDaysAgo": 280,
            "reason": "Here to answer field pings reliably and recruit solid duelists from my old clan.",
            "inviter": "SalTheClock",
            "inviterId": "314159265358979323",
            "isLegacyMigrated": False,
            "points": 1410,
            "income": 3200,
            "eventWins": 4,
            "reports": 191,
            "awards": ["Frontline Regular"],
            "strikes": [],
        },
        {
            "id": 8,
            "discordId": "845612390123456789",
            "username": "KiroMarchetti",
            "displayName": "Kiro Marchetti",
            "position": "Employee",
            "rankTier": "made",
            "appDaysAgo": 245,
            "reason": "Watched three CAA operatives dismantle a 6-stack server. Want the badge and the work.",
            "inviter": "SalTheClock",
            "inviterId": "314159265358979323",
            "isLegacyMigrated": False,
            "points": 1120,
            "income": 1800,
            "eventWins": 3,
            "reports": 174,
            "awards": ["Iron Stamina"],
            "strikes": [
                {
                    "reason": "Submitted unverified report call with only two opponents listed.",
                    "count": 1,
                    "issuedBy": "314159265358979323",
                    "issuedDaysAgo": 21,
                    "expiresInDays": 9,
                },
                {
                    "reason": "Friendly-fire escalation during crowded lobby sweep.",
                    "count": 1,
                    "issuedBy": "270202464861421568",
                    "issuedDaysAgo": 5,
                    "expiresInDays": 25,
                },
            ],
        },
        {
            "id": 9,
            "discordId": "876543210987654321",
            "username": "ElenaSable",
            "displayName": "Elena Sable",
            "position": "Employee",
            "rankTier": "made",
            "appDaysAgo": 215,
            "reason": "Mina invited me to help fund prize pools and cover Saturday night exhibition events.",
            "inviter": "MinaCorleone",
            "inviterId": "418902341122334455",
            "isLegacyMigrated": False,
            "points": 1540,
            "income": 7400,
            "eventWins": 5,
            "reports": 149,
            "awards": [
                "Silver Benefactor",
                "Silver Benefactor",
            ],
            "strikes": [],
        },
        {
            "id": 10,
            "discordId": "901234567890123456",
            "username": "MarcoLuciano",
            "displayName": "Marco Luciano",
            "position": "Employee",
            "rankTier": "made",
            "appDaysAgo": 180,
            "reason": "Looking for structured sparring and clean anti-teamer enforcement with veteran leads.",
            "inviter": "MinaCorleone",
            "inviterId": "418902341122334455",
            "isLegacyMigrated": False,
            "points": 1290,
            "income": 2900,
            "eventWins": 7,
            "reports": 138,
            "awards": ["Event Champion"],
            "strikes": [],
        },
        {
            "id": 11,
            "discordId": "923456789012345678",
            "username": "HectorGraves",
            "displayName": "Hector Graves",
            "position": "Employee",
            "rankTier": "made",
            "appDaysAgo": 132,
            "reason": "Rook challenged me in an elimination bracket and suggested I apply through the Front Door.",
            "inviter": "RookGambino",
            "inviterId": "519283746501928374",
            "isLegacyMigrated": False,
            "points": 1350,
            "income": 2150,
            "eventWins": 9,
            "reports": 112,
            "awards": [
                "Event Champion",
                "Duellist",
            ],
            "strikes": [],
        },
        {
            "id": 12,
            "discordId": "945678901234567890",
            "username": "BramConti",
            "displayName": "Bram Conti",
            "position": "Intern",
            "rankTier": "intern",
            "appDaysAgo": 65,
            "reason": "Active daily from 7pm-1am EST. Want to earn my Employee stripe by grinding field calls.",
            "inviter": "RookGambino",
            "inviterId": "519283746501928374",
            "isLegacyMigrated": False,
            "points": 480,
            "income": 400,
            "eventWins": 1,
            "reports": 54,
            "awards": [],
            "strikes": [
                {
                    "reason": "Left active patrol server before caller closed the teamer report.",
                    "count": 1,
                    "issuedBy": "602918273645102938",
                    "issuedDaysAgo": 8,
                    "expiresInDays": 22,
                }
            ],
        },
        {
            "id": 13,
            "discordId": "967890123456789012",
            "username": "SoraMarino",
            "displayName": "Sora Marino",
            "position": "Intern",
            "rankTier": "intern",
            "appDaysAgo": 51,
            "reason": "Nadia brought me in after three straight clean report assists. Never miss a night ping.",
            "inviter": "NadiaBellini",
            "inviterId": "709182736455112233",
            "isLegacyMigrated": False,
            "points": 590,
            "income": 950,
            "eventWins": 2,
            "reports": 68,
            "awards": ["Promising Recruit"],
            "strikes": [],
        },
        {
            "id": 14,
            "discordId": "987654321098765432",
            "username": "JulesDeLuca",
            "displayName": "Jules DeLuca",
            "position": "Intern",
            "rankTier": "intern",
            "appDaysAgo": 14,
            "reason": "Referred by TobyBrass. Ready to prove myself on Front Door intake and evening teamer calls.",
            "inviter": "TobyBrass",
            "inviterId": "812345678901234567",
            "isLegacyMigrated": False,
            "points": 210,
            "income": 250,
            "eventWins": 0,
            "reports": 19,
            "awards": [],
            "strikes": [],
        },
    ]

    # Build lookup maps for names & invitees
    by_discord_id = {m["discordId"]: m for m in raw_members}
    invitees_map: dict[str, list[dict[str, Any]]] = {m["discordId"]: [] for m in raw_members}
    for m in raw_members:
        inv_id = m.get("inviterId")
        if inv_id and inv_id in invitees_map:
            invitees_map[inv_id].append(
                {
                    "discordId": m["discordId"],
                    "robloxUsername": m["username"],
                    "position": m["position"],
                    "entryId": m["id"],
                }
            )

    dossiers: list[dict[str, Any]] = []
    for m in raw_members:
        app_dt = now - timedelta(days=m["appDaysAgo"])
        weeks = m["appDaysAgo"] // 7
        strikes_out: list[dict[str, Any]] = []
        total_active_strikes = 0
        for s in m["strikes"]:
            issued_dt = now - timedelta(days=s["issuedDaysAgo"])
            expires_dt = now + timedelta(days=s["expiresInDays"])
            issuer = by_discord_id.get(s["issuedBy"])
            count = int(s.get("count", 1) or 1)
            total_active_strikes += count
            strikes_out.append(
                {
                    "reason": s["reason"],
                    "count": count,
                    "issuedBy": s["issuedBy"],
                    "issuedByName": issuer["username"] if issuer else None,
                    "createdAt": issued_dt.isoformat(),
                    "expiresAt": expires_dt.isoformat(),
                    "formattedIssued": issued_dt.strftime("%Y-%m-%d"),
                    "formattedExpires": expires_dt.strftime("%Y-%m-%d"),
                    "daysRemaining": int(s["expiresInDays"]),
                }
            )

        invitees = invitees_map.get(m["discordId"], [])
        dossiers.append(
            {
                "id": m["id"],
                "discordId": m["discordId"],
                "username": m["username"],
                "displayName": m["displayName"],
                "position": m["position"],
                "rankTier": m["rankTier"],
                "source": "archive",
                "avatarUrl": None,
                "application": {
                    "robloxUsername": m["username"],
                    "reason": m["reason"],
                    "inviter": m["inviter"],
                    "inviterId": m["inviterId"],
                    "createdAt": app_dt.isoformat(),
                    "formattedDate": _fmt_dt(app_dt),
                    "isLegacyMigrated": m["isLegacyMigrated"],
                    "weeksSinceApplication": weeks,
                },
                "stats": {
                    "eventWins": m["eventWins"],
                    "reports": m["reports"],
                    "referrals": len(invitees),
                    "awards": list(m["awards"]),
                    "awardsCount": len(m["awards"]),
                },
                "ranks": {
                    "eventWins": 0,
                    "reports": 0,
                    "referrals": 0,
                    "awardsCount": 0,
                },
                "invitees": invitees,
                "strikes": strikes_out,
                "totalActiveStrikes": total_active_strikes,
            }
        )

    return finalize_roster(dossiers)


def compute_ranks(members: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Compute competition ranks across the 4 performance & recognition pillars."""
    metrics = ("eventWins", "reports", "referrals", "awardsCount")
    for metric in metrics:
        sorted_members = sorted(
            members,
            key=lambda item: (-int(item["stats"].get(metric, 0) or 0), int(item["id"])),
        )
        last_val = None
        last_rank = 0
        for idx, member in enumerate(sorted_members, start=1):
            val = int(member["stats"].get(metric, 0) or 0)
            if val != last_val:
                last_rank = idx
                last_val = val
            member["ranks"][metric] = last_rank
    return members


def compute_totals(
    members: list[dict[str, Any]],
    *,
    reports_called: int | None = None,
) -> dict[str, Any]:
    return {
        "totalMembers": len(members),
        "leadershipCount": sum(1 for m in members if m["rankTier"] == "leadership"),
        "madeCount": sum(1 for m in members if m["rankTier"] == "made"),
        "internCount": sum(1 for m in members if m["rankTier"] == "intern"),
        "totalReportsCalled": reports_called,
        "activeResponders": sum(1 for m in members if int(m["stats"].get("reports", 0) or 0) > 0),
        "combinedReports": sum(int(m["stats"].get("reports", 0) or 0) for m in members),
        "combinedEventWins": sum(int(m["stats"].get("eventWins", 0) or 0) for m in members),
        "combinedReferrals": sum(int(m["stats"].get("referrals", 0) or 0) for m in members),
        "totalAwards": sum(len(m["stats"].get("awards") or []) for m in members),
        "flaggedMembers": sum(1 for m in members if int(m.get("totalActiveStrikes", 0) or 0) > 0),
        "activeStrikesCount": sum(int(m.get("totalActiveStrikes", 0) or 0) for m in members),
    }


def finalize_roster(members: list[dict[str, Any]]) -> list[dict[str, Any]]:
    members_sorted = sorted(members, key=lambda m: int(m["id"]))
    return compute_ranks(members_sorted)

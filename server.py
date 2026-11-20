from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Any

from aiohttp import web

from data_provider import LedgerDataProvider

BASE_DIR = Path(__file__).resolve().parent
WEB_DIST_DIR = BASE_DIR / "web" / "dist"


@web.middleware
async def cors_middleware(request: web.Request, handler: Any) -> web.StreamResponse:
    if request.method == "OPTIONS":
        response: web.StreamResponse = web.Response(status=204)
    else:
        response = await handler(request)

    origin = request.headers.get("Origin", "")
    if origin.startswith("http://localhost:") or origin.startswith("http://127.0.0.1:"):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


def create_app(provider: LedgerDataProvider | None = None) -> web.Application:
    data = provider or LedgerDataProvider()
    app = web.Application(middlewares=[cors_middleware], client_max_size=16 * 1024 * 1024)
    app["provider"] = data

    async def handle_status(_: web.Request) -> web.Response:
        return web.json_response(data.get_status())

    async def handle_roster(request: web.Request) -> web.Response:
        source = request.query.get("source", "auto")
        payload = await data.get_roster(source=source)
        return web.json_response(payload)

    async def handle_member(request: web.Request) -> web.Response:
        discord_id = request.match_info.get("discord_id", "").strip()
        member = await data.get_member(discord_id)
        if not member:
            return web.json_response(
                {"error": f"No file found for Discord ID {discord_id}."},
                status=404,
            )
        return web.json_response({"member": member})

    async def handle_podium(request: web.Request) -> web.Response:
        source = request.query.get("source", "auto")
        payload = await data.get_podium(source=source)
        return web.json_response(payload)

    async def handle_avatar(request: web.Request) -> web.Response:
        username = request.match_info.get("username", "").strip()
        url = await data.resolve_roblox_avatar(username)
        return web.json_response({"username": username, "url": url})

    async def handle_connect(request: web.Request) -> web.Response:
        try:
            body = await request.json()
        except Exception:
            return web.json_response({"connected": False, "error": "Invalid JSON body."}, status=400)
        result = data.connect(body.get("url", ""), body.get("key", ""))
        status_code = 200 if result["connected"] else 400
        return web.json_response(result, status=status_code)

    async def handle_import(request: web.Request) -> web.Response:
        try:
            body = await request.json()
        except Exception:
            return web.json_response({"error": "Invalid JSON body."}, status=400)

        try:
            members = data.import_csv(body.get("statsCsv"), body.get("applicationsCsv"))
        except ValueError as exc:
            return web.json_response({"error": str(exc)}, status=400)

        return web.json_response(
            {
                "count": len(members),
                "members": members,
                "status": data.get_status(),
            }
        )

    async def handle_spa(request: web.Request) -> web.StreamResponse:
        if not WEB_DIST_DIR.is_dir():
            return web.Response(
                text=(
                    "CAA Black Ledger frontend has not been built yet.\n"
                    f"Run: cd {BASE_DIR / 'web'} && npm install && npm run build"
                ),
                status=503,
                content_type="text/plain",
            )

        rel_path = request.match_info.get("tail", "").lstrip("/")
        if rel_path:
            candidate = (WEB_DIST_DIR / rel_path).resolve()
            if candidate.is_file() and WEB_DIST_DIR.resolve() in candidate.parents:
                return web.FileResponse(candidate)

        index_file = WEB_DIST_DIR / "index.html"
        if index_file.is_file():
            return web.FileResponse(index_file)
        return web.Response(text="index.html not found in dist.", status=404)

    app.router.add_get("/api/status", handle_status)
    app.router.add_get("/api/roster", handle_roster)
    app.router.add_get("/api/member/{discord_id}", handle_member)
    app.router.add_get("/api/podium", handle_podium)
    app.router.add_get("/api/avatar/{username}", handle_avatar)
    app.router.add_post("/api/connect", handle_connect)
    app.router.add_post("/api/import", handle_import)
    app.router.add_get("/", handle_spa)
    app.router.add_get("/{tail:.*}", handle_spa)

    return app


def main() -> None:
    default_port = int(os.getenv("LEDGER_PORT", "8765"))
    parser = argparse.ArgumentParser(description="Serve The Black Ledger web application.")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface to bind (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=default_port, help=f"Port to listen on (default: {default_port})")
    args = parser.parse_args()

    provider = LedgerDataProvider()
    status = provider.get_status()
    source_label = "LIVE SUPABASE" if status["liveConnected"] else f"SAMPLE ARCHIVE ({status['archiveCount']} files)"

    print("=" * 64)
    print("  THE BLACK LEDGER — Custom Adversaries Association Archive")
    print(f"  Listening : http://{args.host}:{args.port}")
    print(f"  Data Mode : {source_label}")
    if status["liveError"]:
        print(f"  Live Note : {status['liveError']}")
    print("=" * 64)

    app = create_app(provider)
    web.run_app(app, host=args.host, port=args.port, print=None)


if __name__ == "__main__":
    main()

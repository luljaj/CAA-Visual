import asyncio
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

from data_provider import LedgerDataProvider


def provider():
    with patch.object(LedgerDataProvider, '_read_env_credentials', return_value=(None, None)):
        return LedgerDataProvider()


class ConnectionTests(unittest.IsolatedAsyncioTestCase):
    async def test_configured_is_not_connected_until_successful_read(self):
        with patch.object(LedgerDataProvider, '_read_env_credentials', return_value=('url', 'key')), patch('data_provider.create_client'):
            data = LedgerDataProvider()
        self.assertTrue(data.get_status()['liveConfigured'])
        self.assertFalse(data.get_status()['liveConnected'])
        with patch.object(data, '_fetch_live_roster_sync', return_value=[]):
            result = await data.get_roster('auto')
        self.assertEqual(result['source'], 'live')
        self.assertTrue(data.get_status()['liveConnected'])
        data._live_roster_cache = (100, [])
        with patch.object(data, '_fetch_live_roster_sync', side_effect=RuntimeError('offline')):
            result = await data.get_roster('auto', refresh=True)
        self.assertIsNone(data._live_roster_cache)
        self.assertEqual(result['source'], 'live')
        self.assertEqual(result['members'], [])
        self.assertEqual(result['liveError'], 'offline')
        self.assertFalse(data.get_status()['liveConnected'])

    async def test_explicit_unconfigured_live_never_becomes_samples(self):
        data = provider()
        result = await data.get_roster('live')
        self.assertEqual(result['source'], 'live')
        self.assertEqual(result['members'], [])
        self.assertTrue(result['liveError'])
        self.assertEqual((await data.get_roster('archive'))['source'], 'archive')

    async def test_failed_live_does_not_query_podium(self):
        data = provider()
        data.supabase = Mock()
        with patch.object(data, '_fetch_live_roster_sync', side_effect=RuntimeError('offline')), patch.object(data, '_fetch_live_podium_sync') as podium:
            result = await data.get_podium('live', refresh=True)
        podium.assert_not_called()
        self.assertEqual(result['source'], 'live')
        self.assertTrue(all(not entries for entries in result['categories'].values()))

    async def test_refresh_roster_then_podium_reads_tables_once(self):
        data = provider()
        data.supabase = Mock()
        data._live_roster_cache = (0, [])
        data._live_podium_cache = (0, ({}, []))
        rows = [{'id': 1, 'discordid': '1', 'username': 'Member', 'points': 2}]
        with patch.object(data, '_fetch_all_table_rows', side_effect=lambda table, **kw: rows if table == 'stats' else []) as tables, patch.object(data, '_fetch_live_podium_sync', return_value=({}, [])) as podium:
            await data.get_roster('live', refresh=True)
            self.assertIsNone(data._live_podium_cache)
            await data.get_podium('live')
        self.assertEqual(tables.call_count, 3)
        podium.assert_called_once()

    async def test_explicit_import_and_archive_preserve_source(self):
        data = provider()
        data.supabase = Mock()
        data.imported_roster = data.get_archive_members()
        with patch.object(data, '_fetch_live_roster_sync') as live:
            self.assertEqual((await data.get_roster('imported', refresh=True))['source'], 'imported')
            self.assertEqual((await data.get_roster('archive', refresh=True))['source'], 'archive')
        live.assert_not_called()


class PaginationTests(unittest.TestCase):
    def test_roster_contains_all_1205_rows(self):
        data = provider()
        rows = [{'id': n, 'discordid': str(n), 'username': f'Member{n}'} for n in range(1, 1206)]
        class Query:
            def __init__(self, table):
                self.rows = rows if table == 'stats' else []
            def select(self, *_): return self
            def order(self, *_): return self
            def range(self, start, end):
                self.batch = self.rows[start:end + 1]
                return self
            def execute(self): return SimpleNamespace(data=self.batch)
        data.supabase = SimpleNamespace(table=Query)
        roster = data._fetch_live_roster_sync()
        self.assertEqual(len(roster), 1205)
        self.assertEqual(len({m['discordId'] for m in roster}), 1205)


class AvatarTests(unittest.IsolatedAsyncioTestCase):
    async def test_success_and_miss_have_distinct_ttl(self):
        data = provider()
        lookup = AsyncMock(side_effect=['https://cdn.example/avatar.png', None, None])
        with patch.object(data, '_fetch_roblox_avatar', lookup), patch('data_provider.time.time', return_value=100):
            self.assertTrue(await data.resolve_roblox_avatar('Good'))
            self.assertIsNone(await data.resolve_roblox_avatar('Miss'))
        with patch.object(data, '_fetch_roblox_avatar', lookup), patch('data_provider.time.time', return_value=116):
            self.assertTrue(await data.resolve_roblox_avatar('good'))
            self.assertIsNone(await data.resolve_roblox_avatar('miss'))
        self.assertEqual(lookup.await_count, 3)
        with patch.object(data, '_fetch_roblox_avatar', AsyncMock(return_value=None)) as expired, patch('data_provider.time.time', return_value=1901):
            await data.resolve_roblox_avatar('good')
        expired.assert_awaited_once()

    async def test_concurrent_names_share_work_and_limit_network_to_four(self):
        data = provider()
        active = maximum = calls = 0
        async def lookup(name):
            nonlocal active, maximum, calls
            calls += 1
            active += 1
            maximum = max(maximum, active)
            await asyncio.sleep(0.01)
            active -= 1
            return f'https://cdn.example/{name}.png'
        with patch.object(data, '_fetch_roblox_avatar', lookup):
            results = await asyncio.gather(*(data.resolve_roblox_avatar(name) for name in ['Same', 'same'] + [f'user{n}' for n in range(9)]))
        self.assertEqual(results[0], results[1])
        self.assertEqual(calls, 10)
        self.assertEqual(maximum, 4)
        self.assertEqual(data._avatar_pending, {})


    async def test_cancelled_waiter_does_not_cancel_shared_lookup(self):
        data = provider()
        started, release = asyncio.Event(), asyncio.Event()
        async def lookup(name):
            started.set()
            await release.wait()
            return 'https://cdn.example/avatar.png'
        with patch.object(data, '_fetch_roblox_avatar', lookup):
            first = asyncio.create_task(data.resolve_roblox_avatar('Member'))
            await started.wait()
            second = asyncio.create_task(data.resolve_roblox_avatar('member'))
            first.cancel()
            with self.assertRaises(asyncio.CancelledError):
                await first
            release.set()
            self.assertEqual(await second, 'https://cdn.example/avatar.png')
        self.assertEqual(data._avatar_pending, {})

    async def test_thumbnail_requires_completed_https_and_retries_pending(self):
        class Response:
            status = 200
            def __init__(self, payload, status=200):
                self.payload = payload
                self.status = status
            async def __aenter__(self): return self
            async def __aexit__(self, *_): pass
            async def json(self): return self.payload
        class Session:
            def __init__(self, thumbnails): self.thumbnails = iter(thumbnails)
            async def __aenter__(self): return self
            async def __aexit__(self, *_): pass
            def post(self, *args, **kwargs): return Response({'data': [{'id': 123}]})
            def get(self, *args, **kwargs):
                thumbnail = next(self.thumbnails)
                return Response({'data': [thumbnail]}, thumbnail.get('_status', 200))
        data = provider()
        cases = [
            ([{'state': 'Completed', 'imageUrl': 'https://cdn.example/a.png'}], 'https://cdn.example/a.png'),
            ([{'state': 'Completed', 'imageUrl': 'http://cdn.example/a.png'}], None),
            ([{'state': 'Blocked', 'imageUrl': 'https://cdn.example/a.png'}], None),
            ([{'state': 'Pending'}, {'state': 'Completed', 'imageUrl': 'https://cdn.example/b.png'}], 'https://cdn.example/b.png'),
            ([{'state': 'Pending'}, {'state': 'Pending'}], None),
            ([{'_status': 429}, {'state': 'Completed', 'imageUrl': 'https://cdn.example/c.png'}], 'https://cdn.example/c.png'),
            ([{'_status': 429}, {'_status': 429}], None),
        ]
        for thumbnails, expected in cases:
            with self.subTest(thumbnails=thumbnails), patch('data_provider.aiohttp.ClientSession', return_value=Session(thumbnails)), patch('data_provider.asyncio.sleep', new_callable=AsyncMock):
                self.assertEqual(await data._fetch_roblox_avatar('Member'), expected)


class ApiTests(unittest.IsolatedAsyncioTestCase):
    async def test_roster_refresh_and_avatar_route_contracts(self):
        from aiohttp.test_utils import TestClient, TestServer
        from server import create_app
        data = provider()
        async with TestClient(TestServer(create_app(data))) as client:
            with patch.object(data, 'get_roster', new_callable=AsyncMock, return_value={'source': 'live', 'members': [], 'totals': {}, 'liveError': None}) as roster:
                response = await client.get('/api/roster?source=live&refresh=1')
                self.assertEqual(response.status, 200)
                self.assertEqual((await response.json())['source'], 'live')
                roster.assert_awaited_once_with(source='live', refresh=True)
            with patch.object(data, 'resolve_roblox_avatar', new_callable=AsyncMock, return_value='https://cdn.example/a.png') as avatar:
                response = await client.get('/api/avatar/Member')
                self.assertEqual(await response.json(), {'username': 'Member', 'url': 'https://cdn.example/a.png'})
                avatar.assert_awaited_once_with('Member')


if __name__ == '__main__':
    unittest.main()

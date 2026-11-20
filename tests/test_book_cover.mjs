// Render the actual cover offline with the project's existing React/esbuild packages.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const require = createRequire(new URL('../web/package.json', import.meta.url))
const { build } = require('esbuild')
const result = await build({
  stdin: {
    contents: `
      import assert from 'node:assert/strict'
      import { createElement } from 'react'
      import { renderToStaticMarkup } from 'react-dom/server'
      import { BookCover } from './src/components/BookCover'
      const base = {
        status: { liveConnected: true, hasImported: true }, memberCount: 1177,
        activeSource: 'live', loading: false, liveError: null, muted: true,
        onToggleMute() {}, onOpenBook() {},
      }
      const render = (props) => renderToStaticMarkup(createElement(BookCover, { ...base, ...props }))
      const failed = render({status: { liveConnected: false, liveConfigured: true, hasImported: true }, memberCount: 0, liveError: 'Unable to read live ledger.'})
      assert.match(failed, /Live Supabase · Unavailable/)
      assert.match(failed, /role="alert"[^>]*>Unable to read live ledger\./)
      assert.doesNotMatch(failed, /Sample Archive ·|Imported CSV ·|0 Files/)
      const archive = render({activeSource: 'archive', memberCount: 14, liveError: 'Earlier live error'})
      assert.match(archive, /Sample Archive · 14 Files/)
      assert.doesNotMatch(archive, /Live Supabase ·|role="alert"/)
      assert.match(render({activeSource: 'imported', memberCount: 8}), /Imported CSV · 8 Files/)
      assert.match(render({}), /Live Supabase · 1177 Files/)
      const loading = render({loading: true, memberCount: 0})
      assert.match(loading, /Live Supabase · Loading…/)
      assert.doesNotMatch(loading, /0 Files/)
      const startup = render({activeSource: null, loading: true, memberCount: 0})
      assert.match(startup, /Loading ledger…/)
      assert.doesNotMatch(startup, /Sample Archive ·|0 Files/)
      console.log('6 offline BookCover render cases passed: live failure/error, selected archive, imported, live success, live loading, startup loading.')
    `,
    resolveDir: fileURLToPath(new URL('../web', import.meta.url)),
    loader: 'tsx',
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  jsx: 'automatic',
  write: false,
})
assert.equal(result.outputFiles.length, 1)
const Module = require('node:module')
const compiled = new Module('book-cover-render-test')
compiled._compile(result.outputFiles[0].text, 'book-cover-render-test.cjs')

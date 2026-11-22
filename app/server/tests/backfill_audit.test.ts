import assert from 'node:assert/strict'
import test from 'node:test'
import { parseAuditArgs, topLargest } from '../lib/backfillAudit.js'
test('defaults to dry run and parses a limit', () => assert.deepEqual(parseAuditArgs(['--limit=3']), { dryRun: true, limit: 3 }))
test('sorts largest assets first', () => assert.deepEqual(topLargest([{ url: 'a', source: 'x', bytes: 1 }, { url: 'b', source: 'x', bytes: 5 }]).map((a) => a.url), ['b', 'a']))

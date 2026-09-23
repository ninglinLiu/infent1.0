import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { loadEnvConfig } from '@next/env'
import cases from '../eval/cases.json'
import { retrieve, formatContext } from '../lib/ai/retrieve'
import { refusalReason, refusalText } from '../lib/ai/policy'
import { getChatConfig, getRequestTimeoutMs } from '../lib/ai/config'
import { buildSystemPrompt } from '../lib/ai/system-prompt'
import { runAgent } from '../lib/ai/agent'

async function main() {
  const live = process.argv.includes('--live')
  // Offline mode deliberately ignores credentials: reproducible and no paid calls.
  if (live) {
    const envArg = process.argv.indexOf('--env-dir')
    loadEnvConfig(envArg >= 0 ? process.argv[envArg + 1] : process.cwd(), false, { info() {}, error() {} })
  }
  else { delete process.env.EMBEDDING_API_KEY; delete process.env.OPENAI_API_KEY }
  const config = live ? getChatConfig() : null
  if (live && !config) throw new Error('eval:live requires a configured server-side model key.')
  const rows = []
  for (const item of cases) {
    const reason = refusalReason(item.question)
    const { hits } = reason ? { hits: [] } : await retrieve(item.question)
    const docs = [...new Set(hits.map(h => h.chunk.id.slice(0, 2)))]
    const referenceHit = item.expectedDocuments.every(doc => docs.includes(doc))
    const negativeClean = item.expectedDocuments.length > 0 || docs.length === 0
    const refusalCorrect = Boolean(reason) === item.shouldRefuse
    let answer = '', modelError = false
    if (live) {
      if (reason) answer = refusalText(reason, /[\u4e00-\u9fff]/.test(item.question) ? 'zh' : 'en')
      else try {
        const result = await runAgent([
          { role: 'system', content: buildSystemPrompt({ lang: /[\u4e00-\u9fff]/.test(item.question) ? 'zh' : 'en', context: formatContext(hits) }) },
          { role: 'user', content: item.question },
        ], { config: config!, signal: AbortSignal.timeout(getRequestTimeoutMs()), onText() {} })
        answer = result.answer
      } catch { modelError = true }
    }
    // Textual citation check only; correctness/entailment still needs human review.
    const citationHit = !live || !item.expectedCitationTerms.length || item.expectedCitationTerms.some(term => answer.includes(term))
    const pass = referenceHit && negativeClean && refusalCorrect && citationHit && !modelError
    rows.push({ ...item, retrievedDocuments: docs, referenceHit, negativeClean, refusalCorrect, citationHit: live ? citationHit : null, modelError, pass, ...(live ? { answer } : {}) })
    console.log(`${pass ? 'PASS' : 'FAIL'} ${item.id} docs=${docs.join(',') || '-'} refusal=${Boolean(reason)}`)
  }
  const positives = rows.filter(r => r.expectedDocuments.length)
  const negatives = rows.filter(r => !r.expectedDocuments.length)
  const rate = (n: number, d: number) => `${n}/${d} (${(100 * n / d).toFixed(1)}%)`
  const summary = {
    mode: live ? 'live-model + retrieval + deterministic refusal policy' : 'offline retrieval + deterministic refusal policy (no model calls)',
    model: config?.model ?? null,
    referenceHitRate: rate(positives.filter(r => r.referenceHit).length, positives.length),
    negativeNoReferenceRate: rate(negatives.filter(r => r.negativeClean).length, negatives.length),
    refusalRoutingAccuracy: rate(rows.filter(r => r.refusalCorrect).length, rows.length),
    modelCitationMentionRate: live ? rate(positives.filter(r => r.citationHit && !r.modelError).length, positives.length) : null,
    passed: rows.filter(r => r.pass).length, total: rows.length,
  }
  const report = { generatedAt: new Date().toISOString(), summary, rows }
  const dir = path.join(process.cwd(), 'eval/results')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, live ? 'live.json' : 'offline.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(summary, null, 2))
  if (rows.some(r => !r.pass)) process.exitCode = 1
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })

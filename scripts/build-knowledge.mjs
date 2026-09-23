#!/usr/bin/env node
/**
 * 把 content/knowledge/*.md 切块，输出 lib/ai/knowledge-index.generated.json
 *
 * 两种模式：
 *   node scripts/build-knowledge.mjs            只切块，不需要任何 API key
 *   node scripts/build-knowledge.mjs --embed    额外计算向量（需要 EMBEDDING_API_KEY）
 *
 * 为什么不用向量数据库：知识库只有几篇文档、几十个 chunk，
 * 构建时预计算 + 运行时内存内计算相似度就够了，零基础设施、零月费，
 * Vercel 无状态部署也能跑。只有 chunk 数上千时才值得换成专门的向量库。
 *
 * --embed 带内容哈希缓存：已经算过的 chunk 不会重复调用 API。
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC_DIR = path.join(ROOT, 'content', 'knowledge')
const OUT_FILE = path.join(ROOT, 'lib', 'ai', 'knowledge-index.generated.json')
const CACHE_FILE = path.join(ROOT, 'scripts', '.embedding-cache.json')

const WANT_EMBED = process.argv.includes('--embed')

const MIN_CHARS = 200
const MAX_CHARS = 700

/** 读 .env.local（不引入 dotenv 依赖） */
function loadEnvLocal() {
  const p = path.join(ROOT, '.env.local')
  if (!fs.existsSync(p)) return
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    const [, k, vRaw] = m
    if (process.env[k]) continue
    process.env[k] = vRaw.replace(/^["']|["']$/g, '')
  }
}

/**
 * 按 markdown 标题切块。保留文档名与标题路径作为元数据，
 * 这样检索命中时可以告诉用户来源是哪一篇的哪一节。
 */
function chunkMarkdown(docName, raw) {
  // 必须先归一化行尾：Windows 的 CRLF 会在每行末尾留下 \r，
  // 而 \r 是行终止符，会让 /^#\s+(.*)$/ 这类标题正则匹配失败。
  const lines = raw.replace(/\r\n?/g, '\n').split('\n')
  let h1 = docName
  let h2 = ''
  let buf = []
  const out = []

  const flush = () => {
    const text = buf.join('\n').trim()
    buf = []
    if (text.length < 40) return
    // 过长的段落再按空行二次切分
    if (text.length <= MAX_CHARS) {
      out.push({ h1, h2, text })
      return
    }
    let acc = ''
    for (const para of text.split(/\n\s*\n/)) {
      if (acc && (acc + '\n\n' + para).length > MAX_CHARS) {
        out.push({ h1, h2, text: acc.trim() })
        acc = para
      } else {
        acc = acc ? acc + '\n\n' + para : para
      }
    }
    if (acc.trim().length >= 40) out.push({ h1, h2, text: acc.trim() })
  }

  for (const line of lines) {
    const m1 = line.match(/^#\s+(.*)$/)
    const m2 = line.match(/^##+\s+(.*)$/)
    if (m1) {
      flush()
      h1 = m1[1].trim()
      h2 = ''
      continue
    }
    if (m2) {
      flush()
      h2 = m2[1].trim()
      continue
    }
    buf.push(line)
  }
  flush()

  // 合并过短的相邻 chunk，避免检索到没有信息量的碎片
  const merged = []
  for (const c of out) {
    const prev = merged[merged.length - 1]
    if (prev && prev.h1 === c.h1 && prev.h2 === c.h2 && prev.text.length < MIN_CHARS) {
      prev.text = prev.text + '\n\n' + c.text
    } else {
      merged.push({ ...c })
    }
  }
  return merged
}

async function embedBatch(texts, cfg, cache) {
  const results = []
  for (const text of texts) {
    const key = crypto.createHash('sha256').update(cfg.model + '|' + text).digest('hex')
    if (cache[key]) {
      results.push(cache[key])
      continue
    }
    const res = await fetch(`${cfg.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ model: cfg.model, input: text }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`embedding 接口返回 ${res.status}: ${body.slice(0, 300)}`)
    }
    const json = await res.json()
    const vec = json?.data?.[0]?.embedding
    if (!Array.isArray(vec)) throw new Error('embedding 响应结构异常')
    cache[key] = vec
    results.push(vec)
    process.stdout.write('.')
    await new Promise((r) => setTimeout(r, 120))
  }
  return results
}

async function main() {
  loadEnvLocal()

  if (!fs.existsSync(SRC_DIR)) {
    console.error(`找不到知识库目录：${SRC_DIR}`)
    process.exit(1)
  }

  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.md')).sort()
  if (files.length === 0) {
    console.error('知识库目录里没有 .md 文件')
    process.exit(1)
  }

  const chunks = []
  for (const f of files) {
    const raw = fs.readFileSync(path.join(SRC_DIR, f), 'utf8')
    const docName = f.replace(/^\d+-/, '').replace(/\.md$/, '')
    const pieces = chunkMarkdown(docName, raw)
    pieces.forEach((p, i) => {
      chunks.push({
        id: `${f.replace(/\.md$/, '')}#${i}`,
        doc: p.h1 || docName,
        section: p.h2 || '',
        text: p.text,
      })
    })
    console.log(`  ${f} -> ${pieces.length} chunk`)
  }

  console.log(`\n共 ${chunks.length} 个 chunk，来自 ${files.length} 篇文档`)

  let embedded = false
  if (WANT_EMBED) {
    const apiKey = process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY || ''
    if (!apiKey) {
      console.warn('\n--embed 需要 EMBEDDING_API_KEY 或 OPENAI_API_KEY，未检测到，跳过向量计算。')
      console.warn('（不影响使用：运行时会降级为词法检索）')
    } else {
      const cfg = {
        baseUrl: (process.env.EMBEDDING_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
        apiKey,
        model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
      }
      const cache = fs.existsSync(CACHE_FILE)
        ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
        : {}
      console.log(`\n计算向量（模型 ${cfg.model}，带内容哈希缓存）`)
      const vecs = await embedBatch(chunks.map((c) => `${c.doc} ${c.section}\n${c.text}`), cfg, cache)
      vecs.forEach((v, i) => { chunks[i].embedding = v })
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf8')
      embedded = true
      console.log('\n向量计算完成')
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    embedded,
    embeddingModel: embedded ? (process.env.EMBEDDING_MODEL || 'text-embedding-3-small') : null,
    chunks,
  }
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, embedded ? 0 : 2), 'utf8')

  const kb = (fs.statSync(OUT_FILE).size / 1024).toFixed(0)
  console.log(`\n已写入 ${path.relative(ROOT, OUT_FILE)}（${kb} KB，embedded=${embedded}）`)
  if (!embedded) {
    console.log('提示：运行时将使用词法检索。想启用向量检索，配好 EMBEDDING_API_KEY 后加 --embed 重跑。')
  }
}

main().catch((e) => {
  console.error('\n构建失败：', e.message)
  process.exit(1)
})

'use client'
import type { ToolTrace } from '@/lib/ai/tools'
import { useLang } from '@/lib/i18n'

export function ToolEvidence({ tools = [] }: { tools?: ToolTrace[] }) {
  const { lang } = useLang()
  if (!tools.length) return null
  return <div className="space-y-2 pt-2" aria-label={lang === 'zh' ? '数据查询记录' : 'Data queries'}>
    {tools.map((tool, i) => <details key={`${tool.id}-${i}`} className="rounded-md border border-[var(--line-2)] bg-[var(--bg-1)] p-2 text-[11px]">
      <summary className="cursor-pointer break-words text-dim">
        {tool.result.ok ? '✓' : '!'} {tool.name === 'get_price' ? (lang === 'zh' ? '行情查询' : 'Price lookup') : (lang === 'zh' ? '以太坊账户查询' : 'Ethereum account')}
        {' · '}{tool.result.ok ? tool.result.source : tool.result.code}{' · '}{tool.durationMs} ms
      </summary>
      <pre className="mt-2 whitespace-pre-wrap break-all text-ghost">{JSON.stringify(tool.result, null, 2)}</pre>
    </details>)}
  </div>
}

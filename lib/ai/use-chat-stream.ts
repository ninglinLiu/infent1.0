'use client'

/**
 * 极简流式对话 hook。
 *
 * 为什么手写而不用现成的 useChat：我们的两个界面都有自己的消息结构与动画
 * （首页气泡、dashboard 的策略卡 + 逐段揭示），
 * 套用别人的消息模型反而要改一堆 UI。这个 hook 只负责「发请求 + 逐字回调」，
 * 消息状态留给各自的组件管。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { splitMeta, type ChatMeta } from './protocol'

export type WireMessage = { role: 'user' | 'assistant'; content: string }

export type StreamCallbacks = {
  /** 每次收到新内容时回调，text 是到目前为止的完整正文 */
  onText: (text: string) => void
  /** 流结束时回调，带服务端返回的元数据 */
  onDone: (text: string, meta: ChatMeta | null) => void
  onError?: (message: string) => void
}

export function useChatStream() {
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  useEffect(() => () => abortRef.current?.abort(), [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)
  }, [])

  const send = useCallback(
    async (
      messages: WireMessage[],
      opts: { lang?: 'zh' | 'en'; surface?: string } & StreamCallbacks
    ) => {
      const { onText, onDone, onError, lang = 'zh', surface } = opts

      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setStreaming(true)

      let raw = ''
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Keep complete recent turns with room for the latest user message.
          body: JSON.stringify({ messages: messages.filter(m => m.content.trim()).slice(-23).map(m => ({ ...m, content: m.content.slice(0, 4000) })), lang, surface }),
          signal: ctrl.signal,
        })

        if (!res.ok || !res.body) {
          const msg =
            res.status === 429
              ? lang === 'en'
                ? 'Too many requests. Please wait a moment.'
                : '请求太频繁，请稍等一下再问。'
              : lang === 'en'
                ? 'The assistant is unavailable right now.'
                : '助手暂时不可用，请稍后重试。'
          onError?.(msg)
          onDone(msg, null)
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          raw += decoder.decode(value, { stream: true })
          // 元数据一定在最后，流中途只把分隔符之前的部分当正文
          onText(splitMeta(raw).text)
        }

        raw += decoder.decode()
        const { text, meta } = splitMeta(raw)
        onDone(text, meta)
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') {
          onDone(splitMeta(raw).text || (lang === 'en' ? 'Generation stopped.' : '已停止生成。'), null)
          return
        }
        const msg =
          lang === 'en'
            ? 'Network error while contacting the assistant.'
            : '连接助手时出现网络错误。'
        onError?.(msg)
        onDone(splitMeta(raw).text || msg, null)
      } finally {
        if (abortRef.current === ctrl) {
          abortRef.current = null
          setStreaming(false)
        }
      }
    },
    []
  )

  return { send, stop, streaming }
}

/** 把流式正文切成段落，供逐段渲染的组件使用。 */
export function toParagraphs(text: string): string[] {
  const parts = text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts : ['']
}

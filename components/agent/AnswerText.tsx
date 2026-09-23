/** React escapes all model output; only **bold** is interpreted, never HTML. */
export function AnswerText({ text }: { text: string }) {
  return <div className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-[var(--fg-1)]">
    {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold text-[var(--fg-0)]">{part.slice(2, -2)}</strong>
      : part)}
  </div>
}

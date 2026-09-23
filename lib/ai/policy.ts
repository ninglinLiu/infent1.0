// A small, explicit boundary layer, not a general semantic classifier.
// Unknown finance questions are left to the model's system prompt.
export function refusalReason(question: string): 'guarantee' | 'fabrication' | 'out_of_scope' | null {
  if (/保证.{0,12}(收益|盈利|翻倍)|稳赚|保本保收益|guarantee.{0,20}(return|profit)|risk.free profit/i.test(question)) return 'guarantee'
  if (/(编造|虚构|捏造).{0,16}(收益|市盈率|数据|价格)|fabricate.{0,20}(price|return|ratio)|invent.{0,20}(price|ticker|ratio)/i.test(question)) return 'fabrication'
  if (/天气|菜谱|做饭|笑话|写.{0,4}(情书|诗)|weather|recipe|tell me a joke|write.{0,10}(poem|love letter)/i.test(question)) return 'out_of_scope'
  return null
}

export function refusalText(reason: NonNullable<ReturnType<typeof refusalReason>>, lang: 'zh' | 'en') {
  const text = {
    guarantee: ['我不能保证收益或提供稳赚方案。可以一起研究风险预算、回撤和验证方法。', 'I cannot guarantee returns or offer risk-free profits. I can help evaluate risk budgets, drawdowns and validation methods.'],
    fabrication: ['我不能编造行情、估值或收益数据。可以查询支持的真实数据，或说明当前缺少哪些证据。', 'I cannot fabricate prices, valuations or returns. I can query supported sources or explain which evidence is missing.'],
    out_of_scope: ['我是投资研究助手，这个问题不在当前范围内。可以问我回测、风险、成本或行情。', 'I focus on investment research and cannot help with that request here. Ask me about backtesting, risk, costs or market data.'],
  }
  return text[reason][lang === 'en' ? 1 : 0]
}

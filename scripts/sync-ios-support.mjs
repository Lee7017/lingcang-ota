import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

/*
 * 仅在 GitHub Actions 服务器端查询爱发电。
 * 绝不保存原始 API 响应、订单号、手机号、留言或私有用户 ID。
 * 暂仅按独立赞助方案 AFDIAN_PLAN_ID 统计；未设置方案 ID 时不启动统计。
 */
const file = new URL('../support/ios.json', import.meta.url)
const userId = process.env.AFDIAN_USER_ID?.trim()
const token = process.env.AFDIAN_API_TOKEN?.trim()
const planId = process.env.AFDIAN_PLAN_ID?.trim()
const publicUrl = process.env.AFDIAN_SUPPORT_URL?.trim() || null
const MAX_PAGES = 200

function validSupportUrl(value) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !['afdian.com','www.afdian.com','afdian.net','www.afdian.net'].includes(url.hostname)) {
      throw new Error('AFDIAN_SUPPORT_URL 域名不合法')
    }
    return url.href
  } catch {
    throw new Error('AFDIAN_SUPPORT_URL 必须是爱发电 HTTPS 链接')
  }
}

function cents(value) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d{0,8})(\.\d{1,2})?$/.test(value)) throw new Error('订单金额格式不符合预期')
  const parts = value.split('.')
  return Number(parts[0]) * 100 + Number((parts[1] || '').padEnd(2, '0'))
}

async function queryPage(page) {
  const params = JSON.stringify({ page })
  const ts = Math.floor(Date.now() / 1000)
  // 爱发电官方 API 规定的签名算法（不是用户身份信息）。
  const sign = createHash('md5').update(token + 'params' + params + 'ts' + ts + 'user_id' + userId).digest('hex')
  const abort = AbortSignal.timeout(20000)
  const response = await fetch('https://afdian.net/api/open/query-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id:userId, params, ts, sign }),
    signal: abort
  })
  if (!response.ok) throw new Error('爱发电 API 网络异常，状态 ' + response.status)
  const json = await response.json()
  if (json.ec !== 200 || !Array.isArray(json.data?.list)) throw new Error('爱发电 API 返回异常')
  return json.data
}

async function main() {
  if (!userId || !token || !planId) {
    console.log('未配置 AFDIAN_USER_ID / AFDIAN_API_TOKEN / AFDIAN_PLAN_ID，保持未接入状态。')
    return
  }
  const previous = JSON.parse(await readFile(file, 'utf8'))
  const url = validSupportUrl(publicUrl)
  const seen = new Set()
  const supporterIds = new Set()
  let sum = 0
  let pages = 0
  let totalPages = 1
  do {
    pages++
    const data = await queryPage(pages)
    if (data.total_page !== undefined) {
      if (!Number.isSafeInteger(data.total_page) || data.total_page < 0) throw new Error('API 分页信息异常')
      totalPages = data.total_page
    } else {
      totalPages = data.list.length === 50 ? pages + 1 : pages
    }
    for (const order of data.list) {
      if (String(order.plan_id || '') !== planId || Number(order.status) !== 2) continue
      if (!order.out_trade_no || !order.user_id) throw new Error('订单缺少必要字段')
      if (seen.has(order.out_trade_no)) continue
      const paid = cents(order.total_amount)
      seen.add(order.out_trade_no)
      sum += paid
      if (paid > 0) supporterIds.add(order.user_id)
    }
    if (pages >= MAX_PAGES && pages < totalPages) throw new Error('订单超过最大分页数，拒绝发布不完整统计')
  } while (pages < totalPages)
  if (!Number.isSafeInteger(sum)) throw new Error('累计金额超出安全范围')

  const next = {
    status:'live',
    target: previous.target,
    raised: sum / 100,
    supporterCount: supporterIds.size,
    syncedAt: new Date().toISOString(),
    supportUrl: url,
    // 仅由明确授权的独立机制提供名单；不会从原始订单自动公开姓名与个人金额。
    supporters: Array.isArray(previous.supporters) ? previous.supporters : []
  }
  const oldAge = previous.syncedAt ? Date.now() - Date.parse(previous.syncedAt) : Infinity
  const needsPublish = previous.status !== next.status || previous.target !== next.target ||
    JSON.stringify(previous.supporters) !== JSON.stringify(next.supporters) ||
    previous.raised !== next.raised ||
    previous.supporterCount !== next.supporterCount || previous.supportUrl !== next.supportUrl ||
    !Number.isFinite(oldAge) || oldAge >= 60 * 60 * 1000
  if (!needsPublish) { console.log('同步成功，统计未变，不需要提交新数据。'); return }
  await writeFile(file, JSON.stringify(next, null, 2) + '\n')
  console.log('已生成不含个人订单信息的统计文件。')
}
main().catch(error => {
  console.error('赞助统计同步失败：' + error.message)
  process.exitCode = 1
})

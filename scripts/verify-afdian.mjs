import { createHash } from 'node:crypto'

/*
 * 只在手动运行或修改同步代码时执行的诊断。
 * 验证身份和查订单权限，不打印、存储订单、用户 ID、Token 或 API 原始响应。
 * 不修改 support/ios.json；真正的统计仍由 sync-ios-support.mjs 负责。
 */
const userId = process.env.AFDIAN_USER_ID?.trim()
const token = process.env.AFDIAN_API_TOKEN?.trim()
const planId = process.env.AFDIAN_PLAN_ID?.trim()

if (!userId || !token) {
  console.error('爱发电验证无法开始：缺少 ' + [!userId && 'AFDIAN_USER_ID', !token && 'AFDIAN_API_TOKEN'].filter(Boolean).join('、'))
  process.exit(1)
}

async function request(baseUrl, endpoint, params) {
  const rawParams = JSON.stringify(params)
  const ts = Math.floor(Date.now() / 1000)
  const sign = createHash('md5')
    .update(token + 'params' + rawParams + 'ts' + ts + 'user_id' + userId)
    .digest('hex')
  let response
  try {
    response = await fetch(baseUrl + '/api/open/' + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, params: rawParams, ts, sign }),
    signal: AbortSignal.timeout(15000)
    })
  } catch (error) {
    const code = typeof error?.cause?.code === 'string' ? error.cause.code : error?.name || 'NETWORK_ERROR'
    throw Object.assign(new Error(endpoint + ' 网络连接失败：' + code), { kind: 'network' })
  }
  if (!response.ok) throw new Error(endpoint + ' 网络响应 HTTP ' + response.status)
  const data = await response.json()
  if (data?.ec !== 200) {
    // 爱发电的错误响应可能携带签名调试信息，因此只公开错误码。
    const code = Number.isSafeInteger(data?.ec) ? data.ec : '未知'
    throw new Error(endpoint + ' 验证失败，错误码 ' + code)
  }
  return data
}

try {
  let usableBase = null
  // 两个均为爱发电的公开域名；只在网络失败时切换，不绕过签名错误。
  for (const base of ['https://afdian.com', 'https://afdian.net']) {
    try {
      await request(base, 'ping', { a: 333 })
      usableBase = base
      console.log('爱发电 ping 验证成功；可用接口域名：' + new URL(base).hostname)
      break
    } catch (error) {
      if (error.kind !== 'network') throw error
      console.warn(new URL(base).hostname + '：' + error.message)
    }
  }
  if (!usableBase) throw new Error('两个爱发电接口域名均无法连接，尚未验证 Token。')
  const result = await request(usableBase, 'query-order', { page: 1 })
  if (!Array.isArray(result.data?.list)) throw new Error('query-order 返回内容缺少订单列表')
  const list = result.data.list
  const totalPages = result.data.total_page
  if (totalPages !== undefined && (!Number.isSafeInteger(totalPages) || totalPages < 0)) {
    throw new Error('query-order 分页字段异常')
  }
  console.log('query-order 可用；第一页订单数：' + list.length +
    '；分页数：' + (totalPages ?? '未知') + '。不公开订单内容。')
  if (!planId) {
    console.log('尚未设置 AFDIAN_PLAN_ID：当前仅验证接口，不会将订单混入 iOS 筹款统计。')
    // 商品页面 ID 不保证等同于方案 ID，通过已认证的接口验证后才能采用。
    const itemId = 'd9aa8642e2b411f181af52540025c377'
    try {
      const planResult = await request(usableBase, 'query-plan', { plan_id: itemId })
      console.log('商品链接 ID 是否为有效方案 ID：' +
        (planResult.data?.plan?.plan_id === itemId ? '是' : '未确认'))
    } catch (error) {
      console.log('商品链接 ID 暂不能证实为方案 ID（只读接口失败）：' + error.message)
    }
  } else {
    console.log('AFDIAN_PLAN_ID 已配置；第一页是否出现匹配订单：' +
      list.some(o => String(o?.plan_id ?? '') === planId) + '（仅供参考，不能代表全部分页）。')
  }
} catch (error) {
  console.error('爱发电只读校验失败：' + error.message)
  process.exitCode = 1
}

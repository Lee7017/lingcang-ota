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

async function request(endpoint, params) {
  const rawParams = JSON.stringify(params)
  const ts = Math.floor(Date.now() / 1000)
  const sign = createHash('md5')
    .update(token + 'params' + rawParams + 'ts' + ts + 'user_id' + userId)
    .digest('hex')
  const response = await fetch('https://afdian.net/api/open/' + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, params: rawParams, ts, sign }),
    signal: AbortSignal.timeout(20000)
  })
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
  await request('ping', {})
  console.log('爱发电 ping 验证成功，签名和身份有效。')
  const result = await request('query-order', { page: 1 })
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
  } else {
    console.log('AFDIAN_PLAN_ID 已配置；第一页是否出现匹配订单：' +
      list.some(o => String(o?.plan_id ?? '') === planId) + '（仅供参考，不能代表全部分页）。')
  }
} catch (error) {
  console.error('爱发电只读校验失败：' + error.message)
  process.exitCode = 1
}

import { pathToFileURL } from 'node:url'
import { API_BASE_URL, validateApiResponse } from '../src/utils/apiContract.mjs'

// Anonymous GET only. This is a compatibility gate, not production acceptance.
export async function checkBackendContract(fetcher = fetch) {
  const checks = []
  for (const path of ['/template-types', '/templates']) {
    const check = { path, passed: false }
    try {
      const response = await fetcher(API_BASE_URL + path, {
        method: 'GET', redirect: 'error', signal: AbortSignal.timeout(15000),
        headers: { Accept: 'application/json' },
      })
      check.httpStatus = response.status
      check.contentType = response.headers.get('content-type') || ''
      const body = validateApiResponse(response.status, await response.text(), path)
      check.count = body[path === '/template-types' ? 'template_types' : 'templates'].length
      check.passed = true
    } catch (error) {
      check.error = error.message
    }
    checks.push(check)
    // Do not continue probing when the server requests backoff or denies access.
    if ([401, 403, 429].includes(check.httpStatus)) break
  }
  return { apiBaseUrl: API_BASE_URL, checkedAt: new Date().toISOString(),
    passed: checks.length === 2 && checks.every(item => item.passed), checks }
}

export async function requireBackendContract() {
  const report = await checkBackendContract()
  console.log(JSON.stringify(report, null, 2))
  if (!report.passed) throw new Error('后台接口不匹配，已阻止预览上传。未启动开发者工具，未上传代码。')
  return report
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await checkBackendContract()
  console.log(JSON.stringify(report, null, 2))
  process.exitCode = report.passed ? 0 : 1
}

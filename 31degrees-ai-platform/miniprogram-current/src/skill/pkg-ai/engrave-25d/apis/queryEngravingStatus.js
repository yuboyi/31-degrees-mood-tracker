// 查询失败与无记录分开报告；指定订单只读取该订单的鉴权详情。
const { request } = require('./_request')

function statusText(status, isTask) {
  const common = { pending: '待处理', queued: '排队中', processing: '处理中',
    running: '处理中', failed: '失败', error: '失败', cancelled: '已取消',
    canceled: '已取消', ready: '文件就绪，待设备接收', sent: '已发送设备',
    printed: '系统记录加工完成，待交付确认', awaiting_quote: '待报价',
    awaiting_payment: '待付款' }
  if (['completed', 'success', 'done'].includes(status)) {
    return isTask ? '文件处理完成，不代表实物加工完成' : '系统记录已完成，待交付确认'
  }
  return common[status] || '状态待核实'
}

function list(body, key) {
  const items = Array.isArray(body) ? body : body && body[key]
  if (!Array.isArray(items) || items.some(item => !item || typeof item !== 'object' || item.id == null)) {
    throw new Error('查询返回格式不匹配')
  }
  return items.map(item => ({ id: item.id, type: item.type || item.task_type || '',
    status: item.status || '', created_at: item.created_at || item.createdAt || '' }))
}

module.exports = async function queryEngravingStatus(args) {
  const orderId = args && args.orderId
  const exact = orderId !== undefined && orderId !== null && orderId !== ''
  try {
    let tasks = []
    let orders = []
    const unavailable = []
    if (exact) {
      if (!/^[1-9]\d*$/.test(String(orderId)) || !Number.isSafeInteger(Number(orderId))) {
        throw new Error('请输入有效的数字订单号')
      }
      const order = await request('/machine/order/' + orderId, {}, 'GET')
      if (!order || String(order.id) !== String(orderId)) throw new Error('订单返回结果不匹配')
      orders = list([order], 'orders')
    } else {
      try { tasks = list(await request('/processing/tasks', { limit: 10 }, 'GET'), 'tasks') }
      catch (_) { unavailable.push('加工任务') }
      try { orders = list(await request('/machine/orders', {}, 'GET'), 'orders') }
      catch (_) { unavailable.push('设备订单') }
      if (unavailable.length === 2) throw new Error('暂时无法读取任务和订单')
    }
    const parts = []
    if (unavailable.length) parts.push(unavailable.join('、') + '查询失败，以下仅为已成功查询的部分，不能据此判断没有订单')
    if (tasks.length) parts.push('文件处理任务：' + tasks.slice(0, 5).map(t => '#' + t.id + ' ' + statusText(t.status, true)).join('；'))
    if (orders.length) parts.push((exact ? '指定设备订单：' : '最近设备订单：') + orders.slice(0, 5).map(o => '#' + o.id + ' ' + statusText(o.status, false)).join('；'))
    if (!tasks.length && !orders.length && !unavailable.length) parts.push('本次未查到当前账号的文件处理任务或设备订单。')
    const result = { tasks, orders, partial: unavailable.length > 0, unavailable_sources: unavailable }
    return { isError: false, content: [{ type: 'text', text: parts.join('。') }],
      structuredContent: result,
      handoff: () => ({ query: 'from=ai&mode=orders', payload: result }),
      _meta: { ui: { pagePath: '/pages/orders/index' } } }
  } catch (_) {
    return { isError: true, content: [{ type: 'text', text: exact
      ? '未能核实该设备订单。请确认订单号、当前登录账号及网络；不能据此认定订单不存在或已完成。'
      : '暂时无法查询任务和订单。请检查登录与网络后重试；这不代表没有订单。' }] }
  }
}

/**
 * 31度 AI 小程序与微店商城之间的统一跳转配置。
 * 微店端的“对外链接”仍需在已登录后台完成保存，这里只负责本小程序侧入口。
 */
export const WEIDIAN_STORE = {
  appId: 'wx9b47660336d195c7',
  homePath: 'pages/index/index?from=31du_ai&entry=ai_home',
  displayName: '31度购物商城',
  fallbackLink: '#小程序://31度购物商城/IHIoJ7QoxvZmNXv=',
}

// User-supplied entry, not a verified published version identifier.
export const MINI_PROGRAM_ENTRY = {
  homePath: '/pages/index/index',
  shareLink: '#小程序://31度/vOurcZfSUhZPDng',
}

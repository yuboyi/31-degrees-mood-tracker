Component({
  data: {
    title: 'AI纪念币已生成',
    buttonText: '打开小程序复核打样',
    coin_url: '',
    imgError: false,
    materialText: '',
    coin_size_mm: 0,
    ringText: ''
  },
  lifetimes: {
    created() {
      const modelCtx = wx.modelContext.getContext(this)
      const viewCtx = wx.modelContext.getViewContext(this)
      modelCtx.on(wx.modelContext.NotificationType.Result, (data) => {
        const r = (data && data.result && data.result.structuredContent) || {}
        const materialMap = { gold: '金', silver: '银' }
        this.setData({
          ...r,
          title: 'AI纪念币已生成',
          buttonText: '打开小程序复核打样',
          materialText: materialMap[r.material] || r.material || '',
          coin_size_mm: r.coin_size_mm || 0,
          ringText: (r.ringTextTop || '') + (r.ringTextBottom ? ' · ' + r.ringTextBottom : ''),
          imgError: false
        })
        viewCtx.setRelatedPage({ query: 'from=ai&mode=coin' })
      })
    }
  },
  methods: {
    onImgLoad() {
      this.setData({ imgError: false })
    },
    onImgError() {
      this.setData({ imgError: true })
    },
    onOpen() {
      const viewCtx = wx.modelContext.getViewContext(this)
      viewCtx.updateModelContext({
        content: [{ type: 'text', text: '用户点击进入小程序查看纪念币并提交打样' }]
      })
    }
  }
})

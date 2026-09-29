Component({
  data: {
    title: '2.5D内雕方案已生成',
    buttonText: '打开小程序复核打样',
    previewUrl: '',
    imgLoaded: false,
    imgError: false,
    // 各接口返回字段（初始为空）
    material: '',
    sizeText: '',
    risk_score: null,
    grade: null,
    style: '',
    prompt: '',
    template: '',
    image_url: '',
    styled_url: '',
    depth_url: '',
    pod3d_url: '',
    bmp_url: '',
    z_gcode_url: '',
    stl_url: '',
    profile_url: '',
    optimize: false
  },
  lifetimes: {
    created() {
      const modelCtx = wx.modelContext.getContext(this)
      const viewCtx = wx.modelContext.getViewContext(this)
      modelCtx.on(wx.modelContext.NotificationType.Result, (data) => {
        const r = (data && data.result && data.result.structuredContent) || {}
        // 三种模式：photo(照片内雕) / text(文生2.5D) / booth(风格大片)
        const mode = r.mode || (r.styled_url ? 'booth' : (r.image_url ? 'text' : 'photo'))
        const titleMap = {
          photo: '2.5D内雕方案已生成',
          text: '文生2.5D已生成',
          booth: 'AI风格大片已生成'
        }
        this.setData({
          ...r,
          title: titleMap[mode] || '2.5D内雕方案已生成',
          buttonText: '打开小程序复核打样',
          previewUrl: r.pod3d_url || r.depth_url || '',
          imgLoaded: false,
          imgError: false
        })
        viewCtx.setRelatedPage({ query: 'from=ai&mode=' + mode })
      })
    }
  },
  methods: {
    onImgLoad() {
      this.setData({ imgLoaded: true, imgError: false })
    },
    onImgError() {
      this.setData({ imgLoaded: false, imgError: true })
    },
    onOpen() {
      const viewCtx = wx.modelContext.getViewContext(this)
      viewCtx.updateModelContext({
        content: [{ type: 'text', text: '用户点击进入小程序继续复核并提交打样' }]
      })
    }
  }
})

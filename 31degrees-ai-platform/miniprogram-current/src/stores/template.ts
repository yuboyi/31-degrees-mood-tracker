import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'

export interface Template {
  id: number
  name: string
  category: string
  preview_url: string
  overlay_url: string
  points_cost: number
  is_active: boolean
  is_hot?: boolean
  product_type?: string  // 'inkjet' | 'laser'
  width: number
  height: number
  tags: string[]
}

export const useTemplateStore = defineStore('template', () => {
  const templates = ref<Template[]>([])
  const categories = ref<string[]>([])
  const currentCategory = ref('全部')
  const loading = ref(false)

  const error = ref(false)
  let requestId = 0

  async function fetchTemplates(category?: string) {
    const currentRequest = ++requestId
    loading.value = true
    error.value = false
    templates.value = []
    try {
      const res = await api.template.list(category)
      if (currentRequest !== requestId) return
      if (!Array.isArray(res.templates)) throw new Error('模板接口返回格式不匹配')
      templates.value = res.templates.map(normalizeTemplateAssets)
      categories.value = Array.isArray(res.categories) ? res.categories : ['全部']
    } catch (e) {
      if (currentRequest !== requestId) return
      error.value = true
      templates.value = []
      categories.value = ['全部']
    } finally {
      if (currentRequest === requestId) loading.value = false
    }
  }

  function normalizeTemplateAssets(template: any): Template {
    return {
      ...template,
      preview_url: normalizeTemplateAsset(template.preview_url),
      overlay_url: normalizeTemplateAsset(template.overlay_url),
    }
  }

  function normalizeTemplateAsset(url: string) {
    if (!url) return ''
    // The backend catalog and the mini-program package share this path.
    if (url.startsWith('/static/')) return url
    return url
  }

  const filteredTemplates = computed(() => {
    if (currentCategory.value === '全部') return templates.value
    return templates.value.filter(t => t.category === currentCategory.value)
  })

  function setCategory(cat: string) {
    currentCategory.value = cat
  }

  return { templates, categories, currentCategory, loading, error, filteredTemplates, fetchTemplates, setCategory }
})

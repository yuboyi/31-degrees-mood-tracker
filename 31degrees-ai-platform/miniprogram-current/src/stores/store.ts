import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'

export interface StoreInfo {
  id: number
  name: string
  admin_user_id: number
  points_balance: number
  qrcode_url: string
}

export interface StoreMember {
  id: number
  store_id: number
  user_id: number
  bound_at: string
  expired_at: string | null
  is_expired: boolean
}

export const useAppStore = defineStore('store', () => {
  // 扫码入口信息
  const entryScene = ref('')          // 场景值
  const entryStoreId = ref<number>(0)  // 扫码来源门店ID
  const isScanEntry = computed(() => !!entryStoreId.value)

  // 门店绑定状态
  const currentStore = ref<StoreInfo | null>(null)
  const bindingExpired = ref(false)

  // 积分扣减模式: 'self' = 扣自己, 'store' = 扣门店
  const deductionMode = computed(() => {
    if (!isScanEntry.value) return 'self'
    if (bindingExpired.value || currentStore.value?.id !== entryStoreId.value) return 'self'
    return 'store'
  })

  function setScanEntry(storeId: number, scene: string) {
    entryStoreId.value = storeId
    entryScene.value = scene
  }

  async function checkBinding(storeId: number) {
    try {
      const res = await api.store.checkBinding(storeId)
      if (!res.store || res.store.id !== storeId || typeof res.expired !== 'boolean') {
        throw new Error('门店绑定响应不匹配')
      }
      currentStore.value = res.store
      bindingExpired.value = res.expired
    } catch (e) {
      currentStore.value = null
      bindingExpired.value = true
      throw e
    }
  }

  async function bindStore(storeId: number) {
    try {
      const res = await api.store.bind(storeId)
      currentStore.value = res.store
      bindingExpired.value = false
    } catch (e) {
      throw e
    }
  }

  function resetEntry() {
    entryScene.value = ''
    entryStoreId.value = 0
    currentStore.value = null
    bindingExpired.value = false
  }

  return {
    entryScene, entryStoreId, isScanEntry,
    currentStore, bindingExpired, deductionMode,
    setScanEntry, checkBinding, bindStore, resetEntry
  }
})

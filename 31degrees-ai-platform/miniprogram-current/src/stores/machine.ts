import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'

export interface MachineInfo {
  id: number
  store_id: number
  name: string
  machine_code: string
  machine_type: string
  qrcode_url: string
  status: 'online' | 'offline' | 'maintenance'
  ip_address: string | null
  port: number
  last_heartbeat: string | null
  is_active: boolean
  created_at: string | null
  pending_orders?: number
  store?: { id: number; name: string; points_balance: number } | null
}

export interface MachineOrder {
  id: number
  machine_id: number
  user_id: number
  store_id: number
  template_id: number | null
  source_image_url: string
  processed_image_url: string | null
  ai_processing_type: string | null
  material_type: string | null
  gift_message: string | null
  status: 'pending' | 'processing' | 'ready' | 'sent' | 'printed' | 'failed'
  engraving_params: string | null
  points_cost: number
  deduction_mode: string
  error_message: string | null
  machine_message_id: string | null
  created_at: string | null
  updated_at: string | null
  completed_at: string | null
}

export const useMachineStore = defineStore('machine', () => {
  // Current machine from QR scan
  const currentMachine = ref<MachineInfo | null>(null)
  const loading = ref(false)

  // Order state
  const currentOrder = ref<MachineOrder | null>(null)
  const orderStatus = ref('')
  const pollingTimer = ref<ReturnType<typeof setInterval> | null>(null)

  // Create order state
  const sourceImageUrl = ref('')
  const aiProcessingType = ref<string | null>(null)
  const selectedTemplateId = ref<number | null>(null)
  const engravingParams = ref<Record<string, any> | null>(null)

  const isMachineOnline = computed(() => currentMachine.value?.status === 'online')
  const hasActiveOrder = computed(() => currentOrder.value !== null)
  const isOrderFinished = computed(() =>
    ['printed', 'failed'].includes(orderStatus.value)
  )

  async function resolveMachineCode(code: string) {
    loading.value = true
    try {
      const res: any = await api.machine.resolveCode(code)
      currentMachine.value = res.machine as MachineInfo
      if (res.store) {
        currentMachine.value.store = res.store
      }
      return res
    } catch (e) {
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createOrder(data: {
    machine_id: number
    template_id?: number | null
    source_image_url: string
    ai_processing_type?: string | null
    material_type?: string | null
    gift_message?: string | null
    engraving_params?: Record<string, any> | null
    deduction_mode?: string
  }) {
    try {
      const res: any = await api.machine.createOrder(data)
      currentOrder.value = {
        id: res.order_id,
        machine_id: data.machine_id,
        user_id: 0,
        store_id: 0,
        template_id: data.template_id || null,
        source_image_url: data.source_image_url,
        processed_image_url: null,
        ai_processing_type: data.ai_processing_type || null,
        material_type: data.material_type || null,
        gift_message: data.gift_message || null,
        status: 'pending',
        engraving_params: data.engraving_params ? JSON.stringify(data.engraving_params) : null,
        points_cost: res.points_cost || 0,
        deduction_mode: data.deduction_mode || 'self',
        error_message: null,
        machine_message_id: null,
        created_at: null,
        updated_at: null,
        completed_at: null,
      }
      orderStatus.value = 'pending'
      startPolling()
      return res
    } catch (e) {
      throw e
    }
  }

  async function pollOrderStatus(orderId?: number) {
    const id = orderId || currentOrder.value?.id
    if (!id) return
    try {
      const res: any = await api.machine.getOrderStatus(id)
      if (currentOrder.value) {
        currentOrder.value = { ...currentOrder.value, ...res }
      }
      orderStatus.value = res.status
      // Stop polling when finished
      if (isOrderFinished.value) {
        stopPolling()
      }
    } catch (e) {
      console.error('轮询订单状态失败:', e)
    }
  }

  function startPolling(orderId?: number) {
    stopPolling()
    // Poll every 2 seconds
    pollingTimer.value = setInterval(() => {
      pollOrderStatus(orderId)
    }, 2000)
  }

  function stopPolling() {
    if (pollingTimer.value) {
      clearInterval(pollingTimer.value)
      pollingTimer.value = null
    }
  }

  async function retryOrder(orderId: number) {
    try {
      await api.machine.retryOrder(orderId)
      orderStatus.value = 'pending'
      if (currentOrder.value) {
        currentOrder.value.status = 'pending'
        currentOrder.value.error_message = null
      }
      startPolling(orderId)
    } catch (e) {
      throw e
    }
  }

  function setSourceImage(url: string) {
    sourceImageUrl.value = url
  }

  function setProcessingType(type: string | null) {
    aiProcessingType.value = type
  }

  function setTemplate(id: number | null) {
    selectedTemplateId.value = id
  }

  function setEngravingParams(params: Record<string, any> | null) {
    engravingParams.value = params
  }

  function resetOrder() {
    currentOrder.value = null
    orderStatus.value = ''
    stopPolling()
    sourceImageUrl.value = ''
    aiProcessingType.value = null
    selectedTemplateId.value = null
    engravingParams.value = null
  }

  function resetMachine() {
    currentMachine.value = null
    resetOrder()
  }

  return {
    currentMachine, loading, currentOrder, orderStatus,
    sourceImageUrl, aiProcessingType, selectedTemplateId, engravingParams,
    isMachineOnline, hasActiveOrder, isOrderFinished,
    resolveMachineCode, createOrder, pollOrderStatus,
    startPolling, stopPolling, retryOrder,
    setSourceImage, setProcessingType, setTemplate, setEngravingParams,
    resetOrder, resetMachine,
  }
})

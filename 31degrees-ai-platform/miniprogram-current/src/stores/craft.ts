import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, type CraftAssessRequest, type CraftAssessResponse, type CraftSize } from '@/api'

const DEFAULT_SIZE = '80x80x80mm'

function parseSizeMm(sizeText: string): CraftSize {
  if (sizeText === 'A5') return { width: 148, height: 210 }
  if (sizeText === 'A4') return { width: 210, height: 297 }

  const matches = `${sizeText || DEFAULT_SIZE}`.match(/\d+(?:\.\d+)?/g) || []
  const [width, height] = matches.map(Number)
  return {
    width: width || 80,
    height: height || width || 80,
  }
}

function buildLocalFallback(request: CraftAssessRequest, reason: string): CraftAssessResponse {
  const size = request.size_mm || {}
  const width = Number(size.width || 80)
  const height = Number(size.height || 80)
  const process = request.process || '内雕灰度图'
  const material = request.material || '水晶'
  const smallSize = Math.min(width, height) < 60
  const detailProcess = /线稿|烫金|浮雕|2\.5D|2.5D/.test(process)
  const hardMaterial = /金属|皮革|木/.test(material)
  const riskScore = Math.min(82, 42 + (smallSize ? 12 : 0) + (detailProcess ? 16 : 0) + (hardMaterial ? 8 : 0))
  const review = riskScore >= 70
  const edgeDensity = detailProcess ? (smallSize ? 0.34 : 0.24) : 0.16
  const highEdgeRatio = detailProcess ? (smallSize ? 0.28 : 0.18) : 0.12
  const contrast = detailProcess ? 72 : 58

  return {
    job_id: `local_craft_${Date.now()}`,
    status: 'completed',
    grade: review ? 'review' : 'warn',
    risk_score: riskScore,
    manual_review_required: review,
    recommended_process: review ? '人工复核' : process,
    source: 'local-rule-fallback',
    material,
    process,
    machine_type: request.machine_type || '激光内雕机',
    api_error: reason,
    metrics: {
      target_width_mm: width,
      target_height_mm: height,
      edge_density: edgeDensity,
      high_edge_ratio: highEdgeRatio,
      estimated_min_line_mm: smallSize ? 0.06 : 0.12,
      contrast,
    },
    risk_items: [
      {
        code: 'backend_unavailable',
        label: '后端预检暂不可用',
        severity: review ? 'high' : 'medium',
        advice: '已按本机保守规则预检；正式下发设备前建议由打样人员复核图案细线、边框密度和灰度起伏。',
      },
    ],
  }
}

export const useCraftStore = defineStore('craft', () => {
  const loading = ref(false)
  const error = ref('')
  const result = ref<CraftAssessResponse | null>(null)
  const material = ref('水晶')
  const process = ref('内雕灰度图')
  const sizeText = ref(DEFAULT_SIZE)
  const machineType = ref('激光内雕机')

  const hasAssessment = computed(() => !!result.value)
  const riskTone = computed(() => {
    if (!result.value) return 'idle'
    if (result.value.grade === 'review') return 'danger'
    if (result.value.grade === 'warn') return 'warn'
    return 'pass'
  })
  const riskLevelText = computed(() => {
    if (!result.value) return '未预检'
    if (result.value.grade === 'review') return '需人工复核'
    if (result.value.grade === 'warn') return '可打样但需优化'
    return '可进入打样'
  })

  function setWorkOptions(options: {
    material?: string
    process?: string
    sizeText?: string
    machineType?: string
  }) {
    if (options.material) material.value = options.material
    if (options.process) process.value = options.process
    if (options.sizeText) sizeText.value = options.sizeText
    if (options.machineType) machineType.value = options.machineType
  }

  async function assess(imageUrl: string, override: Partial<CraftAssessRequest> = {}) {
    loading.value = true
    error.value = ''
    const payload: CraftAssessRequest = {
      image_url: imageUrl,
      material: override.material || material.value,
      process: override.process || process.value,
      machine_type: override.machine_type || machineType.value,
      size_mm: override.size_mm || parseSizeMm(sizeText.value),
    }

    try {
      result.value = await api.craft.assess(payload)
    } catch (err: any) {
      const message = err?.message || '工艺预检接口不可用'
      error.value = message
      result.value = buildLocalFallback(payload, message)
    } finally {
      loading.value = false
    }

    return result.value
  }

  function resetAssessment() {
    loading.value = false
    error.value = ''
    result.value = null
  }

  function toProofPayload() {
    if (!result.value) return null
    return {
      ...result.value,
      material: result.value.material || material.value,
      process: result.value.process || process.value,
      size_text: sizeText.value,
      machine_type: result.value.machine_type || machineType.value,
    }
  }

  return {
    loading,
    error,
    result,
    material,
    process,
    sizeText,
    machineType,
    hasAssessment,
    riskTone,
    riskLevelText,
    setWorkOptions,
    assess,
    resetAssessment,
    toProofPayload,
    parseSizeMm,
  }
})

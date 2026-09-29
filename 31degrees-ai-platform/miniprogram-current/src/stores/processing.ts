import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'

export type ProcessingMode = 'depth-map' | 'halftone' | 'layers' | 'video' | 'pod-3d' | null
export type PipelineStep = 'upload' | 'mode' | 'processing' | 'preview' | 'export'

export interface HalftoneParams {
  method: 'floyd-steinberg' | 'ordered' | 'atkinson'
  dot_size: number
  threshold: number
}

export interface LayersParams {
  layer_count: number
  mode: 'equal-interval'
  inverted: boolean
}

export interface VideoParams {
  frame_limit: number
  target_fps: number | null
}

export interface Pod3DParams {
  depth_scale: number
  perspective_angle: number
  smooth_radius: number
  output_channels: number
}

export const useProcessingStore = defineStore('processing', () => {
  // ---- Pipeline state ----
  const step = ref<PipelineStep>('upload')
  const mode = ref<ProcessingMode>(null)

  // ---- Image data ----
  const sourceImage = ref('')        // data URI or URL
  const sourcePath = ref('')         // local temp path
  const maskUrl = ref('')            // segmentation result
  const depthUrl = ref('')           // grayscale height map
  const halftoneUrl = ref('')        // 1-bit halftone result
  const layersZipUrl = ref('')       // layers ZIP download
  const layerUrls = ref<string[]>([])
  const layerCount = ref(8)
  const videoOutputPath = ref('')
  const videoFrameCount = ref(0)
  const videoDuration = ref(0)

  // ---- Parameters ----
  const halftoneParams = ref<HalftoneParams>({
    method: 'floyd-steinberg',
    dot_size: 1,
    threshold: 128,
  })

  const layersParams = ref<LayersParams>({
    layer_count: 8,
    mode: 'equal-interval',
    inverted: false,
  })

  const videoParams = ref<VideoParams>({
    frame_limit: 180,
    target_fps: null,
  })

  // ---- Pod 3D ----
  const pod3dUrl = ref('')
  const pod3dParams = ref<Pod3DParams>({
    depth_scale: 1.0,
    perspective_angle: 45,
    smooth_radius: 5,
    output_channels: 32,
  })

  // ---- Loading / Error ----
  const loading = ref(false)
  const loadingStage = ref('')       // 'segment' | 'depth' | 'halftone' | 'layers' | 'video'
  const error = ref('')
  const currentTaskId = ref<number | null>(null)
  const progress = ref(0)            // 0-100

  // ---- Computed ----
  const hasMask = computed(() => !!maskUrl.value)
  const hasDepth = computed(() => !!depthUrl.value)
  const hasHalftone = computed(() => !!halftoneUrl.value)
  const hasLayers = computed(() => layerUrls.value.length > 0)
  const hasVideo = computed(() => !!videoOutputPath.value)

  const hasPod3D = computed(() => !!pod3dUrl.value)

  const canPreview = computed(() =>
    hasDepth.value || hasHalftone.value || hasLayers.value || hasVideo.value || hasPod3D.value
  )

  // ---- Actions ----

  function setStep(s: PipelineStep) {
    step.value = s
  }

  function setMode(m: ProcessingMode) {
    mode.value = m
    if (m) setStep('processing')
  }

  function setSourceImage(dataUri: string, path: string = '') {
    sourceImage.value = dataUri
    sourcePath.value = path || dataUri
  }

  function resetPipeline() {
    maskUrl.value = ''
    depthUrl.value = ''
    halftoneUrl.value = ''
    layersZipUrl.value = ''
    layerUrls.value = []
    layerCount.value = 8
    videoOutputPath.value = ''
    videoFrameCount.value = 0
    videoDuration.value = 0
    pod3dUrl.value = ''
    error.value = ''
    progress.value = 0
    currentTaskId.value = null
  }

  function resetAll() {
    resetPipeline()
    step.value = 'upload'
    mode.value = null
    sourceImage.value = ''
    sourcePath.value = ''
    loading.value = false
    loadingStage.value = ''
  }

  // ---- API wrappers ----

  async function runSegmentation(): Promise<string> {
    loading.value = true
    loadingStage.value = 'segment'
    error.value = ''
    try {
      const res: any = await api.processing.segment(sourceImage.value)
      maskUrl.value = res.mask_url || ''
      return maskUrl.value
    } catch (e: any) {
      error.value = e.message || '分割失败'
      throw e
    } finally {
      loading.value = false
      loadingStage.value = ''
    }
  }

  async function runDepthMap(): Promise<string> {
    loading.value = true
    loadingStage.value = 'depth'
    error.value = ''
    try {
      const res: any = await api.processing.depthMap(sourceImage.value, maskUrl.value || undefined)
      depthUrl.value = res.depth_url || ''
      currentTaskId.value = res.task_id
      return depthUrl.value
    } catch (e: any) {
      error.value = e.message || '深度估计失败'
      throw e
    } finally {
      loading.value = false
      loadingStage.value = ''
    }
  }

  async function runHalftone(): Promise<string> {
    loading.value = true
    loadingStage.value = 'halftone'
    error.value = ''
    try {
      const sourceMap = depthUrl.value || sourceImage.value
      const res: any = await api.processing.halftone(
        sourceMap,
        halftoneParams.value.method,
        halftoneParams.value.dot_size,
        halftoneParams.value.threshold,
      )
      halftoneUrl.value = res.halftone_url || ''
      currentTaskId.value = res.task_id
      return halftoneUrl.value
    } catch (e: any) {
      error.value = e.message || '点阵雕刻处理失败'
      throw e
    } finally {
      loading.value = false
      loadingStage.value = ''
    }
  }

  async function runLayers(): Promise<{ zipUrl: string; layerList: string[]; count: number }> {
    loading.value = true
    loadingStage.value = 'layers'
    error.value = ''
    try {
      const sourceMap = depthUrl.value || sourceImage.value
      const res: any = await api.processing.layers(
        sourceMap,
        layersParams.value.layer_count,
        layersParams.value.mode,
        layersParams.value.inverted,
      )
      layersZipUrl.value = res.layers_zip_url || ''
      layerUrls.value = res.layer_urls || []
      layerCount.value = res.layer_count || 0
      currentTaskId.value = res.task_id
      return {
        zipUrl: layersZipUrl.value,
        layerList: layerUrls.value,
        count: layerCount.value,
      }
    } catch (e: any) {
      error.value = e.message || '图层生成失败'
      throw e
    } finally {
      loading.value = false
      loadingStage.value = ''
    }
  }

  async function runVideoPipeline(): Promise<void> {
    loading.value = true
    loadingStage.value = 'video'
    error.value = ''
    progress.value = 0
    try {
      // Video processing is sequential: depth per frame
      progress.value = 10
      const res: any = await api.processing.video(
        sourceImage.value,
        videoParams.value.frame_limit,
        videoParams.value.target_fps,
      )
      progress.value = 90
      videoOutputPath.value = res.output_path || ''
      videoFrameCount.value = res.frame_count || 0
      videoDuration.value = res.duration || 0
      currentTaskId.value = res.task_id
      progress.value = 100
    } catch (e: any) {
      error.value = e.message || '视频处理失败'
      throw e
    } finally {
      loading.value = false
      loadingStage.value = ''
    }
  }

  async function runPod3D(): Promise<string> {
    loading.value = true
    loadingStage.value = 'pod3d'
    error.value = ''
    progress.value = 0
    try {
      progress.value = 30
      const res: any = await api.processing.pod3d(
        sourceImage.value,
        pod3dParams.value.depth_scale,
        pod3dParams.value.perspective_angle,
        pod3dParams.value.smooth_radius,
        pod3dParams.value.output_channels,
      )
      progress.value = 90
      pod3dUrl.value = res.output_url || res.depth_url || res.pod3d_url || ''
      currentTaskId.value = res.task_id
      progress.value = 100
      return pod3dUrl.value
    } catch (e: any) {
      error.value = e.message || '3D内雕处理失败'
      throw e
    } finally {
      loading.value = false
      loadingStage.value = ''
    }
  }

  async function runFullPipeline() {
    // Segment → Depth → (halftone/layers based on mode)
    resetPipeline()
    setStep('processing')
    progress.value = 0

    try {
      progress.value = 20
      await runSegmentation()
      progress.value = 40
      await runDepthMap()
      progress.value = 70

      if (mode.value === 'halftone') {
        await runHalftone()
      } else if (mode.value === 'layers') {
        await runLayers()
      } else if (mode.value === 'video') {
        await runVideoPipeline()
      } else if (mode.value === 'pod-3d') {
        await runPod3D()
      }

      progress.value = 100
      setStep('preview')
    } catch (e) {
      // error already set by individual calls
    }
  }

  return {
    // State
    step, mode,
    sourceImage, sourcePath,
    maskUrl, depthUrl, halftoneUrl,
    layersZipUrl, layerUrls, layerCount,
    videoOutputPath, videoFrameCount, videoDuration,
    pod3dUrl, pod3dParams,
    halftoneParams, layersParams, videoParams,
    loading, loadingStage, error, currentTaskId, progress,
    // Computed
    hasMask, hasDepth, hasHalftone, hasLayers, hasVideo, hasPod3D, canPreview,
    // Actions
    setStep, setMode, setSourceImage, resetPipeline, resetAll,
    runSegmentation, runDepthMap, runHalftone, runLayers,
    runVideoPipeline, runPod3D, runFullPipeline,
  }
})

import { API_BASE_URL, validateApiResponse } from '../utils/apiContract.mjs'

export function getApiBaseUrl(): string {
  // #ifdef H5
  if (typeof window !== 'undefined' && ['127.0.0.1', 'localhost'].includes(window.location.hostname)) {
    return 'http://127.0.0.1:8000/api'
  }
  // #endif
  const storedUrl = uni.getStorageSync('api_base_url')
  if (storedUrl) return storedUrl
  return API_BASE_URL
}

export function getUploadUrl(): string {
  return `${getApiBaseUrl()}/upload`
}

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  timeout?: number
}

async function request<T = any>(options: RequestOptions): Promise<T> {
  const token = uni.getStorageSync('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.header,
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: getApiBaseUrl() + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: headers,
      timeout: options.timeout || 15000,
      success: (res: any) => {
        try {
          resolve(validateApiResponse(res.statusCode, res.data, options.url) as T)
        } catch (error) {
          reject(error)
        }
      },
      fail: (err: any) => {
        reject(new Error(err.errMsg || '网络错误'))
      },
    })
  })
}

const LONG_AI_TIMEOUT = 180000

export interface CraftSize {
  width?: number
  height?: number
}

export interface CraftAssessRequest {
  image_url: string
  material?: string
  process?: string
  size_mm?: CraftSize
  machine_type?: string
}

export interface CraftRiskItem {
  code: string
  label: string
  severity: 'low' | 'medium' | 'high' | string
  advice: string
}

export interface CraftAssessResponse {
  task_id?: number
  status?: string
  job_id: string
  grade: 'pass' | 'warn' | 'review' | string
  risk_score: number
  manual_review_required: boolean
  risk_items: CraftRiskItem[]
  risk_image_url?: string
  report_url?: string
  metrics?: Record<string, any>
  recommended_process?: string
  source?: string
  material?: string
  process?: string
  machine_type?: string
  api_error?: string
}

export const api = {
  auth: {
    wxLogin: (code: string) => request<{ token: string; user: any }>({
      url: '/auth/wx-login',
      method: 'POST',
      data: { code },
    }),
    getPhone: (code: string) => request<{ phone: string }>({
      url: '/auth/phone',
      method: 'POST',
      data: { code },
    }),
  },
  user: {
    getInfo: () => request({ url: '/auth/me' }),
  },
  template: {
    officialCatalog: () => request<any>({ url: '/templates/official-catalog' }),
    list: (category?: string, templateTypeId?: number) => {
      // uni.request serializes `undefined` query values as empty strings.  A
      // blank `template_type_id` then fails FastAPI's integer validation and
      // makes the H5 client silently fall back to its 22-item demo catalog.
      const data: Record<string, string | number> = {}
      if (category) data.category = category
      if (templateTypeId !== undefined && templateTypeId !== null) {
        data.template_type_id = templateTypeId
      }
      return request<{ templates: any[]; categories: string[] }>({
        url: '/templates',
        data,
      })
    },
    hot: () => request<{ templates: any[] }>({ url: '/templates/hot' }),
    detail: (id: number) => request({ url: `/templates/${id}` }),
  },
  templateTypes: {
    list: (customizationType?: string) => request<{ template_types: any[]; customization_types: string[] }>({
      url: '/template-types',
      data: customizationType ? { customization_type: customizationType } : undefined,
    }),
    detail: (id: number) => request({ url: `/template-types/${id}` }),
  },
  capabilities: {
    rkq: () => request<any>({ url: '/capabilities/rkq' }),
  },
  orders: {
    list: () => request<{ orders: any[] }>({ url: '/orders' }),
  },
  points: {
    balance: () => request<{ balance: number }>({ url: '/points/balance' }),
    deduct: (data: { template_id: number; store_id?: number; mode: 'self' | 'store' }) =>
      request<{ order_id: number; balance_after: number }>({
        url: '/points/deduct',
        method: 'POST',
        data,
      }),
    history: (page: number = 1) => request({ url: '/points/history', data: { page } }),
  },
  store: {
    create: (name: string) => request<{ store: any }>({
      url: '/store/create',
      method: 'POST',
      data: { name },
    }),
    bind: (storeId: number) => request<{ store: any }>({
      url: '/store/bind',
      method: 'POST',
      data: { store_id: storeId },
    }),
    checkBinding: (storeId: number) => request<{ store: any; expired: boolean }>({
      url: `/store/binding/${storeId}`,
    }),
    info: () => request({ url: '/store/info' }),
    members: () => request({ url: '/store/members' }),
    orders: (page: number = 1) => request({ url: '/store/orders', data: { page } }),
    withdrawApply: (amount: number) => request({
      url: '/store/withdraw',
      method: 'POST',
      data: { amount },
    }),
    withdrawHistory: () => request({ url: '/store/withdraw/history' }),
  },
  ai: {
    imageToVector: (imageUrl: string) => request<{ svg_url: string }>({
      url: '/ai/vectorize',
      method: 'POST',
      data: { image_url: imageUrl },
      timeout: LONG_AI_TIMEOUT,
    }),
    depthEstimate: (imageUrl: string) => request<{ depth_url: string }>({
      url: '/ai/depth',
      method: 'POST',
      data: { image_url: imageUrl },
      timeout: LONG_AI_TIMEOUT,
    }),
    extractLogo: (imageUrl: string) => request<{ logo_url: string; mask_url: string }>({
      url: '/ai/extract-logo',
      method: 'POST',
      data: { image_url: imageUrl },
      timeout: LONG_AI_TIMEOUT,
    }),
  },
  machine: {
    available: (machineType?: string) => request<{ machines: any[] }>({
      url: '/machine/available',
      data: machineType ? { machine_type: machineType } : {},
    }),
    resolveCode: (machineCode: string) => request({ url: `/machine/code/${encodeURIComponent(machineCode)}` }),
    register: (data: any) => request({ url: '/machine/register', method: 'POST', data }),
    listByStore: (storeId: number) => request({ url: '/machine/list', data: { store_id: storeId } }),
    getDetail: (machineId: number) => request({ url: `/machine/${machineId}` }),
    updateStatus: (machineId: number, status: string) =>
      request({ url: `/machine/${machineId}/status`, method: 'PUT', data: { status } }),
    delete: (machineId: number) => request({ url: `/machine/${machineId}`, method: 'DELETE' }),
    createOrder: (data: any) => request({
      url: '/machine/order',
      method: 'POST',
      data,
      timeout: 30000,
    }),
    getOrderStatus: (orderId: number) => request({
      url: `/machine/order/${orderId}`,
      timeout: 20000,
    }),
    listOrders: (params?: any) => request({ url: '/machine/orders', data: params }),
    retryOrder: (orderId: number) => request({
      url: `/machine/order/${orderId}/retry`,
      method: 'POST',
      timeout: 30000,
    }),
  },
  proofing: {
    create: (data: any) => request<{ order: any; message: string }>({
      url: '/proofing/orders',
      method: 'POST',
      data,
      timeout: 20000,
    }),
    list: (page: number = 1) => request<{ orders: any[]; total: number; page: number }>({
      url: '/proofing/orders',
      data: { page },
    }),
    detail: (orderId: number) => request<{ order: any }>({
      url: `/proofing/orders/${orderId}`,
    }),
  },
  craft: {
    assess: (data: CraftAssessRequest) => request<CraftAssessResponse>({
      url: '/craft/assess',
      method: 'POST',
      data,
      timeout: LONG_AI_TIMEOUT,
    }),
  },
  processing: {
    segment: (imageUrl: string) => request<{ task_id: number; mask_url: string }>({
      url: '/processing/segment',
      method: 'POST',
      data: { image_url: imageUrl },
      timeout: LONG_AI_TIMEOUT,
    }),
    depthMap: (imageUrl: string, maskUrl?: string) => request<{ task_id: number; depth_url: string }>({
      url: '/processing/depth-map',
      method: 'POST',
      data: { image_url: imageUrl, mask_url: maskUrl },
      timeout: LONG_AI_TIMEOUT,
    }),
    halftone: (depthMapUrl: string, method: string = 'floyd-steinberg', dotSize: number = 1, threshold: number = 128) =>
      request<{ task_id: number; halftone_url: string }>({
        url: '/processing/halftone',
        method: 'POST',
        data: { depth_map_url: depthMapUrl, method, dot_size: dotSize, threshold },
        timeout: LONG_AI_TIMEOUT,
      }),
    layers: (depthMapUrl: string, layerCount: number = 8, mode: string = 'equal-interval', inverted: boolean = false) =>
      request<{ task_id: number; layers_zip_url: string; layer_urls: string[]; layer_count: number }>({
        url: '/processing/layers',
        method: 'POST',
        data: { depth_map_url: depthMapUrl, layer_count: layerCount, mode, inverted },
        timeout: LONG_AI_TIMEOUT,
      }),
    video: (videoUrl: string, frameLimit: number = 180, targetFps?: number | null) =>
      request<{ task_id: number; output_path: string; frame_count: number; duration: number }>({
        url: '/processing/video',
        method: 'POST',
        data: { video_url: videoUrl, frame_limit: frameLimit, target_fps: targetFps },
        timeout: LONG_AI_TIMEOUT,
      }),
    getTasks: (limit: number = 50) => request<{ tasks: any[] }>({
      url: '/processing/tasks',
      data: { limit },
    }),
    getTask: (taskId: number) => request<any>({ url: `/processing/tasks/${taskId}` }),
    download: (taskId: number) => request<any>({ url: `/processing/download/${taskId}` }),
    pod3d: (
      sourceUrl: string,
      depthScale: number = 1.0,
      perspectiveAngle: number = 45,
      smoothRadius: number = 5,
      outputChannels: number = 32,
    ) => request<{ task_id: number; output_url: string; depth_stats: any }>({
      url: '/processing/pod-3d',
      method: 'POST',
      data: {
        source_url: sourceUrl,
        depth_scale: depthScale,
        perspective_angle: perspectiveAngle,
        smooth_radius: smoothRadius,
        output_channels: outputChannels,
      },
      timeout: LONG_AI_TIMEOUT,
    }),
    gcode: (imageUrl: string, method: string = 'raster', scanStep: number = 0.2) =>
      request<{ gcode_text: string; gcode_url: string; lines: number; method: string }>({
        url: '/processing/gcode',
        method: 'POST',
        data: { image_url: imageUrl, method, scan_step: scanStep },
        timeout: LONG_AI_TIMEOUT,
      }),
    importGray: (imageUrl: string) => request<{
      task_id: number; depth_url: string; bmp_url: string; source: string; is_ai: boolean;
      width: number; height: number; notice: string; sha256: Record<string, string>
    }>({ url: '/processing/gray-image', method: 'POST', data: { image_url: imageUrl } }),

    bmp: (imageUrl: string) =>
      request<{ task_id: number; bmp_url: string; format: string; color_space: string; width: number; height: number }>({
        url: '/processing/bmp',
        method: 'POST',
        data: { image_url: imageUrl },
        timeout: LONG_AI_TIMEOUT,
      }),
    zAxis25d: (
      depthMapUrl: string,
      options: {
        pulsePerRound?: number
        pulsePerMm?: number
        maxDepthMm?: number
        scanStepMm?: number
        pixelStep?: number
        feedRate?: number
        zFeedRate?: number
        laserPower?: number
        invertDepth?: boolean
        stlPixelStep?: number
      } = {},
    ) => request<{
      task_id: number
      z_gcode_url: string
      stl_url: string
      machine_profile_url: string
      guide_url: string
      machine_profile: any
      moves: number
      stl_triangles: number
      format: string
    }>({
      url: '/processing/z-axis-25d',
      method: 'POST',
      data: {
        depth_map_url: depthMapUrl,
        pulse_per_round: options.pulsePerRound ?? 25600,
        pulse_per_mm: options.pulsePerMm ?? 320,
        max_depth_mm: options.maxDepthMm ?? 1.2,
        scan_step_mm: options.scanStepMm ?? 0.2,
        pixel_step: options.pixelStep ?? 2,
        feed_rate: options.feedRate ?? 1500,
        z_feed_rate: options.zFeedRate ?? 300,
        laser_power: options.laserPower ?? 180,
        invert_depth: options.invertDepth ?? false,
        stl_pixel_step: options.stlPixelStep ?? 4,
      },
      timeout: LONG_AI_TIMEOUT,
    }),
    colorPrintPackage: (data: {
      source_image_url: string
      product_type: string
      material: string
      width_mm: number
      height_mm: number
      quantity: number
      dpi: number
      white_ink: boolean
      varnish: boolean
      mirror: boolean
      cutline: boolean
      bleed_mm: number
      icc_profile: string
      rip_preset: string
      notes?: string
    }) => request<{
      task_id: number
      status: string
      package_url: string
      guide_url: string
      cutline_url?: string
      white_layer_url?: string
      varnish_layer_url?: string
      hot_folder?: any
      package: any
    }>({
      url: '/processing/color-print-package',
      method: 'POST',
      data,
      timeout: LONG_AI_TIMEOUT,
    }),
    optimize: (imageUrl: string, mode: string = 'enhance', template: string = 'white', strength: number = 1.0, bgImageUrl?: string) =>
      request<{ task_id: number; optimized_url: string; mode: string; template: string; applied: string[] }>({
        url: '/processing/optimize',
        method: 'POST',
        data: { image_url: imageUrl, mode, template, strength, bg_image_url: bgImageUrl || '' },
        timeout: LONG_AI_TIMEOUT,
      }),
    coinPackage: (data: {
      image_url: string
      coin_size_mm?: number
      template?: string
      ring_text_top?: string
      ring_text_bottom?: string
      max_depth_mm?: number
      scan_step_mm?: number
      invert_depth?: boolean
    }) => request<{
      task_id: number
      coin_url: string
      depth_url: string
      bmp_url: string
      stl_url: string
      machine_profile_url: string
      coin_size_mm: number
      stl_triangles: number
    }>({
      url: '/processing/coin-package',
      method: 'POST',
      data,
      timeout: LONG_AI_TIMEOUT,
    }),
    textTo25d: (data: {
      prompt: string
      style?: string
      negative_prompt?: string
      width?: number
      height?: number
      steps?: number
    }) => request<{
      task_id: number
      image_url: string
      depth_url: string
      pod3d_url: string
      model: string
      warning?: string
    }>({
      url: '/processing/text-to-25d',
      method: 'POST',
      data,
      timeout: LONG_AI_TIMEOUT,
    }),
  },
  photoJobs: {
    list: () => request<{ jobs: any[] }>({ url: '/photo-jobs' }),
    create: (sourceImageUrl: string, template: string, backgroundImageUrl?: string, templateTypeId?: number) => request<any>({
      url: '/photo-jobs',
      method: 'POST',
      data: {
        source_image_url: sourceImageUrl,
        template,
        background_image_url: backgroundImageUrl || null,
        template_type_id: templateTypeId || null,
      },
    }),
    style: (jobId: number) => request<any>({
      url: `/photo-jobs/${jobId}/style`,
      method: 'POST',
      timeout: LONG_AI_TIMEOUT,
    }),
    preview25d: (jobId: number) => request<any>({
      url: `/photo-jobs/${jobId}/preview-25d`,
      method: 'POST',
      timeout: LONG_AI_TIMEOUT,
    }),
    get: (jobId: number) => request<any>({ url: `/photo-jobs/${jobId}` }),
    lockProduction: (jobId: number, data: {
      expected_design_revision: string
      expected_template_revision: string
      template_type_id?: number | null
      product_type?: string
      material_type?: string
      size?: string
      process?: string
      quote_points?: number
      preview_confirmed?: boolean
    }) => request<any>({
      url: `/photo-jobs/${jobId}/lock-production`,
      method: 'POST',
      data,
    }),
    submitProduction: (jobId: number, machineId: number) => request<any>({
      url: `/photo-jobs/${jobId}/submit-production`,
      method: 'POST',
      data: { machine_id: machineId },
      timeout: 30000,
    }),
  },
}

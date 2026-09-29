import { getUploadUrl } from '@/api'
import { validateApiResponse } from './apiContract.mjs'

/**
 * 图片处理工具函数
 * 压缩、格式转换、尺寸计算等
 */

/** 压缩图片（通过 Canvas 2D） */
export function compressImage(
  src: string,
  maxWidth: number = 1080,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 用 uni.compressImage 做基础压缩
    uni.compressImage({
      src,
      quality: Math.round(quality * 100),
      success: (res) => resolve(res.tempFilePath),
      fail: () => resolve(src), // 压缩失败返回原图
    })
  })
}

/** 获取图片信息 */
export function getImageInfo(src: string): Promise<{ width: number; height: number; path: string }> {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src,
      success: (res: any) => resolve(res),
      fail: reject,
    })
  })
}

/** 选择照片（从相机或相册） */
export function chooseImage(
  options: {
    count?: number
    sourceType?: ('album' | 'camera')[]
    sizeType?: ('original' | 'compressed')[]
  } = {}
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: options.count ?? 1,
      sourceType: options.sourceType ?? ['album', 'camera'],
      sizeType: options.sizeType ?? ['original', 'compressed'],
      success: (res: any) => resolve(res.tempFilePaths),
      fail: reject,
    })
  })
}

/** 拍照 */
export function takePhoto(): Promise<string> {
  return chooseImage({ sourceType: ['camera'] }).then(
    (paths) => paths[0]
  )
}

/** 从相册选图 */
export function pickFromAlbum(count: number = 1): Promise<string[]> {
  return chooseImage({ sourceType: ['album'], count })
}

/** 上传图片到后端 */
export function uploadImage(
  filePath: string,
  name: string = 'file'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    if (!token) {
      reject(new Error('请先在“我的”登录，再上传照片'))
      return
    }
    uni.uploadFile({
      url: getUploadUrl(),
      filePath,
      name,
      header: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      success: (res: any) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          reject(new Error(`上传失败 ${res.statusCode}`))
          return
        }
        try {
          const data = validateApiResponse(res.statusCode, res.data, '/upload')
          const url = data?.url || data?.file_url || data?.image_url || data?.path || data?.data?.url || ''
          if (typeof url !== 'string' || !url) reject(new Error('上传失败，未返回文件地址'))
          else resolve(url)
        } catch (error) {
          reject(error instanceof Error ? error : new Error('上传响应解析失败'))
        }
      },
      fail: reject,
    })
  })
}

/** 图片预加载（缓存） */
export function preloadImages(urls: string[]): Promise<void[]> {
  const tasks = urls.map(
    (url) =>
      new Promise<void>((resolve) => {
        uni.getImageInfo({
          src: url,
          success: () => resolve(),
          fail: () => resolve(),
        })
      })
  )
  return Promise.all(tasks)
}

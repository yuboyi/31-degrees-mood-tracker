import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'

export interface UserInfo {
  id: number
  openid: string
  nickname: string
  avatar: string
  phone?: string
  points_balance: number
}

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref<UserInfo | null>(null)
  const isLogin = computed(() => !!token.value)

  function saveSession(nextToken: string, nextUser: UserInfo) {
    token.value = nextToken
    userInfo.value = nextUser
    uni.setStorageSync('token', nextToken)
    uni.setStorageSync('user_info', nextUser)
  }

  async function wxLogin(code: string) {
    const res = await api.auth.wxLogin(code)
    saveSession(res.token, res.user)
    uni.removeStorageSync('login_fallback')
    return res
  }

  function restoreLogin() {
    const saved = uni.getStorageSync('token')
    if (saved) token.value = saved
    const savedUser = uni.getStorageSync('user_info')
    if (savedUser) userInfo.value = savedUser
  }

  async function fetchUserInfo() {
    if (!token.value) return
    try {
      const res = await api.user.getInfo()
      userInfo.value = res
      uni.setStorageSync('user_info', res)
    } catch (e) {
      console.error('获取用户信息失败:', e)
    }
  }

  async function bindPhone(code: string) {
    if (!code) {
      throw new Error('未获取到手机号授权')
    }
    try {
      const res = await api.auth.getPhone(code)
      if (userInfo.value) {
        userInfo.value = {
          ...userInfo.value,
          phone: res.phone,
        }
        uni.setStorageSync('user_info', userInfo.value)
      }
      return res
    } catch (e) {
      console.error('手机号绑定失败:', e)
      throw e
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    uni.removeStorageSync('token')
    uni.removeStorageSync('user_info')
    uni.removeStorageSync('login_fallback')
    uni.removeStorageSync('phone_fallback')
  }

  return { token, userInfo, isLogin, wxLogin, restoreLogin, fetchUserInfo, bindPhone, logout }
})

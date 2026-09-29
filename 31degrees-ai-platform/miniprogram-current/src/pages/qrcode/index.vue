<template>
  <view class="page-qrcode">
    <view class="loading" v-if="loading">
      <text class="loading-text">正在识别...</text>
      <text class="loading-sub">读取设备/门店信息</text>
    </view>

    <view class="result" v-else>
      <!-- 成功识别门店 -->
      <view v-if="storeValid" class="store-valid">
        <text class="icon-check">✓</text>
        <text class="store-msg">来自「{{ storeName }}」</text>
        <text class="store-hint">已核验门店绑定，制作前请确认实际费用与支付方式</text>
        <view class="btn-continue" @tap="continueToApp">
          <text>开始制作</text>
        </view>
      </view>

      <!-- 机器 -->
      <view v-else-if="isMachineEntry" class="store-valid">
        <text class="icon-check machine-icon">🖨️</text>
        <text class="store-msg">设备「{{ machineName }}」</text>
        <text class="store-hint">设备信息已核验，尚未提交加工任务</text>
        <view class="btn-continue" @tap="continueToMachine">
          <text>开始制作</text>
        </view>
      </view>

      <!-- 门店过期/无效 -->
      <view v-else class="store-invalid">
        <text class="icon-warn">!</text>
        <text class="warn-title">{{ errorTitle }}</text>
        <text class="warn-desc">{{ errorDescription }}</text>
        <view v-if="needsLogin" class="btn-continue" @tap="goToLogin"><text>去登录</text></view>
        <view v-if="canRetry" class="btn-continue" @tap="resolveEntry"><text>重新验证</text></view>
        <view class="btn-continue secondary" @tap="continueToApp">
          <text>返回首页浏览</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useAppStore } from '@/stores/store'
import { useUserStore } from '@/stores/user'
import { api } from '@/api'
import { parseQrEntry } from '@/utils/qrEntry.mjs'

const appStore = useAppStore()

const loading = ref(true)
const storeValid = ref(false)
const storeName = ref('')
const isMachineEntry = ref(false)
const machineName = ref('')
const machineCode = ref('')
const errorTitle = ref('无法识别二维码')
const errorDescription = ref('请使用有效的门店码或设备码，不会自动绑定或扣费。')
const needsLogin = ref(false)
const canRetry = ref(false)
let entry: ReturnType<typeof parseQrEntry> = { kind: 'invalid' }

onLoad((options: any) => {
  entry = parseQrEntry(options)
  resolveEntry()
})

async function resolveEntry() {
  loading.value = true
  appStore.resetEntry()
  storeValid.value = false
  isMachineEntry.value = false
  needsLogin.value = false
  canRetry.value = false
  errorTitle.value = '无法识别二维码'
  errorDescription.value = '请使用有效的门店码或设备码，不会自动绑定或扣费。'
  try {
    if (entry.kind === 'tenant') {
      errorTitle.value = '该门店码尚未接入当前版本'
      errorDescription.value = '这是线上租户场景码，需接通后台场景解析后才能识别门店；未绑定、未扣费。'
      return
    }
    if (entry.kind === 'machine') {
      const result: any = await api.machine.resolveCode(entry.machineCode)
      const machine = result.machine
      if (!machine || machine.is_active === false || machine.machine_code !== entry.machineCode) throw new Error('Invalid machine response')
      if (machine.status !== 'online') {
        errorTitle.value = '设备当前不可用'
        errorDescription.value = '设备离线或暂未就绪，请联系门店确认后重新验证。'
        canRetry.value = true
        return
      }
      machineCode.value = machine.machine_code
      machineName.value = machine.name
      isMachineEntry.value = true
      return
    }
    if (entry.kind !== 'store') return
    const userStore = useUserStore()
    userStore.restoreLogin()
    if (!userStore.isLogin) {
      errorTitle.value = '请先登录后验证门店'
      errorDescription.value = '尚未读取您的门店绑定，不会将未登录误判为过期。登录后重新扫码验证。'
      needsLogin.value = true
      return
    }
    await appStore.checkBinding(entry.storeId)
    if (appStore.bindingExpired || !appStore.currentStore) {
      errorTitle.value = '尚未绑定门店或绑定已过期'
      errorDescription.value = '请联系门店确认绑定；本次未自动续期，也未产生扣费。'
      return
    }
    appStore.setScanEntry(entry.storeId, entry.scene)
    storeValid.value = true
    storeName.value = appStore.currentStore.name
  } catch {
    appStore.resetEntry()
    errorTitle.value = '二维码信息验证失败'
    errorDescription.value = '暂时无法确认二维码是否有效，请检查登录、网络或联系门店后重试。'
    canRetry.value = true
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  uni.switchTab({ url: '/pages/my/my' })
}

function continueToApp() {
  if (!storeValid.value) appStore.resetEntry()
  uni.switchTab({ url: '/pages/index/index' })
}

function continueToMachine() {
  if (!isMachineEntry.value) return
  uni.navigateTo({ url: `/pages/machine/index?machine_code=${encodeURIComponent(machineCode.value)}` })
}
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '31度激光雕刻 · 扫码连接设备',
      path: '/pages/qrcode/index',
    }
  },
  onShareTimeline() {
    return {
      title: '31度激光雕刻 · 扫码开始创作',
    }
  },
}
</script>

<style lang="scss" scoped>
.page-qrcode {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: $bg-dark;
  padding: 40rpx;
  text-align: center;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.loading-text {
  font-size: 32rpx;
  color: $primary;
}

.loading-sub {
  font-size: 24rpx;
  color: $text-secondary;
}

.store-valid, .store-invalid {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.icon-check {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 185, 129, 0.15);
  color: $success;
  font-size: 48rpx;
  border-radius: 50%;
  margin-bottom: 8rpx;

  &.machine-icon {
    background: rgba(99, 102, 241, 0.15);
  }
}

.icon-warn {
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 158, 11, 0.15);
  color: $warning;
  font-size: 48rpx;
  border-radius: 50%;
  margin-bottom: 8rpx;
}

.store-msg {
  font-size: 36rpx;
  font-weight: 700;
  color: $success;
}

.store-hint {
  font-size: 24rpx;
  color: $text-secondary;
}

.warn-title {
  font-size: 32rpx;
  font-weight: 700;
  color: $warning;
}

.warn-desc {
  font-size: 24rpx;
  color: $text-secondary;
}

.btn-continue {
  margin-top: 32rpx;
  padding: 24rpx 64rpx;
  background: $primary;
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  border-radius: $radius-md;

  &.secondary {
    background: $bg-card-hover;
    color: $text-primary;
  }
}
</style>

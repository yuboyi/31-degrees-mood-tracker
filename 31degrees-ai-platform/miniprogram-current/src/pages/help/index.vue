<template>
  <view class="page-help">
    <!-- 搜索 -->
    <view class="search-bar">
      <text class="search-icon">🔍</text>
      <input
        class="search-input"
        v-model="searchQuery"
        placeholder="搜索问题..."
        placeholder-style="color: #666"
        @confirm="onSearch"
      />
    </view>

    <!-- FAQ 分类 Tab -->
    <scroll-view scroll-x class="faq-tabs">
      <view class="faq-tab-list">
        <view
          v-for="tab in tabs"
          :key="tab.key"
          class="faq-tab"
          :class="{ active: activeTab === tab.key }"
          @tap="activeTab = tab.key"
        >
          <text>{{ tab.icon }} {{ tab.label }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- FAQ 列表 -->
    <view class="faq-list">
      <view
        v-for="(item, idx) in filteredFaq"
        :key="idx"
        class="faq-card"
      >
        <view class="faq-question" @tap="toggleFaq(idx)">
          <text class="faq-q">Q: {{ item.q }}</text>
          <text class="faq-arrow" :class="{ open: expandedIdx === idx }">▾</text>
        </view>
        <view class="faq-answer" v-if="expandedIdx === idx">
          <text class="faq-a">{{ item.a }}</text>
        </view>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view class="search-results" v-if="searchQuery && searchResults.length > 0">
      <text class="results-title">搜索结果 ({{ searchResults.length }})</text>
      <view
        v-for="(item, idx) in searchResults"
        :key="'s_' + idx"
        class="faq-card"
      >
        <view class="faq-question" @tap="toggleSearch(idx)">
          <text class="faq-q">Q: {{ item.q }}</text>
          <text class="faq-arrow" :class="{ open: searchOpenIdx === idx }">▾</text>
        </view>
        <view class="faq-answer" v-if="searchOpenIdx === idx">
          <text class="faq-a">{{ item.a }}</text>
        </view>
      </view>
    </view>

    <!-- 联系我们 -->
    <view class="contact-section">
      <text class="contact-title">联系我们</text>
      <view class="contact-cards">
        <view class="contact-card">
          <text class="contact-icon">📞</text>
          <text class="contact-label">客服电话</text>
          <text class="contact-value">400-888-0000</text>
        </view>
        <view class="contact-card">
          <text class="contact-icon">💬</text>
          <text class="contact-label">在线客服</text>
          <text class="contact-value">工作日 9:00-18:00</text>
        </view>
        <view class="contact-card">
          <text class="contact-icon">📧</text>
          <text class="contact-label">邮箱</text>
          <text class="contact-value">support@jumpai.com</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const searchQuery = ref('')
const activeTab = ref('all')
const expandedIdx = ref(-1)
const searchOpenIdx = ref(-1)

const tabs = [
  { key: 'all', label: '全部', icon: '📚' },
  { key: 'print', label: '打印', icon: '🖨️' },
  { key: 'laser', label: '雕刻', icon: '⚡' },
  { key: 'points', label: '积分', icon: '💰' },
  { key: 'account', label: '账号', icon: '👤' },
]

const faqData = [
  {
    q: '喷墨彩印支持哪些纸张类型？',
    a: '目前支持照片纸、哑光纸、明信片纸和海报纸。照片纸适合打印高质量照片，哑光纸适合艺术风格打印。',
    category: 'print',
  },
  {
    q: '激光雕刻可以雕刻哪些材质？',
    a: '支持水晶、亚克力、木质、金属和树叶五种材质。水晶适合内雕3D效果，金属适合打标Logo，木质和树叶适合创意雕刻。',
    category: 'laser',
  },
  {
    q: '如何选择 AI 处理类型？',
    a: '矢量雕刻适合线条清晰的图案，深度浮雕适合需要立体感的照片，智能抠图适合商标和图标，全能优化会根据图片自动选择最佳方案。',
    category: 'laser',
  },
  {
    q: '上传的照片有尺寸要求吗？',
    a: '建议使用 1024x1024 像素以上的照片，支持 JPG/PNG 格式。照片越清晰，处理效果越好。',
    category: 'print',
  },
  {
    q: '积分如何使用？',
    a: '每次制作会消耗对应积分，可在会员中心查看积分余额和消费记录。门店用户可选择门店代付模式。',
    category: 'points',
  },
  {
    q: '积分不够怎么办？',
    a: '可以通过邀请好友、每日签到、完成指定任务获取积分。企业用户可联系客服充值。',
    category: 'points',
  },
  {
    q: '如何绑定门店？',
    a: '扫描门店提供的专属二维码即可绑定。绑定后部分服务可由门店代付积分，绑定有效期为30天。',
    category: 'account',
  },
  {
    q: '订单提交后多久能完成？',
    a: '喷墨打印一般1-3分钟，激光雕刻根据材质和复杂度不同，一般在2-5分钟。AI处理时间约30秒-1分钟。',
    category: 'print',
  },
  {
    q: '激光雕刻的精度如何？',
    a: '水晶内雕精度可达0.02mm，金属打标可达0.01mm，雕刻效果清晰细腻。建议使用高对比度的图片获得最佳效果。',
    category: 'laser',
  },
  {
    q: '支持的支付方式有哪些？',
    a: '目前支持微信支付和积分支付。门店用户支持门店代付模式。',
    category: 'points',
  },
]

const filteredFaq = computed(() => {
  let items = faqData
  if (activeTab.value !== 'all') {
    items = faqData.filter(f => f.category === activeTab.value)
  }
  return items
})

const searchResults = computed(() => {
  if (!searchQuery.value) return []
  const q = searchQuery.value.toLowerCase()
  return faqData.filter(
    f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
  )
})

function toggleFaq(idx: number) {
  expandedIdx.value = expandedIdx.value === idx ? -1 : idx
}

function toggleSearch(idx: number) {
  searchOpenIdx.value = searchOpenIdx.value === idx ? -1 : idx
}

function onSearch() {
  if (searchResults.value.length === 0) {
    uni.showToast({ title: '未找到相关问题', icon: 'none' })
  }
}
</script>

<script lang="ts">
export default {
  onShareAppMessage() {
    return {
      title: '31度激光雕刻 · 使用帮助与常见问题',
      path: '/pages/help/index',
    }
  },
  onShareTimeline() {
    return {
      title: '31度激光雕刻使用指南 · 从入门到精通',
    }
  },
}
</script>

<style lang="scss" scoped>
.page-help {
  min-height: 100vh;
  background: $bg-dark;
  padding: 24rpx;
  padding-bottom: 80rpx;
}

/* Search */
.search-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: $bg-card;
  padding: 16rpx 24rpx;
  border-radius: $radius-md;
  margin-bottom: 20rpx;
}

.search-icon { font-size: 28rpx; }

.search-input {
  flex: 1;
  font-size: 26rpx;
  color: $text-primary;
}

/* FAQ Tabs */
.faq-tabs {
  white-space: nowrap;
  margin-bottom: 20rpx;
}

.faq-tab-list {
  display: flex;
  gap: 12rpx;
}

.faq-tab {
  display: inline-block;
  padding: 14rpx 24rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  color: $text-secondary;
  background: $bg-card;

  &.active {
    color: $primary;
    background: rgba($primary, 0.1);
  }
}

/* FAQ List */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 32rpx;
}

.faq-card {
  background: $bg-card;
  border-radius: $radius-md;
  overflow: hidden;
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  gap: 16rpx;

  &:active { background: $bg-card-hover; }
}

.faq-q {
  flex: 1;
  font-size: 26rpx;
  font-weight: 600;
  color: $text-primary;
  line-height: 1.5;
}

.faq-arrow {
  font-size: 28rpx;
  color: $text-muted;
  transition: transform 0.2s;

  &.open { transform: rotate(180deg); }
}

.faq-answer {
  padding: 0 24rpx 24rpx;
  border-top: 1rpx solid $border-subtle;
  padding-top: 16rpx;
}

.faq-a {
  font-size: 24rpx;
  color: $text-secondary;
  line-height: 1.8;
}

/* Search Results */
.search-results {
  margin-bottom: 32rpx;
}

.results-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-primary;
  display: block;
  margin-bottom: 16rpx;
}

/* Contact */
.contact-section {
  margin-top: 8rpx;
}

.contact-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-primary;
  display: block;
  margin-bottom: 16rpx;
}

.contact-cards {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12rpx;
}

.contact-card {
  background: $bg-card;
  border-radius: $radius-md;
  padding: 24rpx 12rpx;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.contact-icon { font-size: 36rpx; }

.contact-label {
  font-size: 22rpx;
  color: $text-secondary;
}

.contact-value {
  font-size: 20rpx;
  color: $primary;
  font-weight: 500;
}
</style>

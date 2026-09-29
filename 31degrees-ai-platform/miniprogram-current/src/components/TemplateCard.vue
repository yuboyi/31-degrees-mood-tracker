<template>
  <view class="template-card" @tap="$emit('tap')">
    <image
      :src="previewUrl"
      class="template-preview"
      mode="aspectFill"
      lazy-load
    />
    <view class="template-info">
      <text class="template-name">{{ name }}</text>
      <view class="template-bottom">
        <text class="template-cost">{{ pointsCost }} 积分</text>
        <view class="template-tags" v-if="tags && tags.length">
          <text
            v-for="tag in tags.slice(0, 3)"
            :key="tag"
            class="template-tag"
          >{{ tag }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  id: number
  name: string
  previewUrl: string
  pointsCost: number
  tags?: string[]
  category?: string
}>()

defineEmits<{
  tap: []
}>()
</script>

<style lang="scss" scoped>
.template-card {
  background: $bg-card;
  border-radius: $radius-md;
  overflow: hidden;
  box-shadow: $shadow-card;

  &:active {
    transform: scale(0.97);
  }
}

.template-preview {
  width: 100%;
  aspect-ratio: 3/4;
  display: block;
}

.template-info {
  padding: 16rpx;
}

.template-name {
  font-size: 28rpx;
  font-weight: 600;
  color: $text-primary;
}

.template-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8rpx;
}

.template-cost {
  font-size: 22rpx;
  color: $accent;
  font-weight: 600;
}

.template-tags {
  display: flex;
  gap: 6rpx;
}

.template-tag {
  font-size: 18rpx;
  color: $text-secondary;
  background: $bg-card-hover;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}
</style>

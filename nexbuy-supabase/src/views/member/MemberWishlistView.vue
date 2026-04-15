<template>
  <div class="page-container">
    <n-space vertical size="large">
      <h1>{{ t('member.wishlist') }}</h1>

      <n-spin :show="loading">
        <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen" :cols-s="2" :cols-xs="1">
          <n-gi v-for="item in wishlist" :key="item.productId">
            <n-card hoverable style="cursor: pointer;" @click="router.push({ name: 'ProductDetail', params: { id: item.productId } })">
              <template #cover>
                <n-image
                  :src="item.imageUrl"
                  :fallback-src="'https://via.placeholder.com/300x200'"
                  object-fit="cover"
                  height="200"
                  width="100%"
                  preview-disabled
                  lazy
                />
              </template>
              <n-space vertical size="small">
                <div style="font-weight: 600; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{ item.name }}
                </div>
                <n-space justify="space-between" align="center">
                  <span style="color: #e74c3c; font-weight: bold; font-size: 16px;">
                    ${{ item.price }}
                  </span>
                  <n-button size="small" type="error" @click.stop="handleRemove(item.productId)">
                    {{ t('member.removeWishlist') }}
                  </n-button>
                </n-space>
              </n-space>
            </n-card>
          </n-gi>
        </n-grid>
        <n-empty v-if="!loading && wishlist.length === 0" :description="t('member.wishlistEmpty')">
          <template #extra>
            <n-button @click="router.push({ name: 'ProductList' })">{{ t('cart.continueShopping') }}</n-button>
          </template>
        </n-empty>
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NGrid, NGi, NImage, NSpin, NEmpty } from 'naive-ui'
import { membersApi, type WishlistItem } from '@/api/members'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const wishlist = ref<WishlistItem[]>([])

async function fetchWishlist() {
  loading.value = true
  try {
    const res = await membersApi.getWishlist()
    wishlist.value = res.data || []
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function handleRemove(productId: string) {
  try {
    await membersApi.removeFromWishlist(productId)
    wishlist.value = wishlist.value.filter(w => w.productId !== productId)
    message.success(t('common.success'))
  } catch {
    message.error(t('common.error'))
  }
}

onMounted(() => {
  fetchWishlist()
})
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}
</style>

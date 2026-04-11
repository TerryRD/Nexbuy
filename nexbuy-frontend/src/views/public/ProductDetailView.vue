<template>
  <div class="page-container">
    <n-spin :show="loading">
      <n-space vertical size="large" v-if="product">
        <!-- Breadcrumb -->
        <n-breadcrumb>
          <n-breadcrumb-item @click="router.push({ name: 'Home' })">{{ t('nav.home') }}</n-breadcrumb-item>
          <n-breadcrumb-item @click="router.push({ name: 'ProductList' })">{{ t('nav.products') }}</n-breadcrumb-item>
          <n-breadcrumb-item>{{ productName }}</n-breadcrumb-item>
        </n-breadcrumb>

        <n-grid :cols="24" :x-gap="32">
          <!-- Images -->
          <n-gi :span="12">
            <n-carousel v-if="product.images && product.images.length > 0" show-arrow dot-type="line" style="border-radius: 8px; overflow: hidden;">
              <n-image
                v-for="img in sortedImages"
                :key="img.id"
                :src="img.url"
                :fallback-src="'https://via.placeholder.com/600x400'"
                object-fit="contain"
                height="400"
                width="100%"
              />
            </n-carousel>
            <n-image
              v-else
              src="https://via.placeholder.com/600x400"
              object-fit="contain"
              height="400"
              width="100%"
            />
          </n-gi>

          <!-- Info -->
          <n-gi :span="12">
            <n-space vertical size="large">
              <h1 style="margin: 0;">{{ productName }}</h1>

              <div style="font-size: 28px; font-weight: bold; color: #e74c3c;">
                ${{ selectedVariant ? (product.price + selectedVariant.priceAdjustment) : product.price }}
              </div>

              <n-space>
                <n-tag :type="product.stock > 0 ? 'success' : 'error'">
                  {{ product.stock > 0 ? t('product.inStock') : t('product.outOfStock') }}
                </n-tag>
                <n-tag v-if="product.type === 1" type="info">{{ t('product.digital') }}</n-tag>
                <n-tag v-else type="default">{{ t('product.physical') }}</n-tag>
              </n-space>

              <div v-if="product.stock > 0">
                {{ t('product.stock') }}: {{ effectiveStock }}
              </div>

              <!-- Variant Selector -->
              <div v-if="product.variants && product.variants.length > 0">
                <div style="margin-bottom: 8px; font-weight: 600;">{{ t('product.variant') }}</div>
                <n-select
                  v-model:value="selectedVariantId"
                  :options="variantOptions"
                  :placeholder="t('product.selectVariant')"
                  style="max-width: 300px;"
                />
              </div>

              <!-- Quantity -->
              <div>
                <div style="margin-bottom: 8px; font-weight: 600;">{{ t('product.quantity') }}</div>
                <n-input-number
                  v-model:value="quantity"
                  :min="1"
                  :max="effectiveStock"
                  style="max-width: 160px;"
                />
              </div>

              <!-- Actions -->
              <n-space>
                <n-button
                  type="primary"
                  size="large"
                  :disabled="product.stock <= 0"
                  @click="handleAddToCart"
                >
                  {{ t('product.addToCart') }}
                </n-button>
                <n-button
                  size="large"
                  :type="isWishlisted ? 'warning' : 'default'"
                  @click="toggleWishlist"
                >
                  {{ isWishlisted ? t('product.removeFromWishlist') : t('product.addToWishlist') }}
                </n-button>
              </n-space>

              <!-- Digital product info -->
              <n-card v-if="product.type === 1" size="small">
                <n-space vertical size="small">
                  <div v-if="product.maxDownloads">{{ t('product.maxDownloads') }}: {{ product.maxDownloads }}</div>
                  <div v-if="product.downloadExpiryHours">{{ t('product.downloadExpiry') }}: {{ product.downloadExpiryHours }}h</div>
                </n-space>
              </n-card>
            </n-space>
          </n-gi>
        </n-grid>

        <!-- Description Tabs -->
        <n-divider />
        <n-tabs type="line">
          <n-tab-pane
            v-for="trans in product.translations"
            :key="trans.locale"
            :name="trans.locale"
            :tab="localeLabel(trans.locale)"
          >
            <n-card>
              <h3>{{ trans.name }}</h3>
              <div v-html="trans.description" style="line-height: 1.8;"></div>
            </n-card>
          </n-tab-pane>
        </n-tabs>
      </n-space>

      <n-empty v-if="!loading && !product" :description="t('product.noProducts')" />
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NGrid, NGi, NImage, NSpin, NEmpty, NSelect, NInputNumber, NTag, NDivider, NTabs, NTabPane, NCarousel, NBreadcrumb, NBreadcrumbItem } from 'naive-ui'
import { productsApi, type ProductDetail } from '@/api/products'
import { membersApi } from '@/api/members'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const cartStore = useCartStore()
const authStore = useAuthStore()

const product = ref<ProductDetail | null>(null)
const loading = ref(false)
const quantity = ref(1)
const selectedVariantId = ref<string | null>(null)
const isWishlisted = ref(false)

const productName = computed(() => {
  if (!product.value) return ''
  const trans = product.value.translations.find(t => t.locale === locale.value)
    || product.value.translations[0]
  return trans?.name || ''
})

const sortedImages = computed(() => {
  if (!product.value?.images) return []
  return [...product.value.images].sort((a, b) => a.sortOrder - b.sortOrder)
})

const selectedVariant = computed(() => {
  if (!selectedVariantId.value || !product.value?.variants) return null
  return product.value.variants.find(v => v.id === selectedVariantId.value) || null
})

const effectiveStock = computed(() => {
  if (selectedVariant.value) return selectedVariant.value.stock
  return product.value?.stock || 0
})

const variantOptions = computed(() => {
  if (!product.value?.variants) return []
  return product.value.variants.map(v => ({
    label: `${v.variantName} (${v.priceAdjustment >= 0 ? '+' : ''}$${v.priceAdjustment})`,
    value: v.id,
    disabled: v.stock <= 0
  }))
})

function localeLabel(loc: string): string {
  const map: Record<string, string> = { 'zh-TW': '中文', 'en': 'English', 'ja': '日本語' }
  return map[loc] || loc
}

async function fetchProduct() {
  const id = route.params.id as string
  if (!id) return
  loading.value = true
  try {
    const res = await productsApi.getProduct(id)
    product.value = res.data || res
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function checkWishlist() {
  if (!authStore.isAuthenticated || !product.value) return
  try {
    const res = await membersApi.getWishlist()
    const wishlist = res.data || []
    isWishlisted.value = wishlist.some((w: any) => w.productId === product.value?.id)
  } catch {}
}

async function handleAddToCart() {
  if (!product.value) return
  try {
    const trans = product.value.translations.find(t => t.locale === locale.value)
      || product.value.translations[0]
    await cartStore.addItem(
      product.value.id,
      quantity.value,
      selectedVariantId.value || undefined,
      {
        productName: trans?.name || '',
        imageUrl: product.value.images?.[0]?.url || '',
        unitPrice: selectedVariant.value
          ? product.value.price + selectedVariant.value.priceAdjustment
          : product.value.price,
        stock: effectiveStock.value,
        type: product.value.type
      }
    )
    message.success(t('product.addedToCart'))
  } catch {
    message.error(t('common.error'))
  }
}

async function toggleWishlist() {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } })
    return
  }
  if (!product.value) return
  try {
    if (isWishlisted.value) {
      await membersApi.removeFromWishlist(product.value.id)
      isWishlisted.value = false
      message.success(t('member.removeWishlist'))
    } else {
      await membersApi.addToWishlist(product.value.id)
      isWishlisted.value = true
      message.success(t('product.addToWishlist'))
    }
  } catch {
    message.error(t('common.error'))
  }
}

watch(() => route.params.id, () => {
  fetchProduct()
})

onMounted(async () => {
  await fetchProduct()
  checkWishlist()
})
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}
</style>

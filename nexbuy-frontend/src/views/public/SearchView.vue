<template>
  <div class="page-container">
    <n-space vertical size="large">
      <n-breadcrumb>
        <n-breadcrumb-item @click="router.push({ name: 'Home' })">{{ t('nav.home') }}</n-breadcrumb-item>
        <n-breadcrumb-item>{{ t('product.searchResults') }}</n-breadcrumb-item>
      </n-breadcrumb>

      <h1>{{ t('product.searchResults') }}: "{{ query }}"</h1>
      <span v-if="!loading">{{ t('cart.itemCount', { count: totalCount }) }}</span>

      <n-spin :show="loading">
        <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen" :cols-s="2" :cols-xs="1">
          <n-gi v-for="product in products" :key="product.id">
            <n-card hoverable style="cursor: pointer;" @click="router.push({ name: 'ProductDetail', params: { id: product.id } })">
              <template #cover>
                <n-image
                  :src="product.imageUrl"
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
                  {{ product.name }}
                </div>
                <n-space justify="space-between" align="center">
                  <span style="color: #e74c3c; font-weight: bold; font-size: 16px;">
                    ${{ product.price }}
                  </span>
                  <n-button size="small" type="primary" @click.stop="handleAddToCart(product)">
                    {{ t('product.addToCart') }}
                  </n-button>
                </n-space>
              </n-space>
            </n-card>
          </n-gi>
        </n-grid>
        <n-empty v-if="!loading && products.length === 0" :description="t('product.noProducts')" />
      </n-spin>

      <n-space justify="center" v-if="totalCount > pageSize">
        <n-pagination
          v-model:page="currentPage"
          :page-count="Math.ceil(totalCount / pageSize)"
          @update:page="handlePageChange"
        />
      </n-space>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NGrid, NGi, NImage, NSpin, NEmpty, NPagination, NBreadcrumb, NBreadcrumbItem } from 'naive-ui'
import { productsApi, type ProductListItem } from '@/api/products'
import { useCartStore } from '@/stores/cart'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const cartStore = useCartStore()

const products = ref<ProductListItem[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(12)
const totalCount = ref(0)

const query = computed(() => (route.query.q as string) || '')

async function fetchProducts() {
  if (!query.value) return
  loading.value = true
  try {
    const res = await productsApi.searchProducts({
      q: query.value,
      page: currentPage.value,
      pageSize: pageSize.value
    })
    products.value = res.data?.items || res.data || []
    totalCount.value = res.data?.totalCount || products.value.length
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  currentPage.value = page
  fetchProducts()
}

async function handleAddToCart(product: ProductListItem) {
  try {
    await cartStore.addItem(product.id, 1, undefined, {
      productName: product.name,
      imageUrl: product.imageUrl,
      unitPrice: product.price,
      stock: product.stock,
      type: product.type
    })
    message.success(t('product.addedToCart'))
  } catch {
    message.error(t('common.error'))
  }
}

watch(() => route.query.q, () => {
  currentPage.value = 1
  fetchProducts()
})

onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}
</style>

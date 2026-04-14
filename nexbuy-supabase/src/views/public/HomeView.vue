<template>
  <div class="page-container">
    <n-space vertical size="large">
      <!-- Banner -->
      <n-card class="banner-card" :bordered="false">
        <n-space vertical align="center" justify="center" style="min-height: 200px; text-align: center;">
          <h1>{{ t('home.banner') }}</h1>
          <n-button type="primary" size="large" @click="router.push({ name: 'ProductList' })">
            {{ t('home.shopNow') }}
          </n-button>
        </n-space>
      </n-card>

      <!-- Featured Products -->
      <div>
        <n-space justify="space-between" align="center" style="margin-bottom: 16px;">
          <h2>{{ t('home.featuredProducts') }}</h2>
          <n-button text type="primary" @click="router.push({ name: 'ProductList' })">
            {{ t('home.viewAll') }}
          </n-button>
        </n-space>
        <n-spin :show="loading">
          <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen" :cols-s="2" :cols-xs="1">
            <n-gi v-for="product in featuredProducts" :key="product.id">
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
          <n-empty v-if="!loading && featuredProducts.length === 0" :description="t('product.noProducts')" />
        </n-spin>
      </div>

      <!-- New Arrivals -->
      <div>
        <n-space justify="space-between" align="center" style="margin-bottom: 16px;">
          <h2>{{ t('home.newArrivals') }}</h2>
          <n-button text type="primary" @click="router.push({ name: 'ProductList', query: { sort: 'newest' } })">
            {{ t('home.viewAll') }}
          </n-button>
        </n-space>
        <n-spin :show="loadingNew">
          <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen" :cols-s="2" :cols-xs="1">
            <n-gi v-for="product in newArrivals" :key="product.id">
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
                    <n-tag v-if="product.type === 1" size="small" type="info">{{ t('product.digital') }}</n-tag>
                  </n-space>
                </n-space>
              </n-card>
            </n-gi>
          </n-grid>
        </n-spin>
      </div>

      <!-- Categories -->
      <div>
        <h2 style="margin-bottom: 16px;">{{ t('nav.categories') }}</h2>
        <n-spin :show="loadingCategories">
          <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen" :cols-s="2" :cols-xs="1">
            <n-gi v-for="cat in categories" :key="cat.id">
              <n-card hoverable style="cursor: pointer; text-align: center;" @click="router.push({ name: 'Category', params: { slug: cat.slug } })">
                <h3>{{ cat.name }}</h3>
                <div v-if="cat.children && cat.children.length > 0" style="margin-top: 8px;">
                  <n-tag v-for="child in cat.children.slice(0, 3)" :key="child.id" size="small" style="margin: 2px;">
                    {{ child.name }}
                  </n-tag>
                </div>
              </n-card>
            </n-gi>
          </n-grid>
        </n-spin>
      </div>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NGrid, NGi, NImage, NTag, NSpin, NEmpty } from 'naive-ui'
import { productsApi, type ProductListItem, type Category } from '@/api/products'
import { useCartStore } from '@/stores/cart'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const cartStore = useCartStore()

const featuredProducts = ref<ProductListItem[]>([])
const newArrivals = ref<ProductListItem[]>([])
const categories = ref<Category[]>([])
const loading = ref(false)
const loadingNew = ref(false)
const loadingCategories = ref(false)

async function fetchFeatured() {
  loading.value = true
  try {
    const res = await productsApi.getProducts({ page: 1, pageSize: 8, sort: 'popular' })
    featuredProducts.value = res.data?.items || res.data || []
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function fetchNewArrivals() {
  loadingNew.value = true
  try {
    const res = await productsApi.getProducts({ page: 1, pageSize: 8, sort: 'newest' })
    newArrivals.value = res.data?.items || res.data || []
  } catch {
    message.error(t('common.error'))
  } finally {
    loadingNew.value = false
  }
}

async function fetchCategories() {
  loadingCategories.value = true
  try {
    const res = await productsApi.getCategories()
    categories.value = res.data || []
  } catch {
    message.error(t('common.error'))
  } finally {
    loadingCategories.value = false
  }
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

onMounted(() => {
  fetchFeatured()
  fetchNewArrivals()
  fetchCategories()
})
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}

.banner-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.banner-card h1 {
  color: white;
  font-size: 28px;
  margin: 0;
}
</style>

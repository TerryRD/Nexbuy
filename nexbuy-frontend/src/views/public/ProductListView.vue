<template>
  <div class="page-container">
    <n-space vertical size="large">
      <h1>{{ t('product.list') }}</h1>

      <n-grid :cols="24" :x-gap="24">
        <!-- Sidebar Filter -->
        <n-gi :span="6">
          <n-card :title="t('product.category')">
            <n-select
              v-model:value="selectedCategory"
              :options="categoryOptions"
              :placeholder="t('product.allCategories')"
              clearable
              @update:value="handleFilterChange"
            />
          </n-card>
        </n-gi>

        <!-- Product Grid -->
        <n-gi :span="18">
          <n-space vertical size="large">
            <!-- Sort -->
            <n-space justify="space-between" align="center">
              <span>{{ t('cart.itemCount', { count: totalCount }) }}</span>
              <n-select
                v-model:value="sortBy"
                :options="sortOptions"
                style="width: 200px;"
                @update:value="handleFilterChange"
              />
            </n-space>

            <!-- Products -->
            <n-spin :show="loading">
              <n-grid :cols="3" :x-gap="16" :y-gap="16" responsive="screen" :cols-s="2" :cols-xs="1">
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
                      <n-space>
                        <n-tag v-if="product.type === 1" size="small" type="info">{{ t('product.digital') }}</n-tag>
                        <n-tag v-if="product.stock <= 0" size="small" type="error">{{ t('product.outOfStock') }}</n-tag>
                      </n-space>
                    </n-space>
                  </n-card>
                </n-gi>
              </n-grid>
              <n-empty v-if="!loading && products.length === 0" :description="t('product.noProducts')" />
            </n-spin>

            <!-- Pagination -->
            <n-space justify="center" v-if="totalCount > pageSize">
              <n-pagination
                v-model:page="currentPage"
                :page-count="Math.ceil(totalCount / pageSize)"
                @update:page="handlePageChange"
              />
            </n-space>
          </n-space>
        </n-gi>
      </n-grid>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NGrid, NGi, NImage, NTag, NSpin, NEmpty, NSelect, NPagination } from 'naive-ui'
import { productsApi, type ProductListItem, type Category } from '@/api/products'
import { useCartStore } from '@/stores/cart'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const cartStore = useCartStore()

const products = ref<ProductListItem[]>([])
const categories = ref<Category[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(12)
const totalCount = ref(0)
const selectedCategory = ref<number | null>(null)
const sortBy = ref<string>('newest')

const sortOptions = computed(() => [
  { label: t('product.sortNewest'), value: 'newest' },
  { label: t('product.sortPriceAsc'), value: 'price_asc' },
  { label: t('product.sortPriceDesc'), value: 'price_desc' },
  { label: t('product.sortPopular'), value: 'popular' }
])

const categoryOptions = computed(() => {
  const opts: { label: string; value: number }[] = []
  function flatten(cats: Category[], prefix = '') {
    for (const c of cats) {
      opts.push({ label: prefix + c.name, value: c.id })
      if (c.children?.length) flatten(c.children, prefix + '  ')
    }
  }
  flatten(categories.value)
  return opts
})

async function fetchProducts() {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
      sort: sortBy.value
    }
    if (selectedCategory.value) params.categoryId = selectedCategory.value
    const res = await productsApi.getProducts(params)
    products.value = res.data?.items || res.data || []
    totalCount.value = res.data?.totalCount || products.value.length
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  try {
    const res = await productsApi.getCategories()
    categories.value = res.data || []
  } catch {}
}

function handleFilterChange() {
  currentPage.value = 1
  fetchProducts()
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

onMounted(() => {
  if (route.query.sort) sortBy.value = route.query.sort as string
  if (route.query.category) selectedCategory.value = Number(route.query.category)
  fetchCategories()
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

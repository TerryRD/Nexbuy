<template>
  <div class="page-container">
    <n-space vertical size="large">
      <n-space justify="space-between" align="center">
        <h1>{{ t('admin.products') }}</h1>
        <n-button type="primary" @click="router.push({ name: 'AdminProductCreate' })">
          {{ t('admin.addProduct') }}
        </n-button>
      </n-space>

      <!-- Filters -->
      <n-space>
        <n-input v-model:value="searchText" :placeholder="t('product.searchPlaceholder')" style="width: 240px;" clearable @clear="handleSearch" @keyup.enter="handleSearch" />
        <n-button @click="handleSearch">{{ t('common.search') }}</n-button>
        <n-select
          v-model:value="statusFilter"
          :options="statusOptions"
          :placeholder="t('admin.productStatus')"
          style="width: 150px;"
          clearable
          @update:value="handleSearch"
        />
      </n-space>

      <!-- Table -->
      <n-spin :show="loading">
        <n-data-table
          :columns="columns"
          :data="products"
          :row-key="(row: any) => row.id"
          :checked-row-keys="checkedKeys"
          @update:checked-row-keys="(keys: any) => checkedKeys = keys"
        />
      </n-spin>

      <!-- Bulk Actions -->
      <n-space v-if="checkedKeys.length > 0">
        <n-popconfirm @positive-click="handleBulkDelete">
          <template #trigger>
            <n-button type="error">{{ t('common.delete') }} ({{ checkedKeys.length }})</n-button>
          </template>
          {{ t('common.confirm') }}?
        </n-popconfirm>
      </n-space>

      <!-- Pagination -->
      <n-space justify="center" v-if="totalCount > pageSize">
        <n-pagination
          v-model:page="currentPage"
          :page-count="Math.ceil(totalCount / pageSize)"
          @update:page="fetchProducts"
        />
      </n-space>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NSpace, NButton, NInput, NSelect, NDataTable, NSpin, NPagination, NTag, NPopconfirm, type DataTableColumns } from 'naive-ui'
import { adminProductsApi } from '@/api/admin'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const products = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(15)
const totalCount = ref(0)
const searchText = ref('')
const statusFilter = ref<number | null>(null)
const checkedKeys = ref<string[]>([])

const statusOptions = [
  { label: t('admin.active'), value: 1 },
  { label: t('admin.inactive'), value: 0 }
]

const columns: DataTableColumns<any> = [
  { type: 'selection' },
  { title: () => t('admin.productName'), key: 'name', ellipsis: { tooltip: true } },
  { title: () => t('admin.sku'), key: 'sku', width: 120 },
  {
    title: () => t('product.price'),
    key: 'price',
    width: 100,
    render(row) { return `$${row.price}` }
  },
  { title: () => t('product.stock'), key: 'stock', width: 80 },
  {
    title: () => t('admin.productType'),
    key: 'type',
    width: 100,
    render(row) {
      return h(NTag, { size: 'small', type: row.type === 1 ? 'info' : 'default' }, {
        default: () => row.type === 1 ? t('product.digital') : t('product.physical')
      })
    }
  },
  {
    title: () => t('common.status'),
    key: 'status',
    width: 80,
    render(row) {
      return h(NTag, { size: 'small', type: row.status === 1 ? 'success' : 'default' }, {
        default: () => row.status === 1 ? t('admin.active') : t('admin.inactive')
      })
    }
  },
  {
    title: () => t('common.actions'),
    key: 'actions',
    width: 140,
    render(row) {
      return h(NSpace, {}, {
        default: () => [
          h(NButton, {
            size: 'small', type: 'primary', text: true,
            onClick: () => router.push({ name: 'AdminProductEdit', params: { id: row.id } })
          }, { default: () => t('common.edit') }),
          h(NPopconfirm, {
            onPositiveClick: () => handleDelete(row.id)
          }, {
            trigger: () => h(NButton, { size: 'small', type: 'error', text: true }, { default: () => t('common.delete') }),
            default: () => t('common.confirm') + '?'
          })
        ]
      })
    }
  }
]

function handleSearch() {
  currentPage.value = 1
  fetchProducts()
}

async function fetchProducts() {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize: pageSize.value }
    if (searchText.value) params.search = searchText.value
    if (statusFilter.value !== null) params.status = statusFilter.value
    const res = await adminProductsApi.getProducts(params)
    products.value = res.data?.items || res.data || []
    totalCount.value = res.data?.totalCount || products.value.length
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function handleDelete(id: string) {
  try {
    await adminProductsApi.deleteProduct(id)
    message.success(t('common.success'))
    fetchProducts()
  } catch {
    message.error(t('common.error'))
  }
}

async function handleBulkDelete() {
  try {
    await Promise.all(checkedKeys.value.map(id => adminProductsApi.deleteProduct(id)))
    checkedKeys.value = []
    message.success(t('common.success'))
    fetchProducts()
  } catch {
    message.error(t('common.error'))
  }
}

onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
}
</style>

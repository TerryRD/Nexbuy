<template>
  <div class="page-container">
    <n-space vertical size="large">
      <n-space justify="space-between" align="center">
        <h1>{{ t('admin.orderManagement') }}</h1>
        <n-button @click="handleExport">{{ t('admin.exportExcel') }}</n-button>
      </n-space>

      <!-- Filters -->
      <n-space>
        <n-select
          v-model:value="statusFilter"
          :options="statusOptions"
          :placeholder="t('order.status')"
          style="width: 150px;"
          clearable
          @update:value="handleSearch"
        />
        <n-date-picker
          v-model:value="dateRange"
          type="daterange"
          clearable
          @update:value="handleSearch"
        />
      </n-space>

      <!-- Table -->
      <n-spin :show="loading">
        <n-data-table
          :columns="columns"
          :data="orders"
          :row-key="(row: any) => row.orderNo"
        />
        <n-empty v-if="!loading && orders.length === 0" :description="t('order.noOrders')" />
      </n-spin>

      <n-space justify="center" v-if="totalCount > pageSize">
        <n-pagination
          v-model:page="currentPage"
          :page-count="Math.ceil(totalCount / pageSize)"
          @update:page="fetchOrders"
        />
      </n-space>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, h, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NSpace, NButton, NSelect, NDatePicker, NDataTable, NSpin, NEmpty, NPagination, NTag, type DataTableColumns } from 'naive-ui'
import { adminOrdersApi } from '@/api/admin'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const orders = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(15)
const totalCount = ref(0)
const statusFilter = ref<number | null>(null)
const dateRange = ref<[number, number] | null>(null)

const statusOptions = computed(() => [
  { label: t('common.all'), value: null },
  { label: t('order.statusPending'), value: 0 },
  { label: t('order.statusPaid'), value: 1 },
  { label: t('order.statusProcessing'), value: 2 },
  { label: t('order.statusShipped'), value: 3 },
  { label: t('order.statusCompleted'), value: 4 },
  { label: t('order.statusCancelled'), value: 5 }
])

const statusMap: Record<number, { label: string; type: 'default' | 'info' | 'success' | 'warning' | 'error' }> = {
  0: { label: 'order.statusPending', type: 'warning' },
  1: { label: 'order.statusPaid', type: 'info' },
  2: { label: 'order.statusProcessing', type: 'info' },
  3: { label: 'order.statusShipped', type: 'success' },
  4: { label: 'order.statusCompleted', type: 'success' },
  5: { label: 'order.statusCancelled', type: 'error' }
}

const paymentMap: Record<number, { label: string; type: 'default' | 'info' | 'success' | 'warning' | 'error' }> = {
  0: { label: 'order.paymentUnpaid', type: 'warning' },
  1: { label: 'order.paymentPaid', type: 'success' },
  2: { label: 'order.paymentRefunding', type: 'info' },
  3: { label: 'order.paymentRefunded', type: 'default' }
}

const columns: DataTableColumns<any> = [
  { title: () => t('order.orderNo'), key: 'orderNo', width: 160 },
  { title: () => t('auth.name'), key: 'customerName', width: 100, ellipsis: { tooltip: true } },
  {
    title: () => t('order.totalAmount'),
    key: 'totalAmount',
    width: 100,
    render(row) { return `$${row.totalAmount}` }
  },
  {
    title: () => t('order.status'),
    key: 'status',
    width: 100,
    render(row) {
      const s = statusMap[row.status] || { label: 'common.noData', type: 'default' as const }
      return h(NTag, { size: 'small', type: s.type }, { default: () => t(s.label) })
    }
  },
  {
    title: () => t('order.paymentStatus'),
    key: 'paymentStatus',
    width: 100,
    render(row) {
      const p = paymentMap[row.paymentStatus] || { label: 'common.noData', type: 'default' as const }
      return h(NTag, { size: 'small', type: p.type }, { default: () => t(p.label) })
    }
  },
  {
    title: () => t('order.orderDate'),
    key: 'createdAt',
    width: 120,
    render(row) { return new Date(row.createdAt).toLocaleDateString() }
  },
  {
    title: () => t('common.actions'),
    key: 'actions',
    width: 80,
    render(row) {
      return h(NButton, {
        size: 'small', text: true, type: 'primary',
        onClick: () => router.push({ name: 'AdminOrderDetail', params: { orderNo: row.orderNo } })
      }, { default: () => t('order.orderDetail') })
    }
  }
]

function handleSearch() {
  currentPage.value = 1
  fetchOrders()
}

async function fetchOrders() {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize: pageSize.value }
    if (statusFilter.value !== null) params.status = statusFilter.value
    if (dateRange.value) {
      params.startDate = new Date(dateRange.value[0]).toISOString().split('T')[0]
      params.endDate = new Date(dateRange.value[1]).toISOString().split('T')[0]
    }
    const res = await adminOrdersApi.getOrders(params)
    orders.value = res.data?.items || res.data || []
    totalCount.value = res.data?.totalCount || orders.value.length
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function handleExport() {
  try {
    const params: any = {}
    if (statusFilter.value !== null) params.status = statusFilter.value
    if (dateRange.value) {
      params.startDate = new Date(dateRange.value[0]).toISOString().split('T')[0]
      params.endDate = new Date(dateRange.value[1]).toISOString().split('T')[0]
    }
    const res = await adminOrdersApi.exportOrders(params)
    const blob = new Blob([res as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `orders_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch {
    message.error(t('common.error'))
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
}
</style>

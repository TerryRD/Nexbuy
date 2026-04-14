<template>
  <div class="page-container">
    <n-space vertical size="large">
      <h1>{{ t('order.myOrders') }}</h1>

      <!-- Status Tabs -->
      <n-tabs v-model:value="activeTab" type="line" @update:value="handleTabChange">
        <n-tab-pane :name="'all'" :tab="t('common.all')" />
        <n-tab-pane :name="'0'" :tab="t('order.statusPending')" />
        <n-tab-pane :name="'1'" :tab="t('order.statusPaid')" />
        <n-tab-pane :name="'2'" :tab="t('order.statusProcessing')" />
        <n-tab-pane :name="'3'" :tab="t('order.statusShipped')" />
        <n-tab-pane :name="'4'" :tab="t('order.statusCompleted')" />
        <n-tab-pane :name="'5'" :tab="t('order.statusCancelled')" />
      </n-tabs>

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
import { ref, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NSpace, NButton, NDataTable, NSpin, NEmpty, NTabs, NTabPane, NPagination, NTag, type DataTableColumns } from 'naive-ui'
import { ordersApi, type OrderSummary } from '@/api/orders'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const orders = ref<OrderSummary[]>([])
const activeTab = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

const statusMap: Record<number, { label: string; type: 'default' | 'info' | 'success' | 'warning' | 'error' }> = {
  0: { label: 'order.statusPending', type: 'warning' },
  1: { label: 'order.statusPaid', type: 'info' },
  2: { label: 'order.statusProcessing', type: 'info' },
  3: { label: 'order.statusShipped', type: 'success' },
  4: { label: 'order.statusCompleted', type: 'success' },
  5: { label: 'order.statusCancelled', type: 'error' }
}

const columns: DataTableColumns<OrderSummary> = [
  {
    title: () => t('order.orderNo'),
    key: 'orderNo',
    width: 180
  },
  {
    title: () => t('order.orderDate'),
    key: 'createdAt',
    width: 120,
    render(row) {
      return new Date(row.createdAt).toLocaleDateString()
    }
  },
  {
    title: () => t('order.totalAmount'),
    key: 'totalAmount',
    width: 120,
    render(row) { return `$${row.totalAmount}` }
  },
  {
    title: () => t('order.status'),
    key: 'status',
    width: 120,
    render(row) {
      const s = statusMap[row.status] || { label: 'common.noData', type: 'default' as const }
      return h(NTag, { size: 'small', type: s.type }, { default: () => t(s.label) })
    }
  },
  {
    title: () => t('common.actions'),
    key: 'actions',
    width: 100,
    render(row) {
      return h(NButton, {
        size: 'small',
        type: 'primary',
        text: true,
        onClick: () => router.push({ name: 'MemberOrderDetail', params: { orderNo: row.orderNo } })
      }, { default: () => t('order.orderDetail') })
    }
  }
]

function handleTabChange(tab: string) {
  currentPage.value = 1
  fetchOrders()
}

async function fetchOrders() {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize: pageSize.value }
    if (activeTab.value !== 'all') params.status = Number(activeTab.value)
    const res = await ordersApi.getOrders(params)
    orders.value = res.data?.items || res.data || []
    totalCount.value = res.data?.totalCount || orders.value.length
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.page-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 16px;
}
</style>

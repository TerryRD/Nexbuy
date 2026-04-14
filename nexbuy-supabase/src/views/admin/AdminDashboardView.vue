<template>
  <div class="page-container">
    <n-space vertical size="large">
      <h1>{{ t('admin.dashboard') }}</h1>

      <n-spin :show="loading">
        <!-- Stats Cards -->
        <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen" :cols-s="2" :cols-xs="1">
          <n-gi>
            <n-card>
              <n-statistic :label="t('admin.todayOrders')" :value="stats.todayOrders" />
            </n-card>
          </n-gi>
          <n-gi>
            <n-card>
              <n-statistic :label="t('admin.todayRevenue')" :value="stats.todayRevenue" prefix="$" />
            </n-card>
          </n-gi>
          <n-gi>
            <n-card>
              <n-statistic :label="t('admin.totalMembers')" :value="stats.totalMembers" />
            </n-card>
          </n-gi>
          <n-gi>
            <n-card>
              <n-statistic :label="t('admin.totalProducts')" :value="stats.totalProducts" />
            </n-card>
          </n-gi>
        </n-grid>

        <!-- Recent Orders -->
        <n-card :title="t('member.recentOrders')" style="margin-top: 24px;">
          <n-data-table
            :columns="columns"
            :data="recentOrders"
            :row-key="(row: any) => row.orderNo"
            size="small"
          />
          <n-empty v-if="!loading && recentOrders.length === 0" :description="t('order.noOrders')" />
        </n-card>
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NGrid, NGi, NStatistic, NDataTable, NSpin, NEmpty, NTag, type DataTableColumns } from 'naive-ui'
import { adminOrdersApi } from '@/api/admin'
import { adminProductsApi, adminMembersApi } from '@/api/admin'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const stats = ref({
  todayOrders: 0,
  todayRevenue: 0,
  totalMembers: 0,
  totalProducts: 0
})
const recentOrders = ref<any[]>([])

const statusMap: Record<number, { label: string; type: 'default' | 'info' | 'success' | 'warning' | 'error' }> = {
  0: { label: 'order.statusPending', type: 'warning' },
  1: { label: 'order.statusPaid', type: 'info' },
  2: { label: 'order.statusProcessing', type: 'info' },
  3: { label: 'order.statusShipped', type: 'success' },
  4: { label: 'order.statusCompleted', type: 'success' },
  5: { label: 'order.statusCancelled', type: 'error' }
}

const columns: DataTableColumns<any> = [
  { title: () => t('order.orderNo'), key: 'orderNo', width: 160 },
  {
    title: () => t('order.orderDate'),
    key: 'createdAt',
    width: 120,
    render(row) { return new Date(row.createdAt).toLocaleDateString() }
  },
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

async function fetchDashboard() {
  loading.value = true
  try {
    const [ordersRes, productsRes, membersRes] = await Promise.allSettled([
      adminOrdersApi.getOrders({ page: 1, pageSize: 10 }),
      adminProductsApi.getProducts({ page: 1, pageSize: 1 }),
      adminMembersApi.getMembers({ page: 1, pageSize: 1 })
    ])

    if (ordersRes.status === 'fulfilled') {
      const data = ordersRes.value.data || ordersRes.value
      recentOrders.value = (data?.items || data || []).slice(0, 10)
      // Calculate today stats from available data
      const today = new Date().toISOString().split('T')[0]
      const todayOrders = recentOrders.value.filter((o: any) => o.createdAt?.startsWith(today))
      stats.value.todayOrders = todayOrders.length
      stats.value.todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
    }
    if (productsRes.status === 'fulfilled') {
      stats.value.totalProducts = productsRes.value.data?.totalCount || 0
    }
    if (membersRes.status === 'fulfilled') {
      stats.value.totalMembers = membersRes.value.data?.totalCount || 0
    }
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboard()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
}
</style>

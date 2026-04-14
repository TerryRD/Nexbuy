<template>
  <div class="page-container">
    <n-space vertical size="large">
      <h1>{{ t('admin.salesReport') }}</h1>

      <!-- Date Range -->
      <n-space align="center">
        <n-date-picker v-model:value="dateRange" type="daterange" @update:value="fetchReport" />
        <n-button @click="handleExport">{{ t('admin.exportExcel') }}</n-button>
      </n-space>

      <n-spin :show="loading">
        <!-- Summary Cards -->
        <n-grid :cols="3" :x-gap="16" :y-gap="16" responsive="screen" :cols-xs="1">
          <n-gi>
            <n-card>
              <n-statistic :label="t('admin.revenue')" :value="summary.totalRevenue" prefix="$" />
            </n-card>
          </n-gi>
          <n-gi>
            <n-card>
              <n-statistic :label="t('admin.orderCount')" :value="summary.totalOrders" />
            </n-card>
          </n-gi>
          <n-gi>
            <n-card>
              <n-statistic :label="t('admin.todayRevenue')" :value="summary.averageOrder" prefix="$" />
            </n-card>
          </n-gi>
        </n-grid>

        <!-- Data Table -->
        <n-card :title="t('admin.revenue')" style="margin-top: 16px;">
          <n-data-table
            :columns="columns"
            :data="reportData"
            :row-key="(row: any) => row.date"
            size="small"
          />
          <n-empty v-if="!loading && reportData.length === 0" :description="t('common.noData')" />
        </n-card>
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NGrid, NGi, NStatistic, NDatePicker, NDataTable, NSpin, NEmpty, type DataTableColumns } from 'naive-ui'
import { adminReportsApi } from '@/api/admin'

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const reportData = ref<any[]>([])
const summary = ref({ totalRevenue: 0, totalOrders: 0, averageOrder: 0 })

// Default to last 30 days
const now = Date.now()
const dateRange = ref<[number, number]>([now - 30 * 24 * 60 * 60 * 1000, now])

const columns: DataTableColumns<any> = [
  { title: () => t('order.orderDate'), key: 'date', width: 120 },
  { title: () => t('admin.orderCount'), key: 'orderCount', width: 100 },
  {
    title: () => t('admin.revenue'),
    key: 'revenue',
    width: 120,
    render(row) { return `$${row.revenue?.toFixed(2) || 0}` }
  }
]

async function fetchReport() {
  if (!dateRange.value) return
  loading.value = true
  try {
    const params = {
      startDate: new Date(dateRange.value[0]).toISOString().split('T')[0],
      endDate: new Date(dateRange.value[1]).toISOString().split('T')[0]
    }
    const res = await adminReportsApi.getSales(params)
    const data = res.data || res
    reportData.value = data.items || data.daily || data || []
    summary.value = {
      totalRevenue: data.totalRevenue || reportData.value.reduce((s: number, r: any) => s + (r.revenue || 0), 0),
      totalOrders: data.totalOrders || reportData.value.reduce((s: number, r: any) => s + (r.orderCount || 0), 0),
      averageOrder: data.averageOrder || (summary.value.totalOrders > 0 ? Math.round(summary.value.totalRevenue / summary.value.totalOrders) : 0)
    }
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function handleExport() {
  if (!dateRange.value) return
  try {
    const params = {
      startDate: new Date(dateRange.value[0]).toISOString().split('T')[0],
      endDate: new Date(dateRange.value[1]).toISOString().split('T')[0]
    }
    const res = await adminReportsApi.exportSales(params)
    const blob = new Blob([res as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `sales_report_${params.startDate}_${params.endDate}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch {
    message.error(t('common.error'))
  }
}

onMounted(() => {
  fetchReport()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
}
</style>

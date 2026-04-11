<template>
  <div class="page-container">
    <n-space vertical size="large">
      <h1>{{ t('admin.orderTrend') }}</h1>

      <!-- Date Range -->
      <n-space align="center">
        <n-date-picker v-model:value="dateRange" type="daterange" @update:value="fetchReport" />
      </n-space>

      <n-spin :show="loading">
        <!-- Summary -->
        <n-grid :cols="2" :x-gap="16" :y-gap="16" responsive="screen" :cols-xs="1">
          <n-gi>
            <n-card>
              <n-statistic :label="t('admin.orderCount')" :value="totalOrders" />
            </n-card>
          </n-gi>
          <n-gi>
            <n-card>
              <n-statistic :label="t('admin.todayOrders')" :value="averagePerDay" />
            </n-card>
          </n-gi>
        </n-grid>

        <!-- Data Table -->
        <n-card style="margin-top: 16px;">
          <n-data-table
            :columns="columns"
            :data="trendData"
            :row-key="(row: any) => row.date"
            size="small"
          />
          <n-empty v-if="!loading && trendData.length === 0" :description="t('common.noData')" />
        </n-card>
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NGrid, NGi, NStatistic, NDatePicker, NDataTable, NSpin, NEmpty, type DataTableColumns } from 'naive-ui'
import { adminReportsApi } from '@/api/admin'

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const trendData = ref<any[]>([])

const now = Date.now()
const dateRange = ref<[number, number]>([now - 30 * 24 * 60 * 60 * 1000, now])

const totalOrders = computed(() => trendData.value.reduce((sum, r) => sum + (r.orderCount || 0), 0))
const averagePerDay = computed(() => trendData.value.length > 0 ? Math.round(totalOrders.value / trendData.value.length) : 0)

const columns: DataTableColumns<any> = [
  { title: () => t('order.orderDate'), key: 'date', width: 120 },
  { title: () => t('admin.orderCount'), key: 'orderCount', width: 120 }
]

async function fetchReport() {
  if (!dateRange.value) return
  loading.value = true
  try {
    const params = {
      startDate: new Date(dateRange.value[0]).toISOString().split('T')[0],
      endDate: new Date(dateRange.value[1]).toISOString().split('T')[0]
    }
    const res = await adminReportsApi.getOrderTrend(params)
    trendData.value = res.data?.items || res.data || []
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
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

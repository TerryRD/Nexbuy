<template>
  <div class="page-container">
    <n-space vertical size="large">
      <h1>{{ t('admin.topProducts') }}</h1>

      <!-- Date Range -->
      <n-space align="center">
        <n-date-picker v-model:value="dateRange" type="daterange" @update:value="fetchReport" />
      </n-space>

      <n-spin :show="loading">
        <n-card>
          <n-data-table
            :columns="columns"
            :data="topProducts"
            :row-key="(row: any) => row.productId || row.rank"
            size="small"
          />
          <n-empty v-if="!loading && topProducts.length === 0" :description="t('common.noData')" />
        </n-card>
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NDatePicker, NDataTable, NSpin, NEmpty, type DataTableColumns } from 'naive-ui'
import { adminReportsApi } from '@/api/admin'

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const topProducts = ref<any[]>([])

const now = Date.now()
const dateRange = ref<[number, number]>([now - 30 * 24 * 60 * 60 * 1000, now])

const columns: DataTableColumns<any> = [
  {
    title: '#',
    key: 'rank',
    width: 60,
    render(_row, index) { return index + 1 }
  },
  {
    title: () => t('admin.productName'),
    key: 'productName',
    ellipsis: { tooltip: true }
  },
  {
    title: () => t('product.quantity'),
    key: 'quantitySold',
    width: 120
  },
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
    const res = await adminReportsApi.getTopProducts(params)
    topProducts.value = (res.data?.items || res.data || []).slice(0, 10)
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

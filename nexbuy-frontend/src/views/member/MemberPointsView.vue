<template>
  <div class="page-container">
    <n-space vertical size="large">
      <h1>{{ t('member.points') }}</h1>

      <!-- Balance -->
      <n-card>
        <n-statistic :label="t('member.pointBalance')" :value="pointBalance" />
      </n-card>

      <!-- History -->
      <n-card :title="t('member.pointHistory')">
        <n-spin :show="loading">
          <n-data-table
            :columns="columns"
            :data="history"
            :row-key="(row: any) => row.id"
          />
          <n-empty v-if="!loading && history.length === 0" :description="t('member.noPoints')" />
        </n-spin>

        <n-space justify="center" style="margin-top: 16px;" v-if="totalCount > pageSize">
          <n-pagination
            v-model:page="currentPage"
            :page-count="Math.ceil(totalCount / pageSize)"
            @update:page="fetchPoints"
          />
        </n-space>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NStatistic, NDataTable, NSpin, NEmpty, NPagination, NTag, type DataTableColumns } from 'naive-ui'
import { membersApi, type PointHistory } from '@/api/members'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const message = useMessage()
const authStore = useAuthStore()

const loading = ref(false)
const history = ref<PointHistory[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)
const pointBalance = ref(authStore.user?.pointBalance || 0)

const typeMap: Record<number, { label: string; type: 'success' | 'warning' | 'error' | 'info' }> = {
  0: { label: 'member.pointEarn', type: 'success' },
  1: { label: 'member.pointRedeem', type: 'warning' },
  2: { label: 'member.pointExpire', type: 'error' },
  3: { label: 'member.pointAdjust', type: 'info' }
}

const columns: DataTableColumns<PointHistory> = [
  {
    title: () => t('order.orderDate'),
    key: 'createdAt',
    width: 120,
    render(row) { return new Date(row.createdAt).toLocaleDateString() }
  },
  {
    title: () => t('common.status'),
    key: 'type',
    width: 100,
    render(row) {
      const tm = typeMap[row.type] || { label: 'common.noData', type: 'info' as const }
      return h(NTag, { size: 'small', type: tm.type }, { default: () => t(tm.label) })
    }
  },
  {
    title: () => t('member.points'),
    key: 'amount',
    width: 100,
    render(row) {
      const color = row.amount > 0 ? '#18a058' : '#d03050'
      return h('span', { style: { color, fontWeight: 'bold' } }, row.amount > 0 ? `+${row.amount}` : `${row.amount}`)
    }
  },
  {
    title: () => t('checkout.orderNote'),
    key: 'note',
    ellipsis: { tooltip: true }
  },
  {
    title: () => t('admin.endDate'),
    key: 'expiresAt',
    width: 120,
    render(row) {
      return row.expiresAt ? new Date(row.expiresAt).toLocaleDateString() : '-'
    }
  }
]

async function fetchPoints() {
  loading.value = true
  try {
    const res = await membersApi.getPoints({ page: currentPage.value, pageSize: pageSize.value })
    history.value = res.data?.items || res.data || []
    totalCount.value = res.data?.totalCount || history.value.length
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function fetchBalance() {
  try {
    const res = await membersApi.getProfile()
    const profile = res.data || res
    pointBalance.value = profile.pointBalance || 0
  } catch {}
}

onMounted(() => {
  fetchBalance()
  fetchPoints()
})
</script>

<style scoped>
.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}
</style>

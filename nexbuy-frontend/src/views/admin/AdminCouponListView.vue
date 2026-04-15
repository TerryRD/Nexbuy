<template>
  <div class="page-container">
    <n-space vertical size="large">
      <n-space justify="space-between" align="center">
        <h1>{{ t('admin.couponManagement') }}</h1>
        <n-button type="primary" @click="router.push({ name: 'AdminCouponCreate' })">
          {{ t('admin.addCoupon') }}
        </n-button>
      </n-space>

      <n-spin :show="loading">
        <n-data-table
          :columns="columns"
          :data="coupons"
          :row-key="(row: any) => row.id"
        />
        <n-empty v-if="!loading && coupons.length === 0" :description="t('common.noData')" />
      </n-spin>

      <n-space justify="center" v-if="totalCount > pageSize">
        <n-pagination
          v-model:page="currentPage"
          :page-count="Math.ceil(totalCount / pageSize)"
          @update:page="fetchCoupons"
        />
      </n-space>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NSpace, NButton, NDataTable, NSpin, NEmpty, NPagination, NTag, NSwitch, type DataTableColumns } from 'naive-ui'
import { adminCouponsApi } from '@/api/admin'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const coupons = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(15)
const totalCount = ref(0)

const columns: DataTableColumns<any> = [
  { title: () => t('admin.couponCode'), key: 'code', width: 140 },
  {
    title: () => t('admin.couponType'), key: 'type', width: 100,
    render(row) {
      return h(NTag, { size: 'small', type: row.type === 0 ? 'success' : 'info' }, {
        default: () => row.type === 0 ? t('admin.fixedAmount') : t('admin.percentage')
      })
    }
  },
  {
    title: () => t('admin.couponValue'), key: 'value', width: 100,
    render(row) { return row.type === 0 ? `$${row.value}` : `${row.value}%` }
  },
  {
    title: () => t('admin.minOrder'), key: 'minOrderAmount', width: 100,
    render(row) { return row.minOrderAmount ? `$${row.minOrderAmount}` : '-' }
  },
  {
    title: () => `${t('admin.usedCount')}/${t('admin.usageLimit')}`, key: 'usage', width: 100,
    render(row) { return `${row.usedCount || 0}/${row.usageLimit || '-'}` }
  },
  {
    title: () => t('admin.startDate'), key: 'startDate', width: 110,
    render(row) { return row.startDate ? new Date(row.startDate).toLocaleDateString() : '-' }
  },
  {
    title: () => t('admin.endDate'), key: 'endDate', width: 110,
    render(row) { return row.endDate ? new Date(row.endDate).toLocaleDateString() : '-' }
  },
  {
    title: () => t('common.status'), key: 'status', width: 80,
    render(row) {
      return h(NSwitch, {
        value: row.status === 1,
        loading: row._updating,
        'onUpdate:value': (val: boolean) => handleToggleStatus(row, val)
      })
    }
  },
  {
    title: () => t('common.actions'), key: 'actions', width: 80,
    render(row) {
      return h(NButton, {
        size: 'small', text: true, type: 'primary',
        onClick: () => router.push({ name: 'AdminCouponEdit', params: { id: row.id } })
      }, { default: () => t('common.edit') })
    }
  }
]

async function fetchCoupons() {
  loading.value = true
  try {
    const res = await adminCouponsApi.getCoupons({ page: currentPage.value, pageSize: pageSize.value })
    coupons.value = (res.data?.items || res.data || []).map((c: any) => ({ ...c, _updating: false }))
    totalCount.value = res.data?.totalCount || coupons.value.length
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function handleToggleStatus(row: any, enabled: boolean) {
  row._updating = true
  try {
    await adminCouponsApi.updateStatus(row.id, enabled ? 1 : 0)
    row.status = enabled ? 1 : 0
    message.success(t('common.success'))
  } catch {
    message.error(t('common.error'))
  } finally {
    row._updating = false
  }
}

onMounted(() => {
  fetchCoupons()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
}
</style>

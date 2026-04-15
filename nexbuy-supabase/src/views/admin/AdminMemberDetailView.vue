<template>
  <div class="page-container">
    <n-space vertical size="large">
      <n-space align="center">
        <n-button text @click="router.push({ name: 'AdminMembers' })">{{ t('common.back') }}</n-button>
        <h1>{{ t('admin.memberManagement') }}</h1>
      </n-space>

      <n-spin :show="loading">
        <template v-if="member">
          <!-- Member Info -->
          <n-card>
            <n-descriptions :column="2" label-placement="left" bordered>
              <n-descriptions-item :label="t('auth.name')">{{ member.name }}</n-descriptions-item>
              <n-descriptions-item :label="t('auth.email')">{{ member.email }}</n-descriptions-item>
              <n-descriptions-item :label="t('auth.phone')">{{ member.phone || '-' }}</n-descriptions-item>
              <n-descriptions-item :label="t('member.pointBalance')">{{ member.pointBalance }}</n-descriptions-item>
              <n-descriptions-item :label="t('order.orderDate')">{{ new Date(member.createdAt).toLocaleDateString() }}</n-descriptions-item>
              <n-descriptions-item :label="t('common.status')">
                <n-space align="center">
                  <n-switch
                    :value="member.status === 1"
                    @update:value="handleToggleStatus"
                    :loading="updatingStatus"
                  />
                  <n-tag :type="member.status === 1 ? 'success' : 'error'" size="small">
                    {{ member.status === 1 ? t('admin.active') : t('admin.inactive') }}
                  </n-tag>
                </n-space>
              </n-descriptions-item>
            </n-descriptions>
          </n-card>

          <!-- Point Adjustment -->
          <n-card :title="t('admin.adjustPoints')" style="margin-top: 16px;">
            <n-space align="center">
              <n-input-number v-model:value="pointAdjust.amount" :placeholder="t('member.points')" style="width: 150px;" />
              <n-input v-model:value="pointAdjust.note" :placeholder="t('checkout.orderNote')" style="width: 250px;" />
              <n-button type="primary" :loading="adjustingPoints" @click="handleAdjustPoints">
                {{ t('admin.adjustPoints') }}
              </n-button>
            </n-space>
          </n-card>

          <!-- Recent Orders -->
          <n-card :title="t('member.recentOrders')" style="margin-top: 16px;">
            <n-data-table
              :columns="orderColumns"
              :data="recentOrders"
              :row-key="(row: any) => row.orderNo"
              size="small"
            />
            <n-empty v-if="recentOrders.length === 0" :description="t('order.noOrders')" />
          </n-card>

          <!-- Points History -->
          <n-card :title="t('member.pointHistory')" style="margin-top: 16px;">
            <n-data-table
              :columns="pointColumns"
              :data="pointsHistory"
              :row-key="(row: any) => row.id"
              size="small"
            />
            <n-empty v-if="pointsHistory.length === 0" :description="t('member.noPoints')" />
          </n-card>
        </template>

        <n-empty v-if="!loading && !member" :description="t('common.noData')" />
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NInput, NInputNumber, NSwitch, NDataTable, NSpin, NEmpty, NTag, NDescriptions, NDescriptionsItem, type DataTableColumns } from 'naive-ui'
import { adminMembersApi } from '@/api/admin'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const updatingStatus = ref(false)
const adjustingPoints = ref(false)
const member = ref<any>(null)
const recentOrders = ref<any[]>([])
const pointsHistory = ref<any[]>([])

const pointAdjust = ref({ amount: 0, note: '' })

const typeMap: Record<number, { label: string; type: 'success' | 'warning' | 'error' | 'info' }> = {
  0: { label: 'member.pointEarn', type: 'success' },
  1: { label: 'member.pointRedeem', type: 'warning' },
  2: { label: 'member.pointExpire', type: 'error' },
  3: { label: 'member.pointAdjust', type: 'info' }
}

const statusMap: Record<number, { label: string; type: 'default' | 'info' | 'success' | 'warning' | 'error' }> = {
  0: { label: 'order.statusPending', type: 'warning' },
  1: { label: 'order.statusPaid', type: 'info' },
  2: { label: 'order.statusProcessing', type: 'info' },
  3: { label: 'order.statusShipped', type: 'success' },
  4: { label: 'order.statusCompleted', type: 'success' },
  5: { label: 'order.statusCancelled', type: 'error' }
}

const orderColumns: DataTableColumns<any> = [
  { title: () => t('order.orderNo'), key: 'orderNo', width: 160 },
  { title: () => t('order.orderDate'), key: 'createdAt', width: 120, render(row) { return new Date(row.createdAt).toLocaleDateString() } },
  { title: () => t('order.totalAmount'), key: 'totalAmount', width: 100, render(row) { return `$${row.totalAmount}` } },
  {
    title: () => t('order.status'), key: 'status', width: 100,
    render(row) {
      const s = statusMap[row.status] || { label: 'common.noData', type: 'default' as const }
      return h(NTag, { size: 'small', type: s.type }, { default: () => t(s.label) })
    }
  },
  {
    title: () => t('common.actions'), key: 'actions', width: 80,
    render(row) {
      return h(NButton, { size: 'small', text: true, type: 'primary', onClick: () => router.push({ name: 'AdminOrderDetail', params: { orderNo: row.orderNo } }) }, { default: () => t('order.orderDetail') })
    }
  }
]

const pointColumns: DataTableColumns<any> = [
  { title: () => t('order.orderDate'), key: 'createdAt', width: 120, render(row) { return new Date(row.createdAt).toLocaleDateString() } },
  {
    title: () => t('common.status'), key: 'type', width: 100,
    render(row) {
      const tm = typeMap[row.type] || { label: 'common.noData', type: 'info' as const }
      return h(NTag, { size: 'small', type: tm.type }, { default: () => t(tm.label) })
    }
  },
  {
    title: () => t('member.points'), key: 'amount', width: 100,
    render(row) {
      const color = row.amount > 0 ? '#18a058' : '#d03050'
      return h('span', { style: { color, fontWeight: 'bold' } }, row.amount > 0 ? `+${row.amount}` : `${row.amount}`)
    }
  },
  { title: () => t('checkout.orderNote'), key: 'note', ellipsis: { tooltip: true } }
]

async function fetchMember() {
  const id = route.params.id as string
  if (!id) return
  loading.value = true
  try {
    const res = await adminMembersApi.getMember(id)
    const data = res.data || res
    member.value = data.member || data
    recentOrders.value = data.recentOrders || []
    pointsHistory.value = data.pointsHistory || []
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function handleToggleStatus(enabled: boolean) {
  if (!member.value) return
  updatingStatus.value = true
  try {
    const newStatus = enabled ? 1 : 0
    await adminMembersApi.updateStatus(member.value.id, newStatus)
    member.value.status = newStatus
    message.success(t('common.success'))
  } catch {
    message.error(t('common.error'))
  } finally {
    updatingStatus.value = false
  }
}

async function handleAdjustPoints() {
  if (!member.value || !pointAdjust.value.amount) return
  adjustingPoints.value = true
  try {
    await adminMembersApi.adjustPoints(member.value.id, {
      amount: pointAdjust.value.amount,
      note: pointAdjust.value.note
    })
    member.value.pointBalance += pointAdjust.value.amount
    pointAdjust.value = { amount: 0, note: '' }
    message.success(t('common.success'))
    fetchMember() // Refresh all data
  } catch {
    message.error(t('common.error'))
  } finally {
    adjustingPoints.value = false
  }
}

onMounted(() => {
  fetchMember()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 900px;
}
</style>

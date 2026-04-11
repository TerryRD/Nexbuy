<template>
  <div class="page-container">
    <n-space vertical size="large">
      <h1>{{ t('member.center') }}</h1>
      <p>{{ t('home.banner') }}, {{ authStore.user?.name }}!</p>

      <n-spin :show="loading">
        <!-- Stats -->
        <n-grid :cols="3" :x-gap="16" :y-gap="16" responsive="screen" :cols-xs="1">
          <n-gi>
            <n-card>
              <n-statistic :label="t('member.pointBalance')" :value="profile?.pointBalance || 0" />
            </n-card>
          </n-gi>
          <n-gi>
            <n-card>
              <n-statistic :label="t('member.orders')" :value="recentOrders.length" />
            </n-card>
          </n-gi>
          <n-gi>
            <n-card>
              <n-statistic :label="t('member.wishlist')" :value="wishlistCount" />
            </n-card>
          </n-gi>
        </n-grid>

        <!-- Quick Links -->
        <n-card :title="t('common.actions')" style="margin-top: 16px;">
          <n-space>
            <n-button @click="router.push({ name: 'MemberProfile' })">{{ t('member.profile') }}</n-button>
            <n-button @click="router.push({ name: 'MemberAddresses' })">{{ t('member.addresses') }}</n-button>
            <n-button @click="router.push({ name: 'MemberOrders' })">{{ t('member.orders') }}</n-button>
            <n-button @click="router.push({ name: 'MemberPoints' })">{{ t('member.points') }}</n-button>
            <n-button @click="router.push({ name: 'MemberWishlist' })">{{ t('member.wishlist') }}</n-button>
          </n-space>
        </n-card>

        <!-- Recent Orders -->
        <n-card :title="t('member.recentOrders')" style="margin-top: 16px;">
          <n-data-table
            v-if="recentOrders.length > 0"
            :columns="columns"
            :data="recentOrders"
            :row-key="(row: any) => row.orderNo"
            size="small"
          />
          <n-empty v-else :description="t('order.noOrders')" />
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
import { membersApi, type UserProfile } from '@/api/members'
import { ordersApi, type OrderSummary } from '@/api/orders'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const loading = ref(false)
const profile = ref<UserProfile | null>(null)
const recentOrders = ref<OrderSummary[]>([])
const wishlistCount = ref(0)

const statusMap: Record<number, { label: string; type: 'default' | 'info' | 'success' | 'warning' | 'error' }> = {
  0: { label: 'order.statusPending', type: 'warning' },
  1: { label: 'order.statusPaid', type: 'info' },
  2: { label: 'order.statusProcessing', type: 'info' },
  3: { label: 'order.statusShipped', type: 'success' },
  4: { label: 'order.statusCompleted', type: 'success' },
  5: { label: 'order.statusCancelled', type: 'error' }
}

const columns: DataTableColumns<OrderSummary> = [
  { title: () => t('order.orderNo'), key: 'orderNo', width: 160 },
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
        size: 'small',
        text: true,
        type: 'primary',
        onClick: () => router.push({ name: 'MemberOrderDetail', params: { orderNo: row.orderNo } })
      }, { default: () => t('order.orderDetail') })
    }
  }
]

async function fetchData() {
  loading.value = true
  try {
    const [profileRes, ordersRes, wishlistRes] = await Promise.all([
      membersApi.getProfile(),
      ordersApi.getOrders({ page: 1, pageSize: 5 }),
      membersApi.getWishlist()
    ])
    profile.value = profileRes.data || profileRes
    recentOrders.value = (ordersRes.data?.items || ordersRes.data || []).slice(0, 5)
    wishlistCount.value = (wishlistRes.data || []).length
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.page-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 16px;
}
</style>

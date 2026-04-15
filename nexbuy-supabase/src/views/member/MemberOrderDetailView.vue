<template>
  <div class="page-container">
    <n-space vertical size="large">
      <n-breadcrumb>
        <n-breadcrumb-item @click="router.push({ name: 'MemberOrders' })">{{ t('order.myOrders') }}</n-breadcrumb-item>
        <n-breadcrumb-item>{{ t('order.orderDetail') }}</n-breadcrumb-item>
      </n-breadcrumb>

      <n-spin :show="loading">
        <template v-if="order">
          <!-- Order Info -->
          <n-card :title="`${t('order.orderNo')}: ${order.orderNo}`">
            <n-descriptions :column="2" label-placement="left" bordered>
              <n-descriptions-item :label="t('order.status')">
                <n-tag :type="statusType(order.status)">{{ statusLabel(order.status) }}</n-tag>
              </n-descriptions-item>
              <n-descriptions-item :label="t('order.paymentStatus')">
                <n-tag :type="paymentType(order.paymentStatus)">{{ paymentLabel(order.paymentStatus) }}</n-tag>
              </n-descriptions-item>
              <n-descriptions-item :label="t('checkout.shippingMethod')">
                {{ shippingLabel(order.shippingMethod) }}
              </n-descriptions-item>
              <n-descriptions-item :label="t('order.orderDate')">
                {{ new Date(order.createdAt).toLocaleString() }}
              </n-descriptions-item>
              <n-descriptions-item :label="t('member.recipientName')">{{ order.recipientName }}</n-descriptions-item>
              <n-descriptions-item :label="t('auth.phone')">{{ order.recipientPhone }}</n-descriptions-item>
              <n-descriptions-item :label="t('member.address')" :span="2">{{ order.shippingAddress }}</n-descriptions-item>
              <n-descriptions-item v-if="order.trackingNo" :label="t('order.trackingNo')">{{ order.trackingNo }}</n-descriptions-item>
              <n-descriptions-item v-if="order.note" :label="t('checkout.orderNote')">{{ order.note }}</n-descriptions-item>
            </n-descriptions>
          </n-card>

          <!-- Items -->
          <n-card :title="t('checkout.orderSummary')" style="margin-top: 16px;">
            <n-data-table :columns="columns" :data="order.items" :row-key="(row: any) => row.productId + (row.variantId || '')" size="small" />
            <n-divider />
            <n-space vertical size="small" style="text-align: right;">
              <div>{{ t('cart.subtotal') }}: ${{ order.subTotal }}</div>
              <div v-if="order.discountAmount > 0">{{ t('cart.discount') }}: -${{ order.discountAmount }}</div>
              <div v-if="order.pointDiscount > 0">{{ t('checkout.pointsDiscount') }}: -${{ order.pointDiscount }}</div>
              <div>{{ t('checkout.shippingFee') }}: ${{ order.shippingFee }}</div>
              <n-divider style="margin: 8px 0;" />
              <div style="font-size: 18px; font-weight: bold; color: #e74c3c;">
                {{ t('cart.total') }}: ${{ order.totalAmount }}
              </div>
            </n-space>
          </n-card>

          <!-- Actions -->
          <n-space style="margin-top: 16px;">
            <n-popconfirm v-if="order.status === 0" @positive-click="handleCancel">
              <template #trigger>
                <n-button type="error">{{ t('order.cancelOrder') }}</n-button>
              </template>
              {{ t('order.cancelConfirm') }}
            </n-popconfirm>
            <n-popconfirm v-if="order.status === 4" @positive-click="handleReturn">
              <template #trigger>
                <n-button type="warning">{{ t('order.returnOrder') }}</n-button>
              </template>
              {{ t('order.returnConfirm') }}
            </n-popconfirm>
          </n-space>

          <!-- Digital Downloads -->
          <n-card v-if="downloads.length > 0" :title="t('order.digitalDownload')" style="margin-top: 16px;">
            <n-space vertical>
              <div v-for="dl in downloads" :key="dl.token">
                <n-space align="center" justify="space-between">
                  <span>{{ dl.productName }}</span>
                  <n-space align="center">
                    <span>{{ t('download.downloadCount', { current: dl.downloadCount, max: dl.maxDownloads }) }}</span>
                    <n-button
                      v-if="!dl.isRevoked && dl.downloadCount < dl.maxDownloads && new Date(dl.expiresAt) > new Date()"
                      type="primary"
                      size="small"
                      @click="router.push({ name: 'Download', params: { token: dl.token } })"
                    >
                      {{ t('order.download') }}
                    </n-button>
                    <n-tag v-else-if="dl.downloadCount >= dl.maxDownloads" type="warning" size="small">
                      {{ t('order.downloadLimitReached') }}
                    </n-tag>
                    <n-tag v-else type="error" size="small">
                      {{ t('order.downloadExpired') }}
                    </n-tag>
                  </n-space>
                </n-space>
              </div>
            </n-space>
          </n-card>
        </template>

        <n-empty v-if="!loading && !order" :description="t('common.noData')" />
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NDataTable, NSpin, NEmpty, NTag, NDivider, NDescriptions, NDescriptionsItem, NBreadcrumb, NBreadcrumbItem, NPopconfirm, NImage, type DataTableColumns } from 'naive-ui'
import { ordersApi, type OrderDetail, type DownloadLink } from '@/api/orders'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const order = ref<OrderDetail | null>(null)
const downloads = ref<DownloadLink[]>([])

function statusLabel(status: number): string {
  const map: Record<number, string> = {
    0: t('order.statusPending'), 1: t('order.statusPaid'), 2: t('order.statusProcessing'),
    3: t('order.statusShipped'), 4: t('order.statusCompleted'), 5: t('order.statusCancelled')
  }
  return map[status] || ''
}

function statusType(status: number): 'default' | 'info' | 'success' | 'warning' | 'error' {
  const map: Record<number, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    0: 'warning', 1: 'info', 2: 'info', 3: 'success', 4: 'success', 5: 'error'
  }
  return map[status] || 'default'
}

function paymentLabel(status: number): string {
  const map: Record<number, string> = {
    0: t('order.paymentUnpaid'), 1: t('order.paymentPaid'), 2: t('order.paymentRefunding'), 3: t('order.paymentRefunded')
  }
  return map[status] || ''
}

function paymentType(status: number): 'default' | 'info' | 'success' | 'warning' | 'error' {
  const map: Record<number, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    0: 'warning', 1: 'success', 2: 'info', 3: 'default'
  }
  return map[status] || 'default'
}

function shippingLabel(method: number): string {
  const map: Record<number, string> = {
    1: t('checkout.homeDelivery'), 2: t('checkout.sevenEleven'), 3: t('checkout.familyMart')
  }
  return map[method] || ''
}

const columns: DataTableColumns<any> = [
  {
    title: '',
    key: 'imageUrl',
    width: 60,
    render(row) {
      return h(NImage, { src: row.imageUrl || 'https://via.placeholder.com/40x40', width: 40, height: 40, objectFit: 'cover', previewDisabled: true })
    }
  },
  { title: () => t('admin.productName'), key: 'productName', ellipsis: { tooltip: true } },
  { title: () => t('product.price'), key: 'unitPrice', width: 100, render(row) { return `$${row.unitPrice}` } },
  { title: () => t('product.quantity'), key: 'quantity', width: 80 },
  { title: () => t('cart.subtotal'), key: 'subtotal', width: 100, render(row) { return `$${row.subtotal}` } }
]

async function fetchOrder() {
  const orderNo = route.params.orderNo as string
  if (!orderNo) return
  loading.value = true
  try {
    const [orderRes, dlRes] = await Promise.allSettled([
      ordersApi.getOrder(orderNo),
      ordersApi.getDownloads(orderNo)
    ])
    if (orderRes.status === 'fulfilled') {
      order.value = orderRes.value.data || orderRes.value
    }
    if (dlRes.status === 'fulfilled') {
      downloads.value = dlRes.value.data || []
    }
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function handleCancel() {
  if (!order.value) return
  try {
    await ordersApi.cancelOrder(order.value.orderNo)
    message.success(t('common.success'))
    fetchOrder()
  } catch {
    message.error(t('common.error'))
  }
}

async function handleReturn() {
  if (!order.value) return
  try {
    await ordersApi.returnOrder(order.value.orderNo)
    message.success(t('common.success'))
    fetchOrder()
  } catch {
    message.error(t('common.error'))
  }
}

onMounted(() => {
  fetchOrder()
})
</script>

<style scoped>
.page-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 16px;
}
</style>

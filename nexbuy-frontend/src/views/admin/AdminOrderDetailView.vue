<template>
  <div class="page-container">
    <n-space vertical size="large">
      <n-space align="center">
        <n-button text @click="router.push({ name: 'AdminOrders' })">{{ t('common.back') }}</n-button>
        <h1>{{ t('order.orderDetail') }}</h1>
      </n-space>

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
              <n-descriptions-item :label="t('checkout.shippingMethod')">{{ shippingLabel(order.shippingMethod) }}</n-descriptions-item>
              <n-descriptions-item :label="t('order.orderDate')">{{ new Date(order.createdAt).toLocaleString() }}</n-descriptions-item>
              <n-descriptions-item :label="t('member.recipientName')">{{ order.recipientName }}</n-descriptions-item>
              <n-descriptions-item :label="t('auth.phone')">{{ order.recipientPhone }}</n-descriptions-item>
              <n-descriptions-item :label="t('member.address')" :span="2">{{ order.shippingAddress }}</n-descriptions-item>
              <n-descriptions-item :label="t('order.totalAmount')">
                <strong style="color: #e74c3c;">${{ order.totalAmount }}</strong>
              </n-descriptions-item>
            </n-descriptions>
          </n-card>

          <!-- Status Update -->
          <n-card :title="t('admin.updateStatus')" style="margin-top: 16px;">
            <n-space align="center">
              <n-select
                v-model:value="newStatus"
                :options="statusUpdateOptions"
                style="width: 200px;"
              />
              <n-button type="primary" :loading="updatingStatus" @click="handleUpdateStatus">
                {{ t('admin.updateStatus') }}
              </n-button>
            </n-space>
          </n-card>

          <!-- Tracking -->
          <n-card :title="t('order.trackingNo')" style="margin-top: 16px;">
            <n-space align="center">
              <n-input v-model:value="trackingNo" :placeholder="t('admin.inputTracking')" style="width: 300px;" />
              <n-button type="primary" :loading="updatingTracking" @click="handleUpdateTracking">
                {{ t('common.save') }}
              </n-button>
            </n-space>
          </n-card>

          <!-- Items -->
          <n-card :title="t('checkout.orderSummary')" style="margin-top: 16px;">
            <n-data-table :columns="columns" :data="order.items" :row-key="(row: any) => row.productId" size="small" />
            <n-divider />
            <n-space vertical size="small" style="text-align: right;">
              <div>{{ t('cart.subtotal') }}: ${{ order.subTotal }}</div>
              <div v-if="order.discountAmount > 0">{{ t('cart.discount') }}: -${{ order.discountAmount }}</div>
              <div v-if="order.pointDiscount > 0">{{ t('checkout.pointsDiscount') }}: -${{ order.pointDiscount }}</div>
              <div>{{ t('checkout.shippingFee') }}: ${{ order.shippingFee }}</div>
              <div style="font-size: 18px; font-weight: bold; color: #e74c3c;">
                {{ t('cart.total') }}: ${{ order.totalAmount }}
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
import { ref, h, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NSelect, NInput, NDataTable, NSpin, NEmpty, NTag, NDivider, NDescriptions, NDescriptionsItem, NImage, type DataTableColumns } from 'naive-ui'
import { adminOrdersApi } from '@/api/admin'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const updatingStatus = ref(false)
const updatingTracking = ref(false)
const order = ref<any>(null)
const newStatus = ref<number>(0)
const trackingNo = ref('')

function statusLabel(status: number): string {
  const map: Record<number, string> = {
    0: t('order.statusPending'), 1: t('order.statusPaid'), 2: t('order.statusProcessing'),
    3: t('order.statusShipped'), 4: t('order.statusCompleted'), 5: t('order.statusCancelled')
  }
  return map[status] || ''
}

function statusType(status: number): 'default' | 'info' | 'success' | 'warning' | 'error' {
  return ({ 0: 'warning', 1: 'info', 2: 'info', 3: 'success', 4: 'success', 5: 'error' } as any)[status] || 'default'
}

function paymentLabel(status: number): string {
  const map: Record<number, string> = {
    0: t('order.paymentUnpaid'), 1: t('order.paymentPaid'), 2: t('order.paymentRefunding'), 3: t('order.paymentRefunded')
  }
  return map[status] || ''
}

function paymentType(status: number): 'default' | 'info' | 'success' | 'warning' | 'error' {
  return ({ 0: 'warning', 1: 'success', 2: 'info', 3: 'default' } as any)[status] || 'default'
}

function shippingLabel(method: number): string {
  return ({ 1: t('checkout.homeDelivery'), 2: t('checkout.sevenEleven'), 3: t('checkout.familyMart') } as any)[method] || ''
}

const statusUpdateOptions = computed(() => [
  { label: t('order.statusPending'), value: 0 },
  { label: t('order.statusPaid'), value: 1 },
  { label: t('order.statusProcessing'), value: 2 },
  { label: t('order.statusShipped'), value: 3 },
  { label: t('order.statusCompleted'), value: 4 },
  { label: t('order.statusCancelled'), value: 5 }
])

const columns: DataTableColumns<any> = [
  {
    title: '', key: 'imageUrl', width: 60,
    render(row) { return h(NImage, { src: row.imageUrl || 'https://via.placeholder.com/40x40', width: 40, height: 40, objectFit: 'cover', previewDisabled: true }) }
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
    const res = await adminOrdersApi.getOrder(orderNo)
    order.value = res.data || res
    if (order.value) {
      newStatus.value = order.value.status
      trackingNo.value = order.value.trackingNo || ''
    }
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function handleUpdateStatus() {
  if (!order.value) return
  updatingStatus.value = true
  try {
    await adminOrdersApi.updateStatus(order.value.orderNo, newStatus.value)
    order.value.status = newStatus.value
    message.success(t('common.success'))
  } catch {
    message.error(t('common.error'))
  } finally {
    updatingStatus.value = false
  }
}

async function handleUpdateTracking() {
  if (!order.value) return
  updatingTracking.value = true
  try {
    await adminOrdersApi.updateTracking(order.value.orderNo, trackingNo.value)
    order.value.trackingNo = trackingNo.value
    message.success(t('common.success'))
  } catch {
    message.error(t('common.error'))
  } finally {
    updatingTracking.value = false
  }
}

onMounted(() => {
  fetchOrder()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 900px;
}
</style>

<template>
  <div class="page-container">
    <n-space vertical size="large">
      <h1>{{ t('checkout.confirmOrder') }}</h1>

      <n-spin :show="loading">
        <!-- Shipping Info -->
        <n-card :title="t('checkout.shippingInfo')">
          <n-descriptions :column="1" label-placement="left" bordered>
            <n-descriptions-item :label="t('member.recipientName')">{{ checkoutData.recipientName }}</n-descriptions-item>
            <n-descriptions-item :label="t('auth.phone')">{{ checkoutData.recipientPhone }}</n-descriptions-item>
            <n-descriptions-item :label="t('member.address')">{{ checkoutData.shippingAddress }}</n-descriptions-item>
            <n-descriptions-item :label="t('checkout.shippingMethod')">{{ shippingMethodLabel }}</n-descriptions-item>
          </n-descriptions>
        </n-card>

        <!-- Order Items -->
        <n-card :title="t('checkout.orderSummary')" style="margin-top: 16px;">
          <n-data-table :columns="columns" :data="cartStore.items" :row-key="(row: any) => row.id" size="small" />
        </n-card>

        <!-- Coupon & Points -->
        <n-card style="margin-top: 16px;">
          <n-space vertical size="medium">
            <!-- Coupon display -->
            <div v-if="cartStore.couponCode">
              <n-space align="center">
                <span>{{ t('cart.coupon') }}:</span>
                <n-tag type="success">{{ cartStore.couponCode }}</n-tag>
                <span>-${{ cartStore.discountAmount }}</span>
              </n-space>
            </div>

            <!-- Points redemption -->
            <n-space align="center">
              <span>{{ t('checkout.pointsBalance') }}: {{ authStore.user?.pointBalance || 0 }}</span>
            </n-space>
            <n-space align="center">
              <span>{{ t('checkout.pointsToRedeem') }}:</span>
              <n-input-number
                v-model:value="pointsToRedeem"
                :min="0"
                :max="authStore.user?.pointBalance || 0"
                style="width: 160px;"
              />
              <span v-if="pointsToRedeem > 0">{{ t('checkout.pointsDiscount') }}: -${{ pointsToRedeem }}</span>
            </n-space>
          </n-space>
        </n-card>

        <!-- Price Summary -->
        <n-card style="margin-top: 16px;">
          <n-space vertical size="small" style="text-align: right; font-size: 16px;">
            <div>{{ t('cart.subtotal') }}: ${{ cartStore.subTotal }}</div>
            <div v-if="cartStore.discountAmount > 0">{{ t('cart.discount') }}: -${{ cartStore.discountAmount }}</div>
            <div v-if="pointsToRedeem > 0">{{ t('checkout.pointsDiscount') }}: -${{ pointsToRedeem }}</div>
            <div>{{ t('checkout.shippingFee') }}: {{ checkoutData.shippingFee > 0 ? `$${checkoutData.shippingFee}` : t('checkout.freeShipping') }}</div>
            <n-divider style="margin: 8px 0;" />
            <div style="font-size: 22px; font-weight: bold; color: #e74c3c;">
              {{ t('cart.total') }}: ${{ finalTotal }}
            </div>
          </n-space>
        </n-card>

        <!-- Actions -->
        <n-space justify="space-between" style="margin-top: 24px;">
          <n-button @click="router.push({ name: 'Checkout' })">{{ t('common.back') }}</n-button>
          <n-button type="primary" size="large" :loading="submitting" @click="handlePlaceOrder">
            {{ t('checkout.placeOrder') }}
          </n-button>
        </n-space>
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NDataTable, NDivider, NSpin, NTag, NInputNumber, NDescriptions, NDescriptionsItem, NImage, type DataTableColumns } from 'naive-ui'
import { ordersApi } from '@/api/orders'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const cartStore = useCartStore()
const authStore = useAuthStore()

const loading = ref(false)
const submitting = ref(false)
const pointsToRedeem = ref(0)

const checkoutData = ref({
  addressId: null as string | null,
  recipientName: '',
  recipientPhone: '',
  shippingAddress: '',
  shippingMethodId: 1,
  shippingFee: 0,
  note: ''
})

const shippingMethodLabel = computed(() => {
  const map: Record<number, string> = {
    1: t('checkout.homeDelivery'),
    2: t('checkout.sevenEleven'),
    3: t('checkout.familyMart')
  }
  return map[checkoutData.value.shippingMethodId] || ''
})

const finalTotal = computed(() => {
  return Math.max(0, cartStore.total - pointsToRedeem.value + checkoutData.value.shippingFee)
})

const columns: DataTableColumns<any> = [
  {
    title: '',
    key: 'imageUrl',
    width: 60,
    render(row) {
      return h(NImage, {
        src: row.imageUrl || 'https://via.placeholder.com/40x40',
        width: 40,
        height: 40,
        objectFit: 'cover',
        previewDisabled: true
      })
    }
  },
  {
    title: () => t('admin.productName'),
    key: 'productName',
    ellipsis: { tooltip: true }
  },
  {
    title: () => t('product.price'),
    key: 'unitPrice',
    width: 100,
    render(row) { return `$${row.unitPrice}` }
  },
  {
    title: () => t('product.quantity'),
    key: 'quantity',
    width: 80
  },
  {
    title: () => t('cart.subtotal'),
    key: 'subtotal',
    width: 100,
    render(row) { return `$${row.subtotal}` }
  }
]

async function handlePlaceOrder() {
  submitting.value = true
  try {
    const res = await ordersApi.createOrder({
      shippingAddressId: checkoutData.value.addressId || undefined,
      shippingMethodId: checkoutData.value.shippingMethodId,
      recipientName: checkoutData.value.recipientName,
      recipientPhone: checkoutData.value.recipientPhone,
      shippingAddress: checkoutData.value.shippingAddress,
      pointsToRedeem: pointsToRedeem.value > 0 ? pointsToRedeem.value : undefined,
      note: checkoutData.value.note || undefined
    })
    const orderNo = res.data?.orderNo || res.orderNo
    cartStore.clearCart()
    sessionStorage.removeItem('checkoutData')
    message.success(t('checkout.orderSuccess'))
    router.push({ name: 'CheckoutSuccess', params: { orderNo } })
  } catch {
    message.error(t('common.error'))
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  const stored = sessionStorage.getItem('checkoutData')
  if (stored) {
    try {
      checkoutData.value = JSON.parse(stored)
    } catch {
      router.push({ name: 'Checkout' })
    }
  } else {
    router.push({ name: 'Checkout' })
  }

  if (cartStore.items.length === 0) {
    cartStore.fetchCart()
  }
})
</script>

<style scoped>
.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}
</style>

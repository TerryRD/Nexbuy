<template>
  <div class="page-container">
    <n-space vertical size="large">
      <h1>{{ t('cart.title') }}</h1>

      <n-spin :show="cartStore.loading">
        <template v-if="cartStore.items.length > 0">
          <!-- Cart Items Table -->
          <n-data-table :columns="columns" :data="cartStore.items" :row-key="(row: any) => row.id" />

          <n-divider />

          <!-- Coupon -->
          <n-card size="small" :title="t('cart.coupon')">
            <n-space v-if="!cartStore.couponCode">
              <n-input
                v-model:value="couponInput"
                :placeholder="t('cart.couponPlaceholder')"
                style="width: 240px;"
              />
              <n-button type="primary" :loading="applyingCoupon" @click="handleApplyCoupon">
                {{ t('cart.applyCoupon') }}
              </n-button>
            </n-space>
            <n-space v-else align="center">
              <n-tag type="success" closable @close="handleRemoveCoupon">
                {{ cartStore.couponCode }}
              </n-tag>
              <span>-${{ cartStore.discountAmount }}</span>
            </n-space>
          </n-card>

          <n-divider />

          <!-- Summary -->
          <n-card>
            <n-space vertical size="small" style="text-align: right;">
              <div>{{ t('cart.subtotal') }}: <strong>${{ cartStore.subTotal }}</strong></div>
              <div v-if="cartStore.discountAmount > 0">
                {{ t('cart.discount') }}: <strong style="color: #52c41a;">-${{ cartStore.discountAmount }}</strong>
              </div>
              <n-divider style="margin: 8px 0;" />
              <div style="font-size: 20px;">
                {{ t('cart.total') }}: <strong style="color: #e74c3c;">${{ cartStore.total }}</strong>
              </div>
            </n-space>
          </n-card>

          <!-- Actions -->
          <n-space justify="space-between">
            <n-button @click="router.push({ name: 'ProductList' })">
              {{ t('cart.continueShopping') }}
            </n-button>
            <n-button type="primary" size="large" @click="handleCheckout">
              {{ t('cart.checkout') }}
            </n-button>
          </n-space>
        </template>

        <n-empty v-else :description="t('cart.empty')">
          <template #extra>
            <n-button @click="router.push({ name: 'ProductList' })">
              {{ t('cart.continueShopping') }}
            </n-button>
          </template>
        </n-empty>
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NDataTable, NSpin, NEmpty, NInput, NTag, NDivider, NInputNumber, NImage, NPopconfirm, type DataTableColumns } from 'naive-ui'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const cartStore = useCartStore()
const authStore = useAuthStore()

const couponInput = ref('')
const applyingCoupon = ref(false)

const columns: DataTableColumns<any> = [
  {
    title: '',
    key: 'imageUrl',
    width: 80,
    render(row) {
      return h(NImage, {
        src: row.imageUrl || 'https://via.placeholder.com/60x60',
        width: 60,
        height: 60,
        objectFit: 'cover',
        previewDisabled: true,
        lazy: true
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
    render(row) {
      return `$${row.unitPrice}`
    }
  },
  {
    title: () => t('product.quantity'),
    key: 'quantity',
    width: 150,
    render(row) {
      return h(NInputNumber, {
        value: row.quantity,
        min: 1,
        max: row.stock || 999,
        size: 'small',
        'onUpdate:value': (val: number | null) => {
          if (val && val > 0) handleUpdateQuantity(row.id, val)
        }
      })
    }
  },
  {
    title: () => t('cart.subtotal'),
    key: 'subtotal',
    width: 100,
    render(row) {
      return `$${row.subtotal}`
    }
  },
  {
    title: () => t('common.actions'),
    key: 'actions',
    width: 80,
    render(row) {
      return h(NPopconfirm, {
        onPositiveClick: () => handleRemoveItem(row.id)
      }, {
        trigger: () => h(NButton, { size: 'small', type: 'error', quaternary: true }, { default: () => t('cart.remove') }),
        default: () => t('common.confirm') + '?'
      })
    }
  }
]

async function handleUpdateQuantity(id: string, quantity: number) {
  try {
    await cartStore.updateItem(id, quantity)
  } catch {
    message.error(t('common.error'))
  }
}

async function handleRemoveItem(id: string) {
  try {
    await cartStore.removeItem(id)
    message.success(t('common.success'))
  } catch {
    message.error(t('common.error'))
  }
}

async function handleApplyCoupon() {
  if (!couponInput.value.trim()) return
  applyingCoupon.value = true
  try {
    await cartStore.applyCoupon(couponInput.value.trim())
    message.success(t('cart.couponApplied'))
    couponInput.value = ''
  } catch {
    message.error(t('cart.couponInvalid'))
  } finally {
    applyingCoupon.value = false
  }
}

async function handleRemoveCoupon() {
  try {
    await cartStore.removeCoupon()
    message.success(t('common.success'))
  } catch {
    message.error(t('common.error'))
  }
}

function handleCheckout() {
  if (authStore.isAuthenticated) {
    router.push({ name: 'Checkout' })
  } else {
    router.push({ name: 'Login', query: { redirect: '/checkout' } })
  }
}

onMounted(() => {
  cartStore.fetchCart()
})
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}
</style>

<template>
  <div class="page-container">
    <n-space vertical size="large">
      <h1>{{ t('checkout.title') }} - {{ t('checkout.shippingInfo') }}</h1>

      <n-spin :show="loading">
        <!-- Select Address -->
        <n-card :title="t('checkout.selectAddress')">
          <n-space vertical size="medium">
            <n-grid :cols="2" :x-gap="16" :y-gap="16" responsive="screen" :cols-xs="1">
              <n-gi v-for="addr in addresses" :key="addr.id">
                <n-card
                  hoverable
                  :style="{ border: selectedAddressId === addr.id ? '2px solid #18a058' : '1px solid #e0e0e0', cursor: 'pointer' }"
                  @click="selectAddress(addr)"
                >
                  <n-space vertical size="small">
                    <n-space align="center">
                      <strong>{{ addr.label }}</strong>
                      <n-tag v-if="addr.isDefault" size="small" type="success">{{ t('member.defaultAddress') }}</n-tag>
                      <n-tag v-if="addr.addressType === 1" size="small" type="info">{{ t('member.convenienceStore') }}</n-tag>
                    </n-space>
                    <div>{{ addr.recipientName }} / {{ addr.phone }}</div>
                    <div v-if="addr.addressType === 0">{{ addr.zipCode }} {{ addr.city }} {{ addr.address }}</div>
                    <div v-else>{{ addr.storeName }} ({{ addr.storeId }})</div>
                  </n-space>
                </n-card>
              </n-gi>
            </n-grid>

            <n-divider>{{ t('checkout.newAddress') }}</n-divider>

            <!-- New Address Form -->
            <n-form ref="formRef" :model="newAddress" :rules="rules" label-placement="left" label-width="120">
              <n-form-item :label="t('member.recipientName')" path="recipientName">
                <n-input v-model:value="newAddress.recipientName" />
              </n-form-item>
              <n-form-item :label="t('auth.phone')" path="phone">
                <n-input v-model:value="newAddress.phone" />
              </n-form-item>
              <n-form-item :label="t('member.zipCode')" path="zipCode">
                <n-input v-model:value="newAddress.zipCode" />
              </n-form-item>
              <n-form-item :label="t('member.city')" path="city">
                <n-input v-model:value="newAddress.city" />
              </n-form-item>
              <n-form-item :label="t('member.address')" path="address">
                <n-input v-model:value="newAddress.address" />
              </n-form-item>
            </n-form>
          </n-space>
        </n-card>

        <!-- Shipping Method -->
        <n-card :title="t('checkout.shippingMethod')" style="margin-top: 16px;">
          <n-space vertical>
            <n-card
              v-for="method in shippingMethods"
              :key="method.id"
              hoverable
              size="small"
              :style="{ border: selectedShippingMethod === method.id ? '2px solid #18a058' : '1px solid #e0e0e0', cursor: 'pointer' }"
              @click="selectedShippingMethod = method.id"
            >
              <n-space justify="space-between" align="center">
                <span>{{ method.label }}</span>
                <span>{{ method.fee > 0 ? `$${method.fee}` : t('checkout.freeShipping') }}</span>
              </n-space>
            </n-card>
          </n-space>
        </n-card>

        <!-- Note -->
        <n-card :title="t('checkout.orderNote')" style="margin-top: 16px;">
          <n-input v-model:value="orderNote" type="textarea" :rows="3" :placeholder="t('checkout.orderNote')" />
        </n-card>

        <!-- Continue -->
        <n-space justify="space-between" style="margin-top: 24px;">
          <n-button @click="router.push({ name: 'Cart' })">{{ t('common.back') }}</n-button>
          <n-button type="primary" size="large" @click="handleContinue">
            {{ t('checkout.confirmOrder') }}
          </n-button>
        </n-space>
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NGrid, NGi, NTag, NDivider, NSpin, NForm, NFormItem, NInput, type FormInst, type FormRules } from 'naive-ui'
import { membersApi, type Address } from '@/api/members'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const addresses = ref<Address[]>([])
const selectedAddressId = ref<string | null>(null)
const selectedShippingMethod = ref(1)
const orderNote = ref('')
const formRef = ref<FormInst | null>(null)

const newAddress = ref({
  recipientName: '',
  phone: '',
  zipCode: '',
  city: '',
  address: ''
})

const shippingMethods = computed(() => [
  { id: 1, label: t('checkout.homeDelivery'), fee: 100 },
  { id: 2, label: t('checkout.sevenEleven'), fee: 60 },
  { id: 3, label: t('checkout.familyMart'), fee: 60 }
])

const rules: FormRules = {
  recipientName: { required: true, message: t('common.required'), trigger: 'blur' },
  phone: { required: true, message: t('common.required'), trigger: 'blur' },
  address: { required: true, message: t('common.required'), trigger: 'blur' }
}

function selectAddress(addr: Address) {
  selectedAddressId.value = addr.id
  newAddress.value.recipientName = addr.recipientName
  newAddress.value.phone = addr.phone
  newAddress.value.zipCode = addr.zipCode || ''
  newAddress.value.city = addr.city || ''
  newAddress.value.address = addr.address || addr.storeName || ''
}

async function fetchAddresses() {
  loading.value = true
  try {
    const res = await membersApi.getAddresses()
    addresses.value = res.data || []
    const defaultAddr = addresses.value.find(a => a.isDefault)
    if (defaultAddr) selectAddress(defaultAddr)
  } catch {
    // User might not have addresses yet
  } finally {
    loading.value = false
  }
}

async function handleContinue() {
  if (!selectedAddressId.value && !newAddress.value.recipientName) {
    // Validate new address form
    try {
      await formRef.value?.validate()
    } catch {
      message.warning(t('common.required'))
      return
    }
  }

  // Store checkout data in session storage
  const checkoutData = {
    addressId: selectedAddressId.value,
    recipientName: newAddress.value.recipientName,
    recipientPhone: newAddress.value.phone,
    shippingAddress: `${newAddress.value.zipCode} ${newAddress.value.city} ${newAddress.value.address}`.trim(),
    shippingMethodId: selectedShippingMethod.value,
    shippingFee: shippingMethods.value.find(m => m.id === selectedShippingMethod.value)?.fee || 0,
    note: orderNote.value
  }
  sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData))
  router.push({ name: 'CheckoutConfirm' })
}

onMounted(() => {
  fetchAddresses()
})
</script>

<style scoped>
.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}
</style>

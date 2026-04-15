<template>
  <div class="page-container">
    <n-space vertical size="large">
      <n-space align="center">
        <n-button text @click="router.push({ name: 'AdminCoupons' })">{{ t('common.back') }}</n-button>
        <h1>{{ isEdit ? t('admin.editCoupon') : t('admin.addCoupon') }}</h1>
      </n-space>

      <n-spin :show="loading">
        <n-card>
          <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="140">
            <n-form-item :label="t('admin.couponCode')" path="code">
              <n-input v-model:value="form.code" :disabled="isEdit" />
            </n-form-item>
            <n-form-item :label="t('admin.couponType')" path="type">
              <n-select v-model:value="form.type" :options="typeOptions" />
            </n-form-item>
            <n-form-item :label="t('admin.couponValue')" path="value">
              <n-input-number v-model:value="form.value" :min="0" :precision="form.type === 1 ? 0 : 2" style="width: 100%;">
                <template #prefix>{{ form.type === 0 ? '$' : '' }}</template>
                <template #suffix>{{ form.type === 1 ? '%' : '' }}</template>
              </n-input-number>
            </n-form-item>
            <n-form-item :label="t('admin.minOrder')">
              <n-input-number v-model:value="form.minOrderAmount" :min="0" :precision="2" style="width: 100%;">
                <template #prefix>$</template>
              </n-input-number>
            </n-form-item>
            <n-form-item :label="t('admin.usageLimit')">
              <n-input-number v-model:value="form.usageLimit" :min="0" style="width: 100%;" />
            </n-form-item>
            <n-form-item :label="t('admin.dateRange')">
              <n-date-picker v-model:value="dateRange" type="daterange" clearable style="width: 100%;" />
            </n-form-item>
            <n-form-item :label="t('common.status')">
              <n-switch v-model:value="form.statusEnabled" />
            </n-form-item>
            <n-space>
              <n-button type="primary" :loading="saving" @click="handleSave">{{ t('common.save') }}</n-button>
              <n-button @click="router.push({ name: 'AdminCoupons' })">{{ t('common.cancel') }}</n-button>
            </n-space>
          </n-form>
        </n-card>
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NForm, NFormItem, NInput, NInputNumber, NSelect, NDatePicker, NSwitch, NSpin, type FormInst, type FormRules } from 'naive-ui'
import { adminCouponsApi } from '@/api/admin'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const saving = ref(false)
const formRef = ref<FormInst | null>(null)

const isEdit = computed(() => !!route.params.id)
const couponId = computed(() => Number(route.params.id))

const typeOptions = computed(() => [
  { label: t('admin.fixedAmount'), value: 0 },
  { label: t('admin.percentage'), value: 1 }
])

const form = ref({
  code: '',
  type: 0,
  value: 0,
  minOrderAmount: 0,
  usageLimit: 0,
  statusEnabled: true
})

const dateRange = ref<[number, number] | null>(null)

const rules: FormRules = {
  code: { required: true, message: t('common.required'), trigger: 'blur' },
  type: { required: true, type: 'number', message: t('common.required'), trigger: 'change' },
  value: { required: true, type: 'number', min: 0.01, message: t('common.required'), trigger: 'blur' }
}

async function fetchCoupon() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const res = await adminCouponsApi.getCoupons({ search: couponId.value })
    const coupons = res.data?.items || res.data || []
    const coupon = coupons.find?.((c: any) => c.id === couponId.value) || (res.data || res)
    if (coupon) {
      form.value.code = coupon.code || ''
      form.value.type = coupon.type ?? 0
      form.value.value = coupon.value || 0
      form.value.minOrderAmount = coupon.minOrderAmount || 0
      form.value.usageLimit = coupon.usageLimit || 0
      form.value.statusEnabled = coupon.status === 1
      if (coupon.startDate && coupon.endDate) {
        dateRange.value = [new Date(coupon.startDate).getTime(), new Date(coupon.endDate).getTime()]
      }
    }
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    const data: any = {
      code: form.value.code,
      type: form.value.type,
      value: form.value.value,
      minOrderAmount: form.value.minOrderAmount || undefined,
      usageLimit: form.value.usageLimit || undefined,
      status: form.value.statusEnabled ? 1 : 0
    }
    if (dateRange.value) {
      data.startDate = new Date(dateRange.value[0]).toISOString()
      data.endDate = new Date(dateRange.value[1]).toISOString()
    }

    if (isEdit.value) {
      await adminCouponsApi.updateCoupon(couponId.value, data)
    } else {
      await adminCouponsApi.createCoupon(data)
    }
    message.success(t('common.success'))
    router.push({ name: 'AdminCoupons' })
  } catch {
    message.error(t('common.error'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchCoupon()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 600px;
}
</style>

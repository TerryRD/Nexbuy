<template>
  <div class="page-container">
    <n-space vertical size="large">
      <h1>{{ t('admin.pointRules') }}</h1>

      <n-spin :show="loading">
        <n-card>
          <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="160">
            <n-form-item :label="t('admin.earnRate')" path="earnRate">
              <n-input-number v-model:value="form.earnRate" :min="0" :max="100" :precision="2" style="width: 100%;">
                <template #suffix>%</template>
              </n-input-number>
            </n-form-item>
            <n-form-item :label="t('admin.redeemRate')" path="redeemRate">
              <n-input-number v-model:value="form.redeemRate" :min="0" :precision="2" style="width: 100%;">
                <template #suffix>{{ t('member.points') }} = $1</template>
              </n-input-number>
            </n-form-item>
            <n-form-item :label="t('admin.expiryMonths')" path="expiryMonths">
              <n-input-number v-model:value="form.expiryMonths" :min="1" :max="120" style="width: 100%;" />
            </n-form-item>
            <n-form-item>
              <n-button type="primary" :loading="saving" @click="handleSave">{{ t('common.save') }}</n-button>
            </n-form-item>
          </n-form>
        </n-card>

        <!-- Current Values Display -->
        <n-card :title="t('common.status')" style="margin-top: 16px;" v-if="!loading">
          <n-descriptions :column="1" label-placement="left" bordered>
            <n-descriptions-item :label="t('admin.earnRate')">{{ form.earnRate }}%</n-descriptions-item>
            <n-descriptions-item :label="t('admin.redeemRate')">{{ form.redeemRate }} {{ t('member.points') }} = $1</n-descriptions-item>
            <n-descriptions-item :label="t('admin.expiryMonths')">{{ form.expiryMonths }} months</n-descriptions-item>
          </n-descriptions>
        </n-card>
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NForm, NFormItem, NInputNumber, NSpin, NDescriptions, NDescriptionsItem, type FormInst, type FormRules } from 'naive-ui'
import { adminPointsApi } from '@/api/admin'

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const saving = ref(false)
const formRef = ref<FormInst | null>(null)

const form = ref({
  earnRate: 1,
  redeemRate: 10,
  expiryMonths: 12
})

const rules: FormRules = {
  earnRate: { required: true, type: 'number', min: 0, message: t('common.required'), trigger: 'blur' },
  redeemRate: { required: true, type: 'number', min: 0, message: t('common.required'), trigger: 'blur' },
  expiryMonths: { required: true, type: 'number', min: 1, message: t('common.required'), trigger: 'blur' }
}

async function fetchRules() {
  loading.value = true
  try {
    const res = await adminPointsApi.getRules()
    const data = res.data || res
    if (data) {
      form.value.earnRate = data.earnRate ?? 1
      form.value.redeemRate = data.redeemRate ?? 10
      form.value.expiryMonths = data.expiryMonths ?? 12
    }
  } catch {
    // Use defaults
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
    await adminPointsApi.updateRules({
      earnRate: form.value.earnRate,
      redeemRate: form.value.redeemRate,
      expiryMonths: form.value.expiryMonths
    })
    message.success(t('common.success'))
  } catch {
    message.error(t('common.error'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchRules()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 600px;
}
</style>

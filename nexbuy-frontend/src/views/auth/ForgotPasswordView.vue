<template>
  <div class="auth-container">
    <n-card :title="t('auth.forgotPassword')" style="max-width: 420px; margin: 0 auto;">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-form-item :label="t('auth.email')" path="email">
          <n-input v-model:value="form.email" type="text" :placeholder="t('auth.email')" @keyup.enter="handleSubmit" />
        </n-form-item>
        <n-space vertical size="medium" style="width: 100%;">
          <n-button type="primary" block :loading="submitting" :disabled="sent" @click="handleSubmit">
            {{ t('auth.sendResetLink') }}
          </n-button>
          <n-alert v-if="sent" type="success" :title="t('auth.resetLinkSent')" />
          <n-space justify="center">
            <n-button text type="primary" @click="router.push({ name: 'Login' })">
              {{ t('common.back') }} {{ t('nav.login') }}
            </n-button>
          </n-space>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NForm, NFormItem, NInput, NButton, NSpace, NAlert, type FormInst, type FormRules } from 'naive-ui'
import { authApi } from '@/api/auth'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

const formRef = ref<FormInst | null>(null)
const submitting = ref(false)
const sent = ref(false)

const form = ref({
  email: ''
})

const rules: FormRules = {
  email: [
    { required: true, message: t('common.required'), trigger: 'blur' },
    { type: 'email', message: t('common.required'), trigger: 'blur' }
  ]
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    await authApi.forgotPassword(form.value.email)
    sent.value = true
    message.success(t('auth.resetLinkSent'))
  } catch (err: any) {
    const msg = err?.response?.data?.message || t('common.error')
    message.error(msg)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 24px 16px;
}
</style>

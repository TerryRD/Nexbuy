<template>
  <div class="auth-container">
    <n-card :title="t('auth.resetPasswordTitle')" style="max-width: 420px; margin: 0 auto;">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-form-item :label="t('auth.newPassword')" path="password">
          <n-input v-model:value="form.password" type="password" show-password-on="click" :placeholder="t('auth.newPassword')" />
        </n-form-item>
        <n-form-item :label="t('auth.confirmPassword')" path="confirmPassword">
          <n-input v-model:value="form.confirmPassword" type="password" show-password-on="click" :placeholder="t('auth.confirmPassword')" @keyup.enter="handleReset" />
        </n-form-item>
        <n-space vertical size="medium" style="width: 100%;">
          <n-button type="primary" block :loading="submitting" @click="handleReset">
            {{ t('auth.resetPassword') }}
          </n-button>
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
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NForm, NFormItem, NInput, NButton, NSpace, type FormInst, type FormRules } from 'naive-ui'
import { authApi } from '@/api/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const formRef = ref<FormInst | null>(null)
const submitting = ref(false)

const form = ref({
  password: '',
  confirmPassword: ''
})

const rules: FormRules = {
  password: [
    { required: true, message: t('common.required'), trigger: 'blur' },
    { min: 6, message: t('common.required'), trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: t('common.required'), trigger: 'blur' },
    {
      validator: (_rule: any, value: string) => {
        if (value !== form.value.password) {
          return new Error(t('common.required'))
        }
        return true
      },
      trigger: 'blur'
    }
  ]
}

async function handleReset() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  const token = route.query.token as string
  if (!token) {
    message.error(t('common.error'))
    return
  }

  submitting.value = true
  try {
    await authApi.resetPassword(token, form.value.password)
    message.success(t('common.success'))
    router.push({ name: 'Login' })
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

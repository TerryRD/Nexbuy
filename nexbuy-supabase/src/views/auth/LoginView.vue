<template>
  <div class="auth-container">
    <n-card :title="t('auth.loginTitle')" style="max-width: 420px; margin: 0 auto;">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-form-item :label="t('auth.email')" path="email">
          <n-input v-model:value="form.email" type="text" :placeholder="t('auth.email')" @keyup.enter="handleLogin" />
        </n-form-item>
        <n-form-item :label="t('auth.password')" path="password">
          <n-input v-model:value="form.password" type="password" show-password-on="click" :placeholder="t('auth.password')" @keyup.enter="handleLogin" />
        </n-form-item>
        <n-space vertical size="medium" style="width: 100%;">
          <n-button type="primary" block :loading="submitting" @click="handleLogin">
            {{ t('nav.login') }}
          </n-button>
          <n-space justify="space-between">
            <n-button text type="primary" @click="router.push({ name: 'ForgotPassword' })">
              {{ t('auth.forgotPassword') }}
            </n-button>
            <n-button text type="primary" @click="router.push({ name: 'Register' })">
              {{ t('auth.noAccount') }} {{ t('nav.register') }}
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
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const formRef = ref<FormInst | null>(null)
const submitting = ref(false)

const form = ref({
  email: '',
  password: ''
})

const rules: FormRules = {
  email: [
    { required: true, message: t('common.required'), trigger: 'blur' },
    { type: 'email', message: t('common.required'), trigger: 'blur' }
  ],
  password: { required: true, message: t('common.required'), trigger: 'blur' }
}

async function handleLogin() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    await authStore.login({ email: form.value.email, password: form.value.password })
    message.success(t('auth.loginSuccess'))
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
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

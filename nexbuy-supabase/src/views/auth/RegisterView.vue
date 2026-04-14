<template>
  <div class="auth-container">
    <n-card :title="t('auth.registerTitle')" style="max-width: 420px; margin: 0 auto;">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-form-item :label="t('auth.name')" path="name">
          <n-input v-model:value="form.name" :placeholder="t('auth.name')" />
        </n-form-item>
        <n-form-item :label="t('auth.email')" path="email">
          <n-input v-model:value="form.email" type="text" :placeholder="t('auth.email')" />
        </n-form-item>
        <n-form-item :label="t('auth.password')" path="password">
          <n-input v-model:value="form.password" type="password" show-password-on="click" :placeholder="t('auth.password')" />
        </n-form-item>
        <n-form-item :label="t('auth.confirmPassword')" path="confirmPassword">
          <n-input v-model:value="form.confirmPassword" type="password" show-password-on="click" :placeholder="t('auth.confirmPassword')" />
        </n-form-item>
        <n-form-item :label="`${t('auth.phone')} (${t('common.optional')})`" path="phone">
          <n-input v-model:value="form.phone" :placeholder="t('auth.phone')" />
        </n-form-item>
        <n-space vertical size="medium" style="width: 100%;">
          <n-button type="primary" block :loading="submitting" @click="handleRegister">
            {{ t('nav.register') }}
          </n-button>
          <n-space justify="center">
            <n-button text type="primary" @click="router.push({ name: 'Login' })">
              {{ t('auth.hasAccount') }} {{ t('nav.login') }}
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
import { useMessage, NCard, NForm, NFormItem, NInput, NButton, NSpace, type FormInst, type FormRules } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const formRef = ref<FormInst | null>(null)
const submitting = ref(false)

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: ''
})

const rules: FormRules = {
  name: { required: true, message: t('common.required'), trigger: 'blur' },
  email: [
    { required: true, message: t('common.required'), trigger: 'blur' },
    { type: 'email', message: t('common.required'), trigger: 'blur' }
  ],
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

async function handleRegister() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    await authStore.register({
      name: form.value.name,
      email: form.value.email,
      password: form.value.password,
      phone: form.value.phone || undefined
    })
    message.success(t('auth.registerSuccess'))
    router.push({ name: 'Home' })
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

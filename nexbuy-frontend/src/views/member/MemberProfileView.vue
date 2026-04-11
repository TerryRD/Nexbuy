<template>
  <div class="page-container">
    <n-space vertical size="large">
      <h1>{{ t('member.editProfile') }}</h1>

      <n-spin :show="loading">
        <n-card>
          <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="120">
            <n-form-item :label="t('auth.email')">
              <n-input :value="profile?.email" disabled />
            </n-form-item>
            <n-form-item :label="t('auth.name')" path="name">
              <n-input v-model:value="form.name" />
            </n-form-item>
            <n-form-item :label="t('auth.phone')" path="phone">
              <n-input v-model:value="form.phone" />
            </n-form-item>
            <n-form-item :label="t('member.preferredLocale')" path="preferredLocale">
              <n-select v-model:value="form.preferredLocale" :options="localeOptions" />
            </n-form-item>
            <n-form-item>
              <n-button type="primary" :loading="saving" @click="handleSave">
                {{ t('common.save') }}
              </n-button>
            </n-form-item>
          </n-form>
        </n-card>
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NForm, NFormItem, NInput, NSelect, NSpin, type FormInst, type FormRules } from 'naive-ui'
import { membersApi, type UserProfile } from '@/api/members'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const message = useMessage()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const formRef = ref<FormInst | null>(null)
const profile = ref<UserProfile | null>(null)

const form = ref({
  name: '',
  phone: '',
  preferredLocale: 'zh-TW'
})

const localeOptions = [
  { label: '中文 (繁體)', value: 'zh-TW' },
  { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' }
]

const rules: FormRules = {
  name: { required: true, message: t('common.required'), trigger: 'blur' }
}

async function fetchProfile() {
  loading.value = true
  try {
    const res = await membersApi.getProfile()
    profile.value = res.data || res
    if (profile.value) {
      form.value.name = profile.value.name || ''
      form.value.phone = profile.value.phone || ''
      form.value.preferredLocale = profile.value.preferredLocale || 'zh-TW'
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
    await membersApi.updateProfile({
      name: form.value.name,
      phone: form.value.phone,
      preferredLocale: form.value.preferredLocale
    })
    // Update local user data
    if (authStore.user) {
      authStore.user.name = form.value.name
      authStore.user.phone = form.value.phone
      authStore.user.preferredLocale = form.value.preferredLocale
      localStorage.setItem('user', JSON.stringify(authStore.user))
    }
    message.success(t('common.success'))
  } catch {
    message.error(t('common.error'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.page-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 16px;
}
</style>

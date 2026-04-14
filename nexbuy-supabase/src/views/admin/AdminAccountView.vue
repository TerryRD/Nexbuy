<template>
  <div class="page-container">
    <n-space vertical size="large">
      <n-space justify="space-between" align="center">
        <h1>{{ t('admin.adminAccounts') }}</h1>
        <n-button type="primary" @click="openModal()">{{ t('admin.addAdmin') }}</n-button>
      </n-space>

      <n-spin :show="loading">
        <n-data-table
          :columns="columns"
          :data="admins"
          :row-key="(row: any) => row.id"
        />
        <n-empty v-if="!loading && admins.length === 0" :description="t('common.noData')" />
      </n-spin>

      <!-- Add Admin Modal -->
      <n-modal v-model:show="showModal" preset="card" :title="t('admin.addAdmin')" style="max-width: 500px;">
        <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="100">
          <n-form-item :label="t('auth.email')" path="email">
            <n-input v-model:value="form.email" />
          </n-form-item>
          <n-form-item :label="t('auth.password')" path="password">
            <n-input v-model:value="form.password" type="password" show-password-on="click" />
          </n-form-item>
          <n-form-item :label="t('auth.name')" path="name">
            <n-input v-model:value="form.name" />
          </n-form-item>
          <n-form-item :label="t('common.status')">
            <n-select v-model:value="form.role" :options="roleOptions" />
          </n-form-item>
          <n-space justify="end">
            <n-button @click="showModal = false">{{ t('common.cancel') }}</n-button>
            <n-button type="primary" :loading="saving" @click="handleSave">{{ t('common.save') }}</n-button>
          </n-space>
        </n-form>
      </n-modal>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NSpace, NButton, NDataTable, NSpin, NEmpty, NModal, NForm, NFormItem, NInput, NSelect, NTag, type FormInst, type FormRules, type DataTableColumns } from 'naive-ui'
import client from '@/api/client'

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const formRef = ref<FormInst | null>(null)
const admins = ref<any[]>([])

const form = ref({
  email: '',
  password: '',
  name: '',
  role: 'Admin'
})

const roleOptions = [
  { label: 'Admin', value: 'Admin' },
  { label: 'SuperAdmin', value: 'SuperAdmin' }
]

const rules: FormRules = {
  email: [
    { required: true, message: t('common.required'), trigger: 'blur' },
    { type: 'email', message: t('common.required'), trigger: 'blur' }
  ],
  password: [
    { required: true, message: t('common.required'), trigger: 'blur' },
    { min: 6, message: t('common.required'), trigger: 'blur' }
  ],
  name: { required: true, message: t('common.required'), trigger: 'blur' }
}

const columns: DataTableColumns<any> = [
  { title: () => t('auth.name'), key: 'name', width: 140 },
  { title: () => t('auth.email'), key: 'email', width: 200, ellipsis: { tooltip: true } },
  {
    title: () => t('common.status'),
    key: 'role',
    width: 120,
    render(row) {
      return h(NTag, {
        size: 'small',
        type: row.role === 'SuperAdmin' ? 'warning' : 'info'
      }, { default: () => row.role })
    }
  },
  {
    title: () => t('order.orderDate'),
    key: 'createdAt',
    width: 120,
    render(row) { return row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-' }
  }
]

function openModal() {
  form.value = { email: '', password: '', name: '', role: 'Admin' }
  showModal.value = true
}

async function fetchAdmins() {
  loading.value = true
  try {
    const res = await client.get('/admin/admins')
    admins.value = res.data?.items || res.data || []
  } catch {
    // Admin accounts endpoint may not exist yet
    admins.value = []
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
    await client.post('/admin/admins', {
      email: form.value.email,
      password: form.value.password,
      name: form.value.name,
      role: form.value.role
    })
    message.success(t('common.success'))
    showModal.value = false
    fetchAdmins()
  } catch {
    message.error(t('common.error'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchAdmins()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
}
</style>

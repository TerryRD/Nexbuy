<template>
  <div class="page-container">
    <n-space vertical size="large">
      <n-space justify="space-between" align="center">
        <h1>{{ t('member.addresses') }}</h1>
        <n-button type="primary" @click="openModal()">{{ t('member.addAddress') }}</n-button>
      </n-space>

      <n-spin :show="loading">
        <n-grid :cols="2" :x-gap="16" :y-gap="16" responsive="screen" :cols-xs="1">
          <n-gi v-for="addr in addresses" :key="addr.id">
            <n-card>
              <template #header>
                <n-space align="center">
                  <span>{{ addr.label }}</span>
                  <n-tag v-if="addr.isDefault" size="small" type="success">{{ t('member.defaultAddress') }}</n-tag>
                  <n-tag v-if="addr.addressType === 1" size="small" type="info">{{ t('member.convenienceStore') }}</n-tag>
                </n-space>
              </template>
              <template #header-extra>
                <n-space>
                  <n-button size="small" @click="openModal(addr)">{{ t('common.edit') }}</n-button>
                  <n-popconfirm @positive-click="handleDelete(addr.id)">
                    <template #trigger>
                      <n-button size="small" type="error">{{ t('common.delete') }}</n-button>
                    </template>
                    {{ t('member.deleteAddressConfirm') }}
                  </n-popconfirm>
                </n-space>
              </template>
              <n-space vertical size="small">
                <div>{{ addr.recipientName }} / {{ addr.phone }}</div>
                <div v-if="addr.addressType === 0">{{ addr.zipCode }} {{ addr.city }} {{ addr.address }}</div>
                <div v-else>{{ addr.storeName }} ({{ addr.storeId }})</div>
              </n-space>
            </n-card>
          </n-gi>
        </n-grid>
        <n-empty v-if="!loading && addresses.length === 0" :description="t('common.noData')" />
      </n-spin>

      <!-- Add/Edit Modal -->
      <n-modal v-model:show="showModal" preset="card" :title="editingId ? t('member.editAddress') : t('member.addAddress')" style="max-width: 600px;">
        <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="120">
          <n-form-item :label="t('member.addressLabel')" path="label">
            <n-input v-model:value="form.label" />
          </n-form-item>
          <n-form-item :label="t('member.recipientName')" path="recipientName">
            <n-input v-model:value="form.recipientName" />
          </n-form-item>
          <n-form-item :label="t('auth.phone')" path="phone">
            <n-input v-model:value="form.phone" />
          </n-form-item>
          <n-form-item :label="t('member.address')">
            <n-space>
              <n-button
                :type="form.addressType === 0 ? 'primary' : 'default'"
                @click="form.addressType = 0"
              >{{ t('member.regularAddress') }}</n-button>
              <n-button
                :type="form.addressType === 1 ? 'primary' : 'default'"
                @click="form.addressType = 1"
              >{{ t('member.convenienceStore') }}</n-button>
            </n-space>
          </n-form-item>

          <template v-if="form.addressType === 0">
            <n-form-item :label="t('member.zipCode')" path="zipCode">
              <n-input v-model:value="form.zipCode" />
            </n-form-item>
            <n-form-item :label="t('member.city')" path="city">
              <n-input v-model:value="form.city" />
            </n-form-item>
            <n-form-item :label="t('member.address')" path="address">
              <n-input v-model:value="form.address" />
            </n-form-item>
          </template>

          <template v-else>
            <n-form-item :label="t('member.storeId')" path="storeId">
              <n-input v-model:value="form.storeId" />
            </n-form-item>
            <n-form-item :label="t('member.storeName')" path="storeName">
              <n-input v-model:value="form.storeName" />
            </n-form-item>
          </template>

          <n-form-item :label="t('member.setDefault')">
            <n-switch v-model:value="form.isDefault" />
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
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NGrid, NGi, NTag, NSpin, NEmpty, NModal, NForm, NFormItem, NInput, NSwitch, NPopconfirm, type FormInst, type FormRules } from 'naive-ui'
import { membersApi, type Address } from '@/api/members'

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingId = ref<string | null>(null)
const formRef = ref<FormInst | null>(null)
const addresses = ref<Address[]>([])

const form = ref({
  label: '',
  recipientName: '',
  phone: '',
  addressType: 0,
  zipCode: '',
  city: '',
  address: '',
  storeId: '',
  storeName: '',
  isDefault: false
})

const rules: FormRules = {
  label: { required: true, message: t('common.required'), trigger: 'blur' },
  recipientName: { required: true, message: t('common.required'), trigger: 'blur' },
  phone: { required: true, message: t('common.required'), trigger: 'blur' }
}

function resetForm() {
  form.value = {
    label: '',
    recipientName: '',
    phone: '',
    addressType: 0,
    zipCode: '',
    city: '',
    address: '',
    storeId: '',
    storeName: '',
    isDefault: false
  }
  editingId.value = null
}

function openModal(addr?: Address) {
  resetForm()
  if (addr) {
    editingId.value = addr.id
    form.value = {
      label: addr.label,
      recipientName: addr.recipientName,
      phone: addr.phone,
      addressType: addr.addressType,
      zipCode: addr.zipCode || '',
      city: addr.city || '',
      address: addr.address || '',
      storeId: addr.storeId || '',
      storeName: addr.storeName || '',
      isDefault: addr.isDefault
    }
  }
  showModal.value = true
}

async function fetchAddresses() {
  loading.value = true
  try {
    const res = await membersApi.getAddresses()
    addresses.value = res.data || []
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
      label: form.value.label,
      recipientName: form.value.recipientName,
      phone: form.value.phone,
      addressType: form.value.addressType,
      isDefault: form.value.isDefault
    }
    if (form.value.addressType === 0) {
      data.zipCode = form.value.zipCode
      data.city = form.value.city
      data.address = form.value.address
    } else {
      data.storeId = form.value.storeId
      data.storeName = form.value.storeName
    }

    if (editingId.value) {
      await membersApi.updateAddress(editingId.value, data)
    } else {
      await membersApi.createAddress(data)
    }
    message.success(t('common.success'))
    showModal.value = false
    fetchAddresses()
  } catch {
    message.error(t('common.error'))
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: string) {
  try {
    await membersApi.deleteAddress(id)
    message.success(t('common.success'))
    fetchAddresses()
  } catch {
    message.error(t('common.error'))
  }
}

onMounted(() => {
  fetchAddresses()
})
</script>

<style scoped>
.page-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 16px;
}
</style>

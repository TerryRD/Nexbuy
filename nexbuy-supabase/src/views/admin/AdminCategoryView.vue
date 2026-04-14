<template>
  <div class="page-container">
    <n-space vertical size="large">
      <n-space justify="space-between" align="center">
        <h1>{{ t('admin.categories') }}</h1>
        <n-button type="primary" @click="openModal()">{{ t('admin.addCategory') }}</n-button>
      </n-space>

      <n-spin :show="loading">
        <!-- Category Tree Display -->
        <n-card>
          <template v-if="categories.length > 0">
            <div v-for="cat in categories" :key="cat.id" style="margin-bottom: 16px;">
              <n-space align="center" justify="space-between" style="padding: 8px; background: #fafafa; border-radius: 6px;">
                <n-space align="center">
                  <strong>{{ cat.name }}</strong>
                  <n-tag size="small">{{ cat.slug }}</n-tag>
                  <n-tag size="small" type="info">{{ t('admin.sortOrder') }}: {{ cat.sortOrder }}</n-tag>
                </n-space>
                <n-space>
                  <n-button size="small" @click="openModal(cat)">{{ t('common.edit') }}</n-button>
                  <n-popconfirm @positive-click="handleDelete(cat.id)">
                    <template #trigger>
                      <n-button size="small" type="error">{{ t('common.delete') }}</n-button>
                    </template>
                    {{ t('common.confirm') }}?
                  </n-popconfirm>
                </n-space>
              </n-space>
              <!-- Children -->
              <div v-if="cat.children && cat.children.length > 0" style="margin-left: 32px; margin-top: 8px;">
                <div v-for="child in cat.children" :key="child.id" style="margin-bottom: 8px;">
                  <n-space align="center" justify="space-between" style="padding: 8px; background: #f0f0f0; border-radius: 6px;">
                    <n-space align="center">
                      <span>{{ child.name }}</span>
                      <n-tag size="small">{{ child.slug }}</n-tag>
                      <n-tag size="small" type="info">{{ t('admin.sortOrder') }}: {{ child.sortOrder }}</n-tag>
                    </n-space>
                    <n-space>
                      <n-button size="small" @click="openModal(child, cat.id)">{{ t('common.edit') }}</n-button>
                      <n-popconfirm @positive-click="handleDelete(child.id)">
                        <template #trigger>
                          <n-button size="small" type="error">{{ t('common.delete') }}</n-button>
                        </template>
                        {{ t('common.confirm') }}?
                      </n-popconfirm>
                    </n-space>
                  </n-space>
                </div>
              </div>
            </div>
          </template>
          <n-empty v-else :description="t('common.noData')" />
        </n-card>
      </n-spin>

      <!-- Add/Edit Modal -->
      <n-modal v-model:show="showModal" preset="card" :title="editingId ? t('admin.editCategory') : t('admin.addCategory')" style="max-width: 500px;">
        <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="120">
          <n-form-item :label="t('admin.productName')" path="name">
            <n-input v-model:value="form.name" />
          </n-form-item>
          <n-form-item :label="t('admin.slug')" path="slug">
            <n-input v-model:value="form.slug" />
          </n-form-item>
          <n-form-item :label="t('product.category')">
            <n-tree-select
              v-model:value="form.parentId"
              :options="parentOptions"
              key-field="id"
              label-field="name"
              children-field="children"
              clearable
              :placeholder="t('common.optional')"
            />
          </n-form-item>
          <n-form-item :label="t('admin.sortOrder')" path="sortOrder">
            <n-input-number v-model:value="form.sortOrder" :min="0" style="width: 100%;" />
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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NTag, NSpin, NEmpty, NModal, NForm, NFormItem, NInput, NInputNumber, NTreeSelect, NPopconfirm, type FormInst, type FormRules } from 'naive-ui'
import { adminProductsApi } from '@/api/admin'
import { type Category } from '@/api/products'

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInst | null>(null)
const categories = ref<Category[]>([])

const form = ref({
  name: '',
  slug: '',
  parentId: null as number | null,
  sortOrder: 0
})

const rules: FormRules = {
  name: { required: true, message: t('common.required'), trigger: 'blur' },
  slug: { required: true, message: t('common.required'), trigger: 'blur' }
}

const parentOptions = computed(() => {
  // Only top-level categories can be parents
  return categories.value.map(c => ({ id: c.id, name: c.name, children: [] }))
})

function openModal(cat?: any, parentId?: number) {
  form.value = { name: '', slug: '', parentId: null, sortOrder: 0 }
  editingId.value = null
  if (cat) {
    editingId.value = cat.id
    form.value.name = cat.name
    form.value.slug = cat.slug
    form.value.parentId = parentId || null
    form.value.sortOrder = cat.sortOrder
  }
  showModal.value = true
}

async function fetchCategories() {
  loading.value = true
  try {
    const res = await adminProductsApi.getCategories()
    categories.value = res.data || []
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
      name: form.value.name,
      slug: form.value.slug,
      parentId: form.value.parentId,
      sortOrder: form.value.sortOrder
    }
    if (editingId.value) {
      await adminProductsApi.updateCategory(editingId.value, data)
    } else {
      await adminProductsApi.createCategory(data)
    }
    message.success(t('common.success'))
    showModal.value = false
    fetchCategories()
  } catch {
    message.error(t('common.error'))
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await adminProductsApi.deleteCategory(id)
    message.success(t('common.success'))
    fetchCategories()
  } catch {
    message.error(t('common.error'))
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
}
</style>

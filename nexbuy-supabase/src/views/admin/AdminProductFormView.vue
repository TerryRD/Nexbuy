<template>
  <div class="page-container">
    <n-space vertical size="large">
      <n-space align="center">
        <n-button text @click="router.push({ name: 'AdminProducts' })">{{ t('common.back') }}</n-button>
        <h1>{{ isEdit ? t('admin.editProduct') : t('admin.addProduct') }}</h1>
      </n-space>

      <n-spin :show="loading">
        <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="140">
          <!-- Basic Info -->
          <n-card :title="t('admin.productName')">
            <n-form-item :label="t('admin.sku')" path="sku">
              <n-input v-model:value="form.sku" />
            </n-form-item>
            <n-form-item :label="t('admin.productType')" path="type">
              <n-select v-model:value="form.type" :options="typeOptions" />
            </n-form-item>
            <n-form-item :label="t('product.price')" path="price">
              <n-input-number v-model:value="form.price" :min="0" :precision="2" style="width: 100%;" />
            </n-form-item>
            <n-form-item :label="t('product.stock')" path="stock">
              <n-input-number v-model:value="form.stock" :min="0" style="width: 100%;" />
            </n-form-item>
            <n-form-item :label="t('product.category')" path="categoryId">
              <n-tree-select
                v-model:value="form.categoryId"
                :options="categoryTree"
                key-field="id"
                label-field="name"
                children-field="children"
                clearable
              />
            </n-form-item>
            <n-form-item :label="t('admin.productStatus')">
              <n-select v-model:value="form.status" :options="statusOptions" />
            </n-form-item>

            <!-- Digital product fields -->
            <template v-if="form.type === 1">
              <n-form-item :label="t('product.maxDownloads')">
                <n-input-number v-model:value="form.maxDownloads" :min="1" style="width: 100%;" />
              </n-form-item>
              <n-form-item :label="t('product.downloadExpiry')">
                <n-input-number v-model:value="form.downloadExpiryHours" :min="1" style="width: 100%;" />
              </n-form-item>
            </template>
          </n-card>

          <!-- Translations -->
          <n-card :title="t('admin.translations')" style="margin-top: 16px;">
            <n-tabs type="line">
              <n-tab-pane v-for="locale in locales" :key="locale.value" :name="locale.value" :tab="locale.label">
                <n-form-item :label="t('admin.productName')">
                  <n-input v-model:value="getTranslation(locale.value).name" />
                </n-form-item>
                <n-form-item :label="t('product.description')">
                  <n-input v-model:value="getTranslation(locale.value).description" type="textarea" :rows="6" />
                </n-form-item>
              </n-tab-pane>
            </n-tabs>
          </n-card>

          <!-- Variants -->
          <n-card :title="t('admin.variants')" style="margin-top: 16px;">
            <n-space vertical>
              <div v-for="(variant, index) in form.variants" :key="index">
                <n-space align="center">
                  <n-input v-model:value="variant.variantName" :placeholder="t('admin.productName')" style="width: 160px;" />
                  <n-input v-model:value="variant.sku" :placeholder="t('admin.sku')" style="width: 120px;" />
                  <n-input-number v-model:value="variant.priceAdjustment" :placeholder="t('product.price')" style="width: 120px;" />
                  <n-input-number v-model:value="variant.stock" :placeholder="t('product.stock')" :min="0" style="width: 100px;" />
                  <n-button type="error" size="small" @click="removeVariant(index)">{{ t('common.delete') }}</n-button>
                </n-space>
              </div>
              <n-button dashed @click="addVariant">{{ t('common.create') }} {{ t('admin.variants') }}</n-button>
            </n-space>
          </n-card>

          <!-- Images -->
          <n-card :title="t('admin.images')" style="margin-top: 16px;">
            <n-upload
              v-if="isEdit"
              action=""
              :custom-request="handleUpload"
              list-type="image-card"
              :max="10"
              accept="image/*"
            >
              {{ t('admin.uploadImage') }}
            </n-upload>
            <n-alert v-else type="info">
              {{ t('admin.uploadImage') }} - Save the product first, then upload images.
            </n-alert>
            <!-- Existing images -->
            <n-space v-if="existingImages.length > 0" style="margin-top: 16px;">
              <div v-for="img in existingImages" :key="img.id" style="position: relative; display: inline-block;">
                <n-image :src="img.url" width="120" height="120" object-fit="cover" />
                <n-button
                  size="tiny"
                  type="error"
                  circle
                  style="position: absolute; top: 4px; right: 4px;"
                  @click="handleDeleteImage(img.id)"
                >X</n-button>
              </div>
            </n-space>
          </n-card>

          <!-- Save -->
          <n-space style="margin-top: 24px;">
            <n-button type="primary" size="large" :loading="saving" @click="handleSave">
              {{ t('common.save') }}
            </n-button>
            <n-button @click="router.push({ name: 'AdminProducts' })">{{ t('common.cancel') }}</n-button>
          </n-space>
        </n-form>
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NForm, NFormItem, NInput, NInputNumber, NSelect, NTreeSelect, NTabs, NTabPane, NUpload, NImage, NSpin, NAlert, type FormInst, type FormRules, type UploadCustomRequestOptions } from 'naive-ui'
import { adminProductsApi } from '@/api/admin'
import { productsApi, type Category } from '@/api/products'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const saving = ref(false)
const formRef = ref<FormInst | null>(null)
const categoryTree = ref<Category[]>([])
const existingImages = ref<{ id: string; url: string; sortOrder: number }[]>([])

const isEdit = computed(() => !!route.params.id)
const productId = computed(() => route.params.id as string)

const locales = [
  { label: '中文 (繁體)', value: 'zh-TW' },
  { label: 'English', value: 'en' },
  { label: '日本語', value: 'ja' }
]

const typeOptions = [
  { label: t('product.physical'), value: 0 },
  { label: t('product.digital'), value: 1 }
]

const statusOptions = [
  { label: t('admin.active'), value: 1 },
  { label: t('admin.inactive'), value: 0 }
]

const form = ref({
  sku: '',
  type: 0,
  price: 0,
  stock: 0,
  categoryId: null as number | null,
  status: 1,
  maxDownloads: 5,
  downloadExpiryHours: 72,
  translations: [
    { locale: 'zh-TW', name: '', description: '' },
    { locale: 'en', name: '', description: '' },
    { locale: 'ja', name: '', description: '' }
  ] as { locale: string; name: string; description: string }[],
  variants: [] as { variantName: string; sku: string; priceAdjustment: number; stock: number }[]
})

const rules: FormRules = {
  sku: { required: true, message: t('common.required'), trigger: 'blur' },
  price: { required: true, type: 'number', min: 0, message: t('common.required'), trigger: 'blur' }
}

function getTranslation(locale: string) {
  let trans = form.value.translations.find(t => t.locale === locale)
  if (!trans) {
    trans = { locale, name: '', description: '' }
    form.value.translations.push(trans)
  }
  return trans
}

function addVariant() {
  form.value.variants.push({ variantName: '', sku: '', priceAdjustment: 0, stock: 0 })
}

function removeVariant(index: number) {
  form.value.variants.splice(index, 1)
}

async function fetchCategories() {
  try {
    const res = await productsApi.getCategories()
    categoryTree.value = res.data || []
  } catch {}
}

async function fetchProduct() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const res = await adminProductsApi.getProducts({ search: productId.value })
    // Try direct product fetch via products API
    const prodRes = await productsApi.getProduct(productId.value)
    const product = prodRes.data || prodRes
    if (product) {
      form.value.sku = product.sku || ''
      form.value.type = product.type || 0
      form.value.price = product.price || 0
      form.value.stock = product.stock || 0
      form.value.categoryId = product.categoryId || null
      form.value.status = product.status ?? 1
      form.value.maxDownloads = product.maxDownloads || 5
      form.value.downloadExpiryHours = product.downloadExpiryHours || 72
      if (product.translations?.length) {
        form.value.translations = product.translations
      }
      if (product.variants?.length) {
        form.value.variants = product.variants.map((v: any) => ({
          variantName: v.variantName,
          sku: v.sku,
          priceAdjustment: v.priceAdjustment,
          stock: v.stock
        }))
      }
      if (product.images?.length) {
        existingImages.value = product.images
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
      sku: form.value.sku,
      type: form.value.type,
      price: form.value.price,
      stock: form.value.stock,
      categoryId: form.value.categoryId,
      status: form.value.status,
      translations: form.value.translations.filter(t => t.name),
      variants: form.value.variants.filter(v => v.variantName)
    }
    if (form.value.type === 1) {
      data.maxDownloads = form.value.maxDownloads
      data.downloadExpiryHours = form.value.downloadExpiryHours
    }

    if (isEdit.value) {
      await adminProductsApi.updateProduct(productId.value, data)
    } else {
      const res = await adminProductsApi.createProduct(data)
      const newId = res.data?.id || res.id
      if (newId) {
        router.replace({ name: 'AdminProductEdit', params: { id: newId } })
      }
    }
    message.success(t('common.success'))
  } catch {
    message.error(t('common.error'))
  } finally {
    saving.value = false
  }
}

async function handleUpload({ file, onFinish, onError }: UploadCustomRequestOptions) {
  if (!isEdit.value || !file.file) {
    onError()
    return
  }
  const fd = new FormData()
  fd.append('file', file.file)
  try {
    const res = await adminProductsApi.uploadImage(productId.value, fd)
    const img = res.data || res
    if (img) existingImages.value.push(img)
    onFinish()
    message.success(t('common.success'))
  } catch {
    onError()
    message.error(t('common.error'))
  }
}

async function handleDeleteImage(imageId: string) {
  try {
    await adminProductsApi.deleteImage(productId.value, imageId)
    existingImages.value = existingImages.value.filter(img => img.id !== imageId)
    message.success(t('common.success'))
  } catch {
    message.error(t('common.error'))
  }
}

onMounted(() => {
  fetchCategories()
  fetchProduct()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
  max-width: 900px;
}
</style>

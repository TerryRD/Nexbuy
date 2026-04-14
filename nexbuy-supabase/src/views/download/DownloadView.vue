<template>
  <div class="page-container">
    <n-space vertical size="large" align="center" style="text-align: center; padding: 48px 0;">
      <h1>{{ t('download.title') }}</h1>

      <n-spin :show="loading">
        <template v-if="!loading">
          <!-- Success state -->
          <n-card v-if="downloadInfo && !error" style="max-width: 500px;">
            <n-space vertical size="large" align="center">
              <h3>{{ downloadInfo.productName }}</h3>
              <p>{{ t('download.downloadCount', { current: downloadInfo.downloadCount, max: downloadInfo.maxDownloads }) }}</p>
              <n-button
                type="primary"
                size="large"
                :loading="downloading"
                @click="handleDownload"
              >
                {{ t('download.startDownload') }}
              </n-button>
            </n-space>
          </n-card>

          <!-- Error state -->
          <n-result v-if="error" status="error" :title="errorTitle" :description="errorDescription">
            <template #footer>
              <n-button @click="router.push({ name: 'Home' })">{{ t('error.backToHome') }}</n-button>
            </template>
          </n-result>
        </template>
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NCard, NSpace, NButton, NSpin, NResult } from 'naive-ui'
import { supabase } from '@/lib/supabase'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()

interface DownloadInfo {
  productName: string
  downloadCount: number
  maxDownloads: number
  expiresAt: string
  isRevoked: boolean
}

const loading = ref(true)
const downloading = ref(false)
const downloadInfo = ref<DownloadInfo | null>(null)
const error = ref<string | null>(null)
const errorTitle = ref('')
const errorDescription = ref('')

async function verifyToken() {
  const token = route.params.token as string
  if (!token) {
    setError('invalid')
    return
  }
  loading.value = true
  try {
    const { data: result, error: fnError } = await supabase.functions.invoke('download', {
      body: { token, verify_only: true }
    })
    if (fnError || !result?.success) {
      setError('invalid')
      return
    }
    const data = result.data
    downloadInfo.value = data

    if (data.isRevoked) {
      setError('invalid')
      return
    }
    if (new Date(data.expiresAt) < new Date()) {
      setError('expired')
      return
    }
    if (data.downloadCount >= data.maxDownloads) {
      setError('limit')
      return
    }
  } catch (err: any) {
    setError('invalid')
  } finally {
    loading.value = false
  }
}

function setError(type: string) {
  error.value = type
  switch (type) {
    case 'expired':
      errorTitle.value = t('download.tokenExpired')
      errorDescription.value = t('download.tokenExpired')
      break
    case 'limit':
      errorTitle.value = t('download.limitExceeded')
      errorDescription.value = t('download.limitExceeded')
      break
    default:
      errorTitle.value = t('download.tokenInvalid')
      errorDescription.value = t('download.tokenInvalid')
  }
}

async function handleDownload() {
  const token = route.params.token as string
  downloading.value = true
  try {
    const { data: dlResult, error: dlError } = await supabase.functions.invoke('download', {
      body: { token }
    })
    if (dlError) throw dlError
    const blob = new Blob([dlResult as any])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = downloadInfo.value?.productName || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    // Refresh info
    if (downloadInfo.value) {
      downloadInfo.value.downloadCount++
    }
    message.success(t('common.success'))
  } catch {
    message.error(t('common.error'))
  } finally {
    downloading.value = false
  }
}

onMounted(() => {
  verifyToken()
})
</script>

<style scoped>
.page-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 16px;
}
</style>

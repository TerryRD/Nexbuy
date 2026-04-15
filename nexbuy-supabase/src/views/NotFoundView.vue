<template>
  <div class="page-container">
    <n-space vertical size="large" align="center" style="text-align: center; padding: 80px 0;">
      <n-result status="404" :title="t('error.notFound')" :description="t('error.notFoundMessage')">
        <template #footer>
          <n-button type="primary" @click="router.push({ name: 'Home' })">
            {{ t('error.backToHome') }}
          </n-button>
        </template>
      </n-result>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NResult, NButton, NSpace } from 'naive-ui'

const { t } = useI18n()
const router = useRouter()
</script>

<style scoped>
.page-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px 16px;
}
</style>

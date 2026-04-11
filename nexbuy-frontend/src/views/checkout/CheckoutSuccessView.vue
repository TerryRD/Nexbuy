<template>
  <div class="page-container">
    <n-space vertical size="large" align="center" style="text-align: center; padding: 48px 0;">
      <n-result status="success" :title="t('checkout.orderSuccess')" :description="orderDescription">
        <template #footer>
          <n-space justify="center">
            <n-button type="primary" @click="router.push({ name: 'MemberOrderDetail', params: { orderNo } })">
              {{ t('checkout.viewOrder') }}
            </n-button>
            <n-button @click="router.push({ name: 'Home' })">
              {{ t('checkout.backToHome') }}
            </n-button>
          </n-space>
        </template>
      </n-result>

      <n-card style="max-width: 500px; text-align: left;">
        <n-descriptions :column="1" label-placement="left" bordered>
          <n-descriptions-item :label="t('checkout.orderNo')">{{ orderNo }}</n-descriptions-item>
          <n-descriptions-item :label="t('checkout.paymentMethod')">{{ t('checkout.manualPayment') }}</n-descriptions-item>
        </n-descriptions>
        <n-divider />
        <n-alert type="info" :title="t('checkout.paymentNote')">
          {{ t('checkout.paymentNote') }}
        </n-alert>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NResult, NButton, NSpace, NCard, NDescriptions, NDescriptionsItem, NDivider, NAlert } from 'naive-ui'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const orderNo = computed(() => route.params.orderNo as string)
const orderDescription = computed(() => `${t('checkout.orderNo')}: ${orderNo.value}`)
</script>

<style scoped>
.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}
</style>

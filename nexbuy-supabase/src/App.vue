<template>
  <n-config-provider :locale="naiveLocale" :date-locale="naiveDateLocale">
    <n-message-provider>
      <n-dialog-provider>
        <component :is="layoutComponent">
          <router-view />
        </component>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { NConfigProvider, NMessageProvider, NDialogProvider, zhTW, dateZhTW, enUS, dateEnUS, jaJP, dateJaJP } from 'naive-ui'
import { useLocaleStore } from '@/stores/locale'
import { useCartStore } from '@/stores/cart'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

const route = useRoute()
const localeStore = useLocaleStore()
const cartStore = useCartStore()

const layoutComponent = computed(() => {
  const layout = route.meta.layout as string
  if (layout === 'auth') return AuthLayout
  if (layout === 'admin') return AdminLayout
  return DefaultLayout
})

const naiveLocale = computed(() => {
  const map: Record<string, any> = { 'zh-TW': zhTW, en: enUS, ja: jaJP }
  return map[localeStore.currentLocale] || zhTW
})

const naiveDateLocale = computed(() => {
  const map: Record<string, any> = { 'zh-TW': dateZhTW, en: dateEnUS, ja: dateJaJP }
  return map[localeStore.currentLocale] || dateZhTW
})

onMounted(() => {
  localeStore.initLocale()
  cartStore.fetchCart()
})
</script>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
a {
  text-decoration: none;
  color: inherit;
}
</style>

<template>
  <n-layout class="min-h-screen">
    <n-layout-header bordered class="header">
      <div class="header-content">
        <div class="header-left">
          <router-link to="/" class="logo">
            <n-text strong style="font-size: 24px; color: var(--primary-color)">Nexbuy</n-text>
          </router-link>
          <n-menu mode="horizontal" :options="navOptions" :value="activeNav" />
        </div>
        <div class="header-center">
          <n-input
            v-model:value="searchQuery"
            :placeholder="t('product.searchPlaceholder')"
            round
            clearable
            style="width: 320px"
            @keyup.enter="doSearch"
          >
            <template #prefix>
              <n-icon><SearchOutline /></n-icon>
            </template>
          </n-input>
        </div>
        <div class="header-right">
          <n-dropdown :options="localeOptions" @select="changeLocale" trigger="click">
            <n-button quaternary>
              <n-icon><GlobeOutline /></n-icon>
              {{ currentLocaleName }}
            </n-button>
          </n-dropdown>
          <router-link to="/cart">
            <n-badge :value="cartStore.itemCount" :max="99" :show-zero="false">
              <n-button quaternary>
                <n-icon size="20"><CartOutline /></n-icon>
              </n-button>
            </n-badge>
          </router-link>
          <template v-if="auth.isAuthenticated">
            <n-dropdown :options="userMenuOptions" @select="handleUserMenu" trigger="click">
              <n-button quaternary>
                <n-icon><PersonOutline /></n-icon>
                {{ auth.user?.name }}
              </n-button>
            </n-dropdown>
          </template>
          <template v-else>
            <router-link to="/login">
              <n-button type="primary" size="small">{{ t('nav.login') }}</n-button>
            </router-link>
          </template>
        </div>
      </div>
    </n-layout-header>
    <n-layout-content class="main-content">
      <router-view />
    </n-layout-content>
    <n-layout-footer bordered class="footer">
      <div class="footer-content">
        <n-text depth="3">&copy; 2026 Nexbuy. {{ t('footer.copyright') }}</n-text>
      </div>
    </n-layout-footer>
  </n-layout>
</template>

<script setup lang="ts">
import { computed, ref, h } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NLayout, NLayoutHeader, NLayoutContent, NLayoutFooter, NMenu, NInput, NButton, NBadge, NIcon, NText, NDropdown } from 'naive-ui'
import { SearchOutline, GlobeOutline, CartOutline, PersonOutline } from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useLocaleStore } from '@/stores/locale'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const cartStore = useCartStore()
const localeStore = useLocaleStore()
const searchQuery = ref('')

const activeNav = computed(() => {
  const path = router.currentRoute.value.path
  if (path === '/') return 'home'
  if (path.startsWith('/products')) return 'products'
  return ''
})

const navOptions = computed(() => [
  { label: () => h(RouterLink, { to: '/' }, { default: () => t('nav.home') }), key: 'home' },
  { label: () => h(RouterLink, { to: '/products' }, { default: () => t('nav.products') }), key: 'products' }
])

const localeOptions = [
  { label: '繁體中文', key: 'zh-TW' },
  { label: 'English', key: 'en' },
  { label: '日本語', key: 'ja' }
]

const currentLocaleName = computed(() => {
  const map: Record<string, string> = { 'zh-TW': '繁中', en: 'EN', ja: '日本語' }
  return map[localeStore.currentLocale] || '繁中'
})

function changeLocale(key: string) {
  localeStore.setLocale(key)
  locale.value = key
}

const userMenuOptions = computed(() => [
  { label: t('member.center'), key: 'member' },
  { label: t('member.orders'), key: 'orders' },
  { label: t('member.wishlist'), key: 'wishlist' },
  { type: 'divider', key: 'd1' },
  { label: t('nav.logout'), key: 'logout' }
])

function handleUserMenu(key: string) {
  if (key === 'logout') {
    auth.logout()
    router.push('/')
  } else if (key === 'member') {
    router.push('/member')
  } else if (key === 'orders') {
    router.push('/member/orders')
  } else if (key === 'wishlist') {
    router.push('/member/wishlist')
  }
}

function doSearch() {
  if (searchQuery.value.trim()) {
    router.push({ name: 'Search', query: { q: searchQuery.value.trim() } })
  }
}
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
}
.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.header-left .logo {
  text-decoration: none;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.main-content {
  min-height: calc(100vh - 128px);
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
  width: 100%;
}
.footer {
  text-align: center;
  padding: 16px;
}
</style>

<template>
  <n-layout has-sider class="admin-layout">
    <n-layout-sider bordered :collapsed-width="64" :width="240" show-trigger collapse-mode="width" :native-scrollbar="false">
      <div class="admin-logo">
        <router-link to="/admin">
          <n-text strong style="font-size: 20px; color: var(--primary-color)">Nexbuy Admin</n-text>
        </router-link>
      </div>
      <n-menu :options="menuOptions" :value="activeMenu" @update:value="handleMenuSelect" />
    </n-layout-sider>
    <n-layout>
      <n-layout-header bordered class="admin-header">
        <div class="admin-header-content">
          <n-text>{{ t('admin.dashboard') }}</n-text>
          <div class="admin-header-right">
            <n-text depth="3">{{ auth.user?.name }}</n-text>
            <n-button text @click="handleLogout">{{ t('nav.logout') }}</n-button>
          </div>
        </div>
      </n-layout-header>
      <n-layout-content class="admin-content">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu, NText, NButton, NIcon } from 'naive-ui'
import { GridOutline, CubeOutline, ReceiptOutline, PeopleOutline, PricetagOutline, StarOutline, StatsChartOutline, SettingsOutline } from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = computed(() => [
  { label: t('admin.dashboard'), key: 'AdminDashboard', icon: renderIcon(GridOutline) },
  { label: t('admin.products'), key: 'products-group', icon: renderIcon(CubeOutline), children: [
    { label: t('admin.products'), key: 'AdminProducts' },
    { label: t('admin.categories'), key: 'AdminCategories' }
  ]},
  { label: t('admin.orders'), key: 'AdminOrders', icon: renderIcon(ReceiptOutline) },
  { label: t('admin.members'), key: 'AdminMembers', icon: renderIcon(PeopleOutline) },
  { label: t('admin.coupons'), key: 'AdminCoupons', icon: renderIcon(PricetagOutline) },
  { label: t('admin.pointRules'), key: 'AdminPointRules', icon: renderIcon(StarOutline) },
  { label: t('admin.reports'), key: 'reports-group', icon: renderIcon(StatsChartOutline), children: [
    { label: t('admin.salesReport'), key: 'AdminSalesReport' },
    { label: t('admin.topProducts'), key: 'AdminProductReport' },
    { label: t('admin.orderTrend'), key: 'AdminOrderReport' }
  ]},
  { label: t('admin.settings'), key: 'AdminAccounts', icon: renderIcon(SettingsOutline) }
])

const activeMenu = computed(() => router.currentRoute.value.name as string)

function handleMenuSelect(key: string) {
  if (!key.endsWith('-group')) {
    router.push({ name: key })
  }
}

function handleLogout() {
  auth.logout()
  router.push('/admin/login')
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}
.admin-logo {
  padding: 16px;
  text-align: center;
}
.admin-logo a {
  text-decoration: none;
}
.admin-header {
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
}
.admin-header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.admin-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.admin-content {
  padding: 24px;
}
</style>

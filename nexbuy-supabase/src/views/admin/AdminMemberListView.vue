<template>
  <div class="page-container">
    <n-space vertical size="large">
      <n-space justify="space-between" align="center">
        <h1>{{ t('admin.memberManagement') }}</h1>
        <n-button @click="handleExport">{{ t('admin.exportExcel') }}</n-button>
      </n-space>

      <!-- Search -->
      <n-space>
        <n-input v-model:value="searchText" :placeholder="t('common.search')" style="width: 240px;" clearable @clear="handleSearch" @keyup.enter="handleSearch" />
        <n-button @click="handleSearch">{{ t('common.search') }}</n-button>
      </n-space>

      <!-- Table -->
      <n-spin :show="loading">
        <n-data-table
          :columns="columns"
          :data="members"
          :row-key="(row: any) => row.id"
        />
        <n-empty v-if="!loading && members.length === 0" :description="t('common.noData')" />
      </n-spin>

      <n-space justify="center" v-if="totalCount > pageSize">
        <n-pagination
          v-model:page="currentPage"
          :page-count="Math.ceil(totalCount / pageSize)"
          @update:page="fetchMembers"
        />
      </n-space>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMessage, NSpace, NButton, NInput, NDataTable, NSpin, NEmpty, NPagination, NTag, type DataTableColumns } from 'naive-ui'
import { adminMembersApi } from '@/api/admin'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

const loading = ref(false)
const members = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(15)
const totalCount = ref(0)
const searchText = ref('')

const columns: DataTableColumns<any> = [
  { title: () => t('auth.name'), key: 'name', width: 120 },
  { title: () => t('auth.email'), key: 'email', width: 200, ellipsis: { tooltip: true } },
  { title: () => t('auth.phone'), key: 'phone', width: 130 },
  { title: () => t('member.pointBalance'), key: 'pointBalance', width: 100 },
  {
    title: () => t('common.status'),
    key: 'status',
    width: 80,
    render(row) {
      return h(NTag, {
        size: 'small',
        type: row.status === 1 ? 'success' : 'error'
      }, { default: () => row.status === 1 ? t('admin.active') : t('admin.inactive') })
    }
  },
  {
    title: () => t('order.orderDate'),
    key: 'createdAt',
    width: 120,
    render(row) { return new Date(row.createdAt).toLocaleDateString() }
  },
  {
    title: () => t('common.actions'),
    key: 'actions',
    width: 80,
    render(row) {
      return h(NButton, {
        size: 'small', text: true, type: 'primary',
        onClick: () => router.push({ name: 'AdminMemberDetail', params: { id: row.id } })
      }, { default: () => t('order.orderDetail') })
    }
  }
]

function handleSearch() {
  currentPage.value = 1
  fetchMembers()
}

async function fetchMembers() {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize: pageSize.value }
    if (searchText.value) params.search = searchText.value
    const res = await adminMembersApi.getMembers(params)
    members.value = res.data?.items || res.data || []
    totalCount.value = res.data?.totalCount || members.value.length
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function handleExport() {
  try {
    const res = await adminMembersApi.exportMembers()
    const blob = new Blob([res as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `members_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch {
    message.error(t('common.error'))
  }
}

onMounted(() => {
  fetchMembers()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
}
</style>

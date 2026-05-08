<template>
  <div class="user-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>用户管理</h3>
          <div class="sort-controls">
            <el-dropdown trigger="click" @command="handleSortField">
              <el-button type="primary">
                排序方式 <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="'id'" :class="{ 'active-sort': sortField === 'id' }">按ID</el-dropdown-item>
                  <el-dropdown-item :command="'userAccount'" :class="{ 'active-sort': sortField === 'userAccount' }">按账户</el-dropdown-item>
                  <el-dropdown-item :command="'createTime'" :class="{ 'active-sort': sortField === 'createTime' }">按创建时间</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button @click="toggleSortOrder" :class="{ 'sort-btn': true }">
              <el-icon :style="{ color: sortOrder === 'ascend' ? '#1890ff' : '#000' }"><ArrowUp /></el-icon>
              <el-icon :style="{ color: sortOrder === 'descend' ? '#1890ff' : '#000' }"><ArrowDown /></el-icon>
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form" @submit.prevent="handleSearch">
        <el-form-item label="ID">
          <el-input-number v-model="searchForm.id" :min="1" :precision="0" @change="onIdChange" placeholder="ID搜索" style="width: 140px" />
        </el-form-item>
        <el-form-item label="账户">
          <el-input v-model="searchForm.userAccount" placeholder="用户账户" :disabled="isIdSearching" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="searchForm.phone" placeholder="电话" :disabled="isIdSearching" />
        </el-form-item>
        <el-form-item label="邮件">
          <el-input v-model="searchForm.email" placeholder="邮件" :disabled="isIdSearching" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.userStatus" :disabled="isIdSearching" clearable style="width:140px">
            <el-option label="离线" :value="0" />
            <el-option label="在线" :value="1" />
            <el-option label="隐身" :value="2" />
            <el-option label="忙碌" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.userRole" :disabled="isIdSearching" clearable style="width:160px">
            <el-option label="普通用户" :value="0" />
            <el-option label="管理员" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="danger" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
            批量删除 ({{ selectedIds.length }})
          </el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" border stripe style="width: 100%" v-loading="loading" @selection-change="onSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userAccount" label="用户账户" show-overflow-tooltip />
        <el-table-column prop="phone" label="电话" />
        <el-table-column prop="email" label="邮件" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.userStatus)">
              {{ statusText(row.userStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.userRole === 1 ? 'success' : 'info'">
              {{ row.userRole === 1 ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
            <el-popconfirm title="确定要删除该用户吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button type="danger" link>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="editDialogVisible" title="编辑用户" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="用户账户">
          <el-input v-model="editForm.userAccount" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.userStatus" style="width:100%">
            <el-option label="离线" :value="0" />
            <el-option label="在线" :value="1" />
            <el-option label="隐身" :value="2" />
            <el-option label="忙碌" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.userRole" style="width:100%">
            <el-option label="普通用户" :value="0" />
            <el-option label="管理员" :value="1" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { searchUsers, updateUser, deleteUser } from '@/api'
import type { CurrentUser, UserQueryRequest } from '@/types'
import dayjs from 'dayjs'

const searchForm = reactive<UserQueryRequest>({
  id: undefined,
  userAccount: '',
  phone: '',
  email: '',
  userRole: undefined,
  userStatus: undefined,
})

const tableData = ref<CurrentUser[]>([])
const loading = ref(false)
const sortField = ref<'id' | 'userAccount' | 'createTime'>('id')
const sortOrder = ref<'ascend' | 'descend'>('ascend')
const selectedIds = ref<number[]>([])

const onSelectionChange = (rows: CurrentUser[]) => {
  selectedIds.value = rows.map(r => r.id!).filter(Boolean)
}
const editDialogVisible = ref(false)
const editForm = reactive<Partial<CurrentUser>>({ userStatus: 0, userRole: 0 })

const isIdSearching = computed(() => !!searchForm.id)

const onIdChange = (val: number | undefined) => {
  if (val) {
    searchForm.userAccount = ''
    searchForm.phone = ''
    searchForm.email = ''
  }
}

const statusText = (status: number) => {
  const map: Record<number, string> = { 0: '离线', 1: '在线', 2: '隐身', 3: '忙碌' }
  return map[status] || '-'
}

const statusTagType = (status: number) => {
  const map: Record<number, 'info' | 'success' | 'warning' | 'danger'> = {
    0: 'info',
    1: 'success',
    2: 'warning',
    3: 'danger',
  }
  return map[status] || 'info'
}

const formatTime = (time: string | Date) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const handleSortField = (field: 'id' | 'userAccount' | 'createTime') => {
  sortField.value = field
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ascend' ? 'descend' : 'ascend'
}

const fetchData = async () => {
  loading.value = true
  try {
    const queryRequest: UserQueryRequest = {}

    if (searchForm.id) {
      queryRequest.id = Number(searchForm.id)
    }
    if (searchForm.userAccount) queryRequest.userAccount = searchForm.userAccount
    if (searchForm.phone) queryRequest.phone = searchForm.phone
    if (searchForm.email) queryRequest.email = searchForm.email
    if (searchForm.userRole !== undefined) {
      queryRequest.userRole = Number(searchForm.userRole)
    }
    if (searchForm.userStatus !== undefined) {
      queryRequest.userStatus = Number(searchForm.userStatus)
    }

    const res: any = await searchUsers(queryRequest)
    let list = Array.isArray(res) ? res : []

    // normalize numeric fields so el-select binds match (server may return strings)
    list = list.map((item: any) => ({
      ...item,
      userStatus: item.userStatus !== undefined && item.userStatus !== null ? Number(item.userStatus) : item.userStatus,
      userRole: item.userRole !== undefined && item.userRole !== null ? Number(item.userRole) : item.userRole,
    }))

    const sorted = [...list].sort((a, b) => {
      let fa: any, fb: any
      if (sortField.value === 'createTime') {
        fa = new Date(a.createTime as any).getTime()
        fb = new Date(b.createTime as any).getTime()
      } else {
        fa = (a as any)[sortField.value]
        fb = (b as any)[sortField.value]
      }
      return sortOrder.value === 'ascend' ? (fa > fb ? 1 : -1) : (fa < fb ? 1 : -1)
    })

    tableData.value = sorted

    const hasSearch = Object.values(searchForm).some((v) => v !== undefined && v !== '')
    if (hasSearch) {
      ElMessage.success(`查询到 ${sorted.length} 条数据`)
    }
  } catch {
    // error handled by interceptor
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchData()
}

const handleReset = () => {
  searchForm.id = undefined
  searchForm.userAccount = ''
  searchForm.phone = ''
  searchForm.email = ''
  searchForm.userRole = undefined
  searchForm.userStatus = undefined
  fetchData()
}

const openEditDialog = (row: CurrentUser) => {
  editForm.id = row.id
  editForm.userAccount = row.userAccount
  editForm.phone = row.phone
  editForm.email = row.email
  editForm.userStatus = row.userStatus !== undefined && row.userStatus !== null ? Number(row.userStatus) : row.userStatus
  editForm.userRole = row.userRole !== undefined && row.userRole !== null ? Number(row.userRole) : row.userRole
  editDialogVisible.value = true
}

const handleSave = async () => {
  try {
    await updateUser(editForm as Partial<CurrentUser>)
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    fetchData()
  } catch {
    // error handled by interceptor
  }
}

const handleDelete = async (id: number) => {
  try {
    await deleteUser(id)
    ElMessage.success('删除成功')
    fetchData()
  } catch {
    // error handled by interceptor
  }
}

const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) return
  try {
    await Promise.all(selectedIds.value.map(id => deleteUser(id)))
    ElMessage.success(`成功删除 ${selectedIds.value.length} 个用户`)
    selectedIds.value = []
    fetchData()
  } catch {
    // error handled by interceptor
  }
}

watch([sortField, sortOrder], () => {
  fetchData()
})

fetchData()
</script>

<style scoped lang="less">
.user-manage {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .sort-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .search-form {
    margin-bottom: 16px;
  }

  :deep(.active-sort) {
    background-color: #1890ff !important;
    color: #fff !important;
  }

  .sort-btn {
    display: flex;
    flex-direction: column;
    padding: 4px 8px;
    align-items: center;
  }
}
</style>

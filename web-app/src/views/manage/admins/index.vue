<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="Search" prop="keyword">
              <el-input v-model="queryParams.keyword" placeholder="Search by name, ID, email..." clearable style="width: 300px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="Status" prop="status">
              <el-select v-model="queryParams.status" placeholder="All" clearable style="width: 120px">
                <el-option label="Active" value="active" />
                <el-option label="Suspended" value="suspended" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">Search</el-button>
              <el-button icon="Refresh" @click="resetQuery">Reset</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd()">Add Admin</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain :disabled="single" icon="Edit" @click="handleUpdate()">Edit</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain :disabled="multiple" icon="Delete" @click="handleDelete()">Delete</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table class="attendify-table" ref="adminTableRef" v-loading="loading" :data="pagedAdminList" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="Name" prop="name" :show-overflow-tooltip="true" min-width="160" />
        <el-table-column label="Role" prop="role" :show-overflow-tooltip="true" min-width="140" />
        <el-table-column label="Staff ID" prop="adminId" min-width="130" />
        <el-table-column label="Email" prop="email" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="Mobile" prop="mobile" :show-overflow-tooltip="true" min-width="140" />
        <el-table-column label="Status" prop="status" sortable="custom" min-width="130">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'Active'" type="success">Active</el-tag>
            <el-tag v-else type="danger">Suspended</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="100" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">Edit</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="adminFormRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="Staff ID" prop="adminId">
          <el-input v-model="form.adminId" placeholder="Enter staff ID" />
        </el-form-item>
        <el-form-item label="Name" prop="name">
          <el-input v-model="form.name" placeholder="Enter name" />
        </el-form-item>
        <el-form-item label="Username" prop="username">
          <el-input v-model="form.username" placeholder="Enter username" />
        </el-form-item>
        <el-form-item label="Role" prop="role">
          <el-select v-model="form.role" placeholder="Select role" style="width: 100%" disabled>
            <el-option label="Admin" value="admin" />
            <el-option label="Lecturer" value="lecturer" />
            <el-option label="Student" value="student" />
          </el-select>
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" placeholder="Enter email" />
        </el-form-item>
        <el-form-item label="Mobile" prop="mobile">
          <el-input v-model="form.mobile" placeholder="Enter mobile number" />
        </el-form-item>
        <el-form-item label="Status" prop="status">
          <el-select v-model="form.status" placeholder="Select status" style="width: 100%">
            <el-option label="Active" value="Active" />
            <el-option label="Suspended" value="Suspended" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">Submit</el-button>
          <el-button @click="cancel">Cancel</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Admins" lang="ts">
import { validEmail } from '@/utils/validate';
import { listAdmins, addAdmin, updateAdmin, delAdmin, addAdminUser, updateAdminUser } from '@/api/admin';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

interface AdminRow {
  id: number | string;  // Numeric User ID for API calls
  adminId: string | number;  // Display admin ID (e.g., A003)
  name: string;
  username?: string;
  role?: string;
  email?: string;
  mobile?: string;
  status?: string;
}

const adminList = ref<AdminRow[]>([]);
const allAdminList = ref<AdminRow[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref('');

const queryFormRef = ref<ElFormInstance>();
const adminFormRef = ref<ElFormInstance>();
const adminTableRef = ref<ElTableInstance>();

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  status: ''
});

const isFiltering = computed(() => !!queryParams.value.keyword || !!queryParams.value.status);

// 前端关键字过滤（不区分大小写）
const filteredAdminList = computed(() => {
  let result = isFiltering.value ? allAdminList.value : adminList.value;
  
  // 关键字搜索（不区分大小写）
  if (queryParams.value.keyword) {
    const keyword = queryParams.value.keyword.toLowerCase();
    result = result.filter(admin => {
      return (
        (admin.name && admin.name.toLowerCase().includes(keyword)) ||
        (admin.adminId && String(admin.adminId).toLowerCase().includes(keyword)) ||
        (admin.email && admin.email.toLowerCase().includes(keyword)) ||
        (admin.mobile && admin.mobile.toLowerCase().includes(keyword)) ||
        (admin.role && admin.role.toLowerCase().includes(keyword))
      );
    });
  }
  
  // 状态过滤
  if (queryParams.value.status) {
    const statusFilter = queryParams.value.status.toLowerCase() === 'active' ? 'Active' : 'Suspended';
    result = result.filter(admin => admin.status === statusFilter);
  }
  
  return result;
});

const pagedAdminList = computed(() => {
  if (!isFiltering.value) return filteredAdminList.value;
  const start = (queryParams.value.pageNum - 1) * queryParams.value.pageSize;
  return filteredAdminList.value.slice(start, start + queryParams.value.pageSize);
});

const form = ref<any>({});
const validateEmail = (_rule: any, value: string, callback: (error?: Error) => void) => {
  if (!value || validEmail(value)) {
    callback();
  } else {
    callback(new Error('Please enter a valid email address'));
  }
};
const rules = {
  adminId: [{ required: true, message: 'Staff ID is required', trigger: 'blur' }],
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
  username: [{ required: true, message: 'Username is required', trigger: 'blur' }],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { validator: validateEmail, trigger: ['blur', 'change'] }
  ],
  status: [{ required: true, message: 'Status is required', trigger: 'change' }]
};

const open = ref(false);

const normalizeAdmin = (item: any): AdminRow => {
  const user = item?.user_details ?? {};
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  const statusRaw = (user.status ?? item?.status ?? '').toString().toLowerCase();
  return {
    id: item?.user ?? user?.id ?? item?.id ?? '',  // Numeric User ID for API
    adminId: item?.admin_id ?? '',  // Display admin ID
    name: fullName || user.username || '-',
    username: user.username ?? '',
    role: user.role_type ?? item?.role ?? '',
    email: user.email ?? item?.email ?? '',
    mobile: user.phone_number ?? item?.mobile ?? '',
    status: statusRaw === 'active' ? 'Active' : 'Suspended'
  };
};

const buildAdminQuery = () => {
  const params: Record<string, any> = {
    page: queryParams.value.pageNum,
    page_size: queryParams.value.pageSize
  };
  // 后端获取所有数据，前端进行过滤
  return params;
};

const fetchAllAdmins = async () => {
  const results: AdminRow[] = [];
  let page = 1;
  const pageSize = queryParams.value.pageSize || 10;
  let totalCount: number | null = null;

  while (true) {
    const payload: any = await listAdmins({ page });
    const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
    const count = payload?.data?.count ?? payload?.count;
    if (typeof count === 'number') totalCount = count;
    if (!Array.isArray(rows) || rows.length === 0) break;
    results.push(...rows.map(normalizeAdmin));
    if (totalCount !== null && results.length >= totalCount) break;
    if (rows.length < pageSize) break;
    page += 1;
    if (page > 200) break;
  }

  return results;
};

const getList = async () => {
  loading.value = true;
  try {
    if (isFiltering.value) {
      allAdminList.value = await fetchAllAdmins();
      adminList.value = [];
      total.value = filteredAdminList.value.length;
    } else {
      allAdminList.value = [];
      const params = buildAdminQuery();
      const payload: any = await listAdmins(params);
      const pagination = payload?.data?.pagination ?? payload?.pagination;
      const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
      adminList.value = Array.isArray(rows) ? rows.map(normalizeAdmin) : [];
      total.value = pagination?.total_items ?? payload?.count ?? adminList.value.length ?? 0;
    }
  } catch (error: any) {
    adminList.value = [];
    allAdminList.value = [];
    total.value = 0;
    proxy?.$modal?.msgError?.(error?.message || 'Failed to load admin list');
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

let keywordSearchTimer: number | null = null;
watch(
  () => queryParams.value.keyword,
  () => {
    if (keywordSearchTimer !== null) {
      window.clearTimeout(keywordSearchTimer);
    }
    keywordSearchTimer = window.setTimeout(() => {
      handleQuery();
    }, 300);
  }
);

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.pageNum = 1;
  getList();
};

const handleSelectionChange = (selection: any[]) => {
  ids.value = selection.map((item) => item.id);  // Use numeric User ID
  multiple.value = !selection.length;
  single.value = selection.length != 1;
};

const handleAdd = () => {
  reset();
  open.value = true;
  title.value = 'Add Admin';
};

const handleUpdate = (row?: any) => {
  reset();
  const selected = row || adminList.value.find((admin) => admin.id === ids.value[0]);
  form.value = {
    id: selected?.id || '',  // Numeric User ID for API
    adminId: selected?.adminId || '',
    name: selected?.name || '',
    username: selected?.username || '',
    role: selected?.role || '',
    email: selected?.email || '',
    mobile: selected?.mobile || '',
    status: selected?.status || 'Active'
  };
  open.value = true;
  title.value = 'Edit Admin';
};

const submitForm = () => {
  adminFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      try {
        if (title.value === 'Add Admin') {
          // 步骤1: 创建 User
          const [firstName, ...lastParts] = form.value.name.split(' ');
          const lastName = lastParts.join(' ');
          const userData = {
            username: form.value.username || form.value.email?.split('@')[0] || form.value.name.toLowerCase().replace(/\s/g, '') + Date.now(),
            password: 'attendify123',
            email: form.value.email,
            first_name: firstName,
            last_name: lastName,
            phone_number: form.value.mobile,
            role_type: 'admin',
            status: form.value.status.toLowerCase()
          };
          
          const userResponse: any = await addAdminUser(userData);
          const userId = userResponse?.id;
          
          if (!userId) {
            throw new Error('Failed to create user');
          }
          
          // 步骤2: 创建 Admin
          const adminData = {
            user: userId,
            admin_id: form.value.adminId
          };
          
          await addAdmin(adminData);
          proxy?.$modal.msgSuccess('Admin added successfully');
        } else {
          // 更新 Admin - 使用数字 User ID
          // 步骤1: 更新 User 表的信息（包括 status）
          const [firstName, ...lastParts] = form.value.name.split(' ');
          const lastName = lastParts.join(' ');
          const userUpdateData = {
            first_name: firstName,
            last_name: lastName,
            email: form.value.email,
            phone_number: form.value.mobile,
            status: form.value.status.toLowerCase() === 'active' ? 'active' : 'suspended'
          };
          await updateAdminUser(form.value.id, userUpdateData);
          
          // 步骤2: 更新 Admin 表的信息
          const adminUpdateData = {
            admin_id: form.value.adminId
          };
          await updateAdmin(form.value.id, adminUpdateData);
          proxy?.$modal.msgSuccess('Admin updated successfully');
        }
        open.value = false;
        await getList();
      } catch (error: any) {
        console.error('Submit error:', error);
        proxy?.$modal.msgError(error?.response?.data?.message || error?.message || 'Operation failed');
      }
    }
  });
};

const handleDelete = async (row?: any) => {
  const deleteIds = row?.id ? [row.id] : ids.value;
  const displayIds = row?.adminId || ids.value.join(', ');
  await proxy?.$modal.confirm('Are you sure you want to delete admin ID "' + displayIds + '"?');
  try {
    for (const id of deleteIds) {
      await delAdmin(id);  // Use numeric User ID
    }
    await getList();
    proxy?.$modal.msgSuccess('Delete successful');
  } catch (error: any) {
    proxy?.$modal.msgError(error?.message || 'Delete failed');
  }
};

const cancel = () => {
  open.value = false;
  reset();
};

const reset = () => {
  form.value = {
    id: '',
    adminId: '',
    name: '',
    username: '',
    role: 'admin',  // 默认设置为 admin
    email: '',
    mobile: '',
    status: 'Active'
  };
  adminFormRef.value?.resetFields();
};

onMounted(() => {
  getList();
});
</script>

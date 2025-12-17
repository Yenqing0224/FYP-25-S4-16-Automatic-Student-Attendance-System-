<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="Name" prop="adminName">
              <el-input v-model="queryParams.adminName" placeholder="Enter admin name" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="Staff ID" prop="adminId">
              <el-input v-model="queryParams.adminId" placeholder="Enter staff ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="Role" prop="role">
              <el-input v-model="queryParams.role" placeholder="Enter role" clearable @keyup.enter="handleQuery" />
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

      <el-table class="attendify-table" ref="adminTableRef" v-loading="loading" :data="adminList" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="Name" prop="name" :show-overflow-tooltip="true" min-width="160" />
        <el-table-column label="Role" prop="role" :show-overflow-tooltip="true" min-width="140" />
        <el-table-column label="Staff ID" prop="adminId" min-width="130" />
        <el-table-column label="Email" prop="email" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="Mobile" prop="mobile" :show-overflow-tooltip="true" min-width="140" />
        <el-table-column label="Leave Balance" prop="leaveBalance" min-width="150">
          <template #default="scope">{{ scope.row.leaveBalance || '0' }}%</template>
        </el-table-column>
        <el-table-column label="Status" prop="status" sortable="custom" min-width="130">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'Active'" type="success">Active</el-tag>
            <el-tag v-else type="danger">Inactive</el-tag>
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

    <!-- Add or Edit Admin Dialog -->
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
          <el-input v-model="form.role" placeholder="Enter role" />
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
            <el-option label="Inactive" value="Inactive" />
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
import { listAdmins } from '@/api/admin';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

interface AdminRow {
  adminId: string | number;
  name: string;
  username?: string;
  role?: string;
  email?: string;
  mobile?: string;
  status?: string;
  leaveBalance?: number;
}

const adminList = ref<AdminRow[]>([]);
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

// Query parameters
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  adminName: '',
  adminId: '',
  role: ''
});

// Form parameters
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
  role: [{ required: true, message: 'Role is required', trigger: 'blur' }],
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
    adminId: item?.admin_id ?? user?.id ?? item?.id ?? '',
    name: fullName || user.username || '—',
    username: user.username ?? '',
    role: user.role_type ?? item?.role ?? '',
    email: user.email ?? item?.email ?? '',
    mobile: user.phone_number ?? item?.mobile ?? '',
    status: statusRaw === 'active' ? 'Active' : 'Inactive',
    leaveBalance: item?.leave_balance ?? item?.leaveBalance ?? 0
  };
};

/** Query admin list */
const getList = async () => {
  loading.value = true;
  try {
    const payload: any = await listAdmins(queryParams.value);
    const pagination = payload?.data?.pagination ?? payload?.pagination;
    const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
    adminList.value = Array.isArray(rows) ? rows.map(normalizeAdmin) : [];
    total.value = pagination?.total_items ?? payload?.count ?? adminList.value.length ?? 0;
  } catch (error: any) {
    adminList.value = [];
    total.value = 0;
    proxy?.$modal?.msgError?.(error?.message || 'Failed to load admin list');
  } finally {
    loading.value = false;
  }
};

/** Search button action */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** Reset button action */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.pageNum = 1;
  getList();
};

/** Multiple selection change */
const handleSelectionChange = (selection: any[]) => {
  ids.value = selection.map((item) => item.adminId);
  multiple.value = !selection.length;
  single.value = selection.length != 1;
};

/** Add button action */
const handleAdd = () => {
  reset();
  open.value = true;
  title.value = 'Add Admin';
};

/** Edit button action */
const handleUpdate = (row?: any) => {
  reset();
  const selected = row || adminList.value.find((admin) => admin.adminId === ids.value[0]);
  form.value = {
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

/** Submit button */
const submitForm = () => {
  adminFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      // TODO: Call actual API to save admin information
      proxy?.$modal.msgSuccess('Operation successful');
      open.value = false;
      await getList();
    }
  });
};

/** Delete button action */
const handleDelete = async (row?: any) => {
  const adminIds = row?.adminId || ids.value;
  await proxy?.$modal.confirm('Are you sure you want to delete admin ID "' + adminIds + '"?');
  // TODO: Call actual API to delete admin
  await getList();
  proxy?.$modal.msgSuccess('Delete successful');
};

/** Cancel button */
const cancel = () => {
  open.value = false;
  reset();
};

/** Form reset */
const reset = () => {
  form.value = {
    adminId: '',
    name: '',
    username: '',
    role: '',
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

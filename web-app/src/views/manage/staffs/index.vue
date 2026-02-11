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
            <el-button type="primary" plain icon="Plus" @click="handleAdd()">Add Lecturer</el-button>
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

      <el-table class="attendify-table" ref="staffTableRef" v-loading="loading" :data="pagedStaffList" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="Name" prop="name" :show-overflow-tooltip="true" min-width="160" />
        <el-table-column label="Lecturer ID" prop="staffId" min-width="120" />
        <el-table-column label="Email" prop="email" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="Mobile" prop="mobile" :show-overflow-tooltip="true" min-width="140" />
        <el-table-column label="Status" prop="status" sortable="custom" min-width="130">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'active'" type="success">Active</el-tag>
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

    <!-- Add or Edit Lecturer Dialog -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="staffFormRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="Lecturer ID" prop="staffId">
          <el-input v-model="form.staffId" placeholder="Enter lecturer ID" />
        </el-form-item>
        <el-form-item label="Name" prop="name">
          <el-input v-model="form.name" placeholder="Enter name" />
        </el-form-item>
        <el-form-item label="Email" prop="email">
          <el-input v-model="form.email" placeholder="Enter email" />
        </el-form-item>
        <el-form-item label="Mobile" prop="mobile">
          <el-input v-model="form.mobile" placeholder="Enter mobile number" />
        </el-form-item>
        <el-form-item label="Status" prop="status">
          <el-select v-model="form.status" placeholder="Select status" style="width: 100%">
            <el-option label="Active" value="active" />
            <el-option label="Suspended" value="suspended" />
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

<script setup name="Staffs" lang="ts">
import { validEmail } from '@/utils/validate';
import { listAdminLecturers, addAdminLecturer, updateAdminLecturer, delAdminLecturer, addAdminUser, updateAdminUser } from '@/api/admin';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

interface StaffRow {
  id: number | string;  // Numeric User ID for API calls
  staffId: string | number;  // Display staff ID (e.g., L002)
  name: string;
  email?: string;
  mobile?: string;
  status?: string;
}

const staffList = ref<StaffRow[]>([]);
const allStaffList = ref<StaffRow[]>([]);
const loading = ref(true);
const showSearch = ref(true);

const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref('');

const queryFormRef = ref<ElFormInstance>();
const staffFormRef = ref<ElFormInstance>();
const staffTableRef = ref<ElTableInstance>();

// Query parameters
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  status: ''
});

const isFiltering = computed(() => !!queryParams.value.keyword || !!queryParams.value.status);

// 前端关键字过滤（不区分大小写）
const filteredStaffList = computed(() => {
  let result = isFiltering.value ? allStaffList.value : staffList.value;
  
  // 关键字搜索（不区分大小写）
  if (queryParams.value.keyword) {
    const keyword = queryParams.value.keyword.toLowerCase();
    result = result.filter(staff => {
      return (
        (staff.name && staff.name.toLowerCase().includes(keyword)) ||
        (staff.staffId && String(staff.staffId).toLowerCase().includes(keyword)) ||
        (staff.email && staff.email.toLowerCase().includes(keyword)) ||
        (staff.mobile && staff.mobile.toLowerCase().includes(keyword))
      );
    });
  }
  
  // 状态过滤
  if (queryParams.value.status) {
    result = result.filter(staff => staff.status === queryParams.value.status);
  }
  
  return result;
});

const pagedStaffList = computed(() => {
  if (!isFiltering.value) return filteredStaffList.value;
  const start = (queryParams.value.pageNum - 1) * queryParams.value.pageSize;
  return filteredStaffList.value.slice(start, start + queryParams.value.pageSize);
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
  staffId: [{ required: true, message: 'Lecturer ID is required', trigger: 'blur' }],
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    { validator: validateEmail, trigger: ['blur', 'change'] }
  ],
  status: [{ required: true, message: 'Status is required', trigger: 'change' }]
};

const open = ref(false);

const normalizeStaff = (item: any): StaffRow => {
  // 后端 Admin API 返回的是 user_details 嵌套对象
  const user = item?.user_details ?? {};
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  // 后端存储的是 'active' 或 'suspended'
  const statusRaw = (user.status ?? item?.status ?? 'active').toString().toLowerCase();
  return {
    id: item?.user ?? user?.id ?? item?.id ?? '',  // Numeric User ID for API
    staffId: item?.staff_id ?? item?.lecturer_id ?? '',  // Display staff ID
    name: fullName || user.username || item?.name || '-',
    email: user.email ?? item?.email ?? '',
    mobile: user.phone_number ?? item?.mobile ?? '',
    status: statusRaw // 直接使用后端的小写值
  };
};

const buildStaffQuery = () => {
  const params: Record<string, any> = {
    page: queryParams.value.pageNum,
    page_size: queryParams.value.pageSize
  };
  // 后端获取所有数据，前端进行过滤
  return params;
};

const fetchAllStaff = async () => {
  const results: StaffRow[] = [];
  let page = 1;
  const pageSize = queryParams.value.pageSize || 10;
  let totalCount: number | null = null;

  while (true) {
    const payload: any = await listAdminLecturers({ page });
    const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
    const count = payload?.data?.count ?? payload?.count;
    if (typeof count === 'number') totalCount = count;
    if (!Array.isArray(rows) || rows.length === 0) break;
    results.push(...rows.map(normalizeStaff));
    if (totalCount !== null && results.length >= totalCount) break;
    if (rows.length < pageSize) break;
    page += 1;
    if (page > 200) break;
  }

  return results;
};

/** Query staff list */
const getList = async () => {
  loading.value = true;
  try {
    if (isFiltering.value) {
      allStaffList.value = await fetchAllStaff();
      staffList.value = [];
      total.value = filteredStaffList.value.length;
    } else {
      allStaffList.value = [];
      const params = buildStaffQuery();
      const payload: any = await listAdminLecturers(params);
      const pagination = payload?.data?.pagination ?? payload?.pagination;
      const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
      staffList.value = Array.isArray(rows) ? rows.map(normalizeStaff) : [];
      total.value = pagination?.total_items ?? payload?.count ?? staffList.value.length ?? 0;
    }
  } catch (error: any) {
    staffList.value = [];
    allStaffList.value = [];
    total.value = 0;
    proxy?.$modal?.msgError?.(error?.message || 'Failed to load staff list');
  } finally {
    loading.value = false;
  }
};

/** Search button action */
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

/** Reset button action */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.pageNum = 1;
  getList();
};

/** Multiple selection change */
const handleSelectionChange = (selection: any[]) => {
  ids.value = selection.map((item) => item.id);  // Use numeric User ID
  multiple.value = !selection.length;
  single.value = selection.length != 1;
};

/** Add button action */
const handleAdd = () => {
  reset();
  open.value = true;
  title.value = 'Add Lecturer';
};

/** Edit button action */
const handleUpdate = (row?: any) => {
  reset();
  const selected = row || staffList.value.find((staff) => staff.id === ids.value[0]);
  form.value = {
    id: selected?.id || '',  // Numeric User ID for API
    staffId: selected?.staffId || '',
    name: selected?.name || '',
    email: selected?.email || '',
    mobile: selected?.mobile || '',
    status: selected?.status || 'Active'
  };
  open.value = true;
  title.value = 'Edit Lecturer';
};

/** Submit button */
const submitForm = () => {
  staffFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      try {
        if (title.value === 'Add Lecturer') {
          // 步骤1: 创建 User
          const [firstName, ...lastParts] = form.value.name.split(' ');
          const lastName = lastParts.join(' ');
          const userData = {
            username: form.value.email?.split('@')[0] || form.value.name.toLowerCase().replace(/\s/g, '') + Date.now(),
            password: 'attendify123',
            email: form.value.email,
            first_name: firstName,
            last_name: lastName,
            phone_number: form.value.mobile,
            role_type: 'lecturer',
            status: form.value.status.toLowerCase()
          };
          
          const userResponse: any = await addAdminUser(userData);
          const userId = userResponse?.id;
          
          if (!userId) {
            throw new Error('Failed to create user');
          }
          
          // 步骤2: 创建 Lecturer
          const lecturerData = {
            user: userId,
            staff_id: form.value.staffId
          };
          
          await addAdminLecturer(lecturerData);
          proxy?.$modal.msgSuccess('Lecturer added successfully');
        } else {
          // 更新 Lecturer - 使用数字 User ID
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
          
          // 步骤2: 更新 Lecturer 表的信息
          const lecturerUpdateData = {
            staff_id: form.value.staffId
          };
          await updateAdminLecturer(form.value.id, lecturerUpdateData);
          proxy?.$modal.msgSuccess('Lecturer updated successfully');
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

/** Delete button action */
const handleDelete = async (row?: any) => {
  const deleteIds = row?.id ? [row.id] : ids.value;
  const displayIds = row?.staffId || ids.value.join(', ');
  await proxy?.$modal.confirm('Are you sure you want to delete lecturer ID "' + displayIds + '"?');
  try {
    for (const id of deleteIds) {
      await delAdminLecturer(id);  // Use numeric User ID
    }
    await getList();
    proxy?.$modal.msgSuccess('Delete successful');
  } catch (error: any) {
    proxy?.$modal.msgError(error?.message || 'Delete failed');
  }
};

/** Cancel button */
const cancel = () => {
  open.value = false;
  reset();
};

/** Form reset */
const reset = () => {
  form.value = {
    id: '',
    staffId: '',
    name: '',
    email: '',
    mobile: '',
    status: 'Active'
  };
  staffFormRef.value?.resetFields();
};

onMounted(() => {
  getList();
});
</script>

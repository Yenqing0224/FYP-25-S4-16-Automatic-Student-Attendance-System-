<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="Search" prop="keyword">
              <el-input v-model="queryParams.keyword" placeholder="Search by name, ID, email..." clearable style="width: 300px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="Status" prop="status" label-width="70px">
              <el-select v-model="queryParams.status" placeholder="All" clearable>
                <el-option label="Active" value="active" />
                <el-option label="Suspended" value="suspended" />
              </el-select>
            </el-form-item>
            <el-form-item label="Programme" prop="programme">
              <el-select v-model="queryParams.programme" placeholder="All" clearable filterable style="width: 240px">
                <el-option v-for="item in programmeOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
            <el-form-item label="UP" prop="partnerUni">
              <el-select v-model="queryParams.partnerUni" placeholder="All" clearable filterable style="width: 200px">
                <el-option v-for="item in partnerUniOptions" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="Attendance Rate" prop="attendancePreset" label-width="130px">
              <div class="attendance-filter">
                <el-select v-model="queryParams.attendancePreset" placeholder="Preset" clearable style="width: 130px" @change="handleAttendancePresetChange">
                  <el-option label="< 80%" value="lt80" />
                  <el-option label="80% - 90%" value="80-90" />
                  <el-option label="> 90%" value="gt90" />
                </el-select>
                <el-input
                  v-model="queryParams.attendanceMin"
                  type="number"
                  placeholder="Min"
                  clearable
                  class="attendance-input"
                  @change="handleAttendanceRangeChange"
                  @clear="handleAttendanceRangeChange"
                />
                <span class="attendance-separator">-</span>
                <el-input
                  v-model="queryParams.attendanceMax"
                  type="number"
                  placeholder="Max"
                  clearable
                  class="attendance-input"
                  @change="handleAttendanceRangeChange"
                  @clear="handleAttendanceRangeChange"
                />
              </div>
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd()">Add Student</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain :disabled="single" icon="Edit" @click="handleUpdate()">Edit</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain :disabled="multiple" icon="Delete" @click="handleDelete()">Delete</el-button>
          </el-col>
          <el-col :span="1.8">
            <el-button type="primary" plain :disabled="multiple" @click="markAsActive">Mark as Active</el-button>
          </el-col>
          <el-col :span="2">
            <el-button type="warning" plain :disabled="multiple" @click="markAsSuspended">Mark as Suspended</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table
        class="attendify-table"
        ref="studentTableRef"
        v-loading="loading"
        :data="pagedStudentList"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="Name" prop="name" :show-overflow-tooltip="true" min-width="160" />
        <el-table-column label="Student ID" prop="studentId" min-width="120" />
        <el-table-column label="School Email" prop="email" :show-overflow-tooltip="true" min-width="180" />
        <el-table-column label="UP" min-width="150">
          <template #default="scope">{{ getPartnerUniName(scope.row.partnerUniId) }}</template>
        </el-table-column>
        <el-table-column label="Programme" prop="programme" :show-overflow-tooltip="true" min-width="150" />
        <el-table-column label="Mobile" prop="mobile" :show-overflow-tooltip="true" min-width="130" />
        <el-table-column label="Attendance Rate" prop="attendanceRate" sortable="custom" min-width="130">
          <template #default="scope">{{ scope.row.attendanceRate || '0' }}%</template>
        </el-table-column>
        <el-table-column label="Threshold" prop="threshold" sortable="custom" min-width="120">
          <template #default="scope">{{ scope.row.threshold || '0' }}%</template>
        </el-table-column>
        <el-table-column label="Status" prop="status" sortable="custom" min-width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'active'" type="success">Active</el-tag>
            <el-tag v-else type="danger">Suspended</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" align="center" width="150" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" @click="handleView(scope.row)">View</el-button>
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">Edit</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="60%" custom-class="student-detail-drawer">
      <div class="drawer-section">
        <h3 class="section-title">Student Information</h3>
        <div class="profile-row">
          <div class="profile-avatar">LOGO</div>
          <div>
            <p class="profile-text">Profile photo</p>
            <p class="profile-subtext">This will be displayed on the student's profile.</p>
          </div>
        </div>
      </div>

      <el-form :model="selectedStudent" label-position="top" class="student-form">
        <div class="drawer-section">
          <h3 class="section-title">Personal Information</h3>
          <el-row :gutter="20">
            <el-col :md="12" :xs="24">
              <el-form-item label="First Name">
                <el-input v-model="selectedStudent.firstName" />
              </el-form-item>
            </el-col>
            <el-col :md="12" :xs="24">
              <el-form-item label="Last Name">
                <el-input v-model="selectedStudent.lastName" />
              </el-form-item>
            </el-col>
            <el-col :md="12" :xs="24">
              <el-form-item label="Student ID">
                <el-input v-model="selectedStudent.studentId" />
              </el-form-item>
            </el-col>
            <el-col :md="12" :xs="24">
              <el-form-item label="School Email">
                <el-input v-model="selectedStudent.schoolEmail" />
              </el-form-item>
            </el-col>
            <el-col :md="12" :xs="24">
              <el-form-item label="Current Status">
                <el-select v-model="selectedStudent.currentStatus">
                  <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :md="12" :xs="24">
              <el-form-item label="Programme">
                <el-select v-model="selectedStudent.programme" placeholder="Select Programme" filterable clearable style="width: 100%">
                  <el-option v-for="item in programmeOptions" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <div class="attendance-value">
            <span>Attendance Rate</span>
            <strong>{{ selectedStudent.attendanceRate }}</strong>
          </div>
        </div>

        <div class="drawer-section">
          <h3 class="section-title">Contact Information</h3>
          <el-row :gutter="20">
            <el-col :md="12" :xs="24">
              <el-form-item label="Mobile Number">
                <el-input v-model="selectedStudent.mobileNumber" />
              </el-form-item>
            </el-col>
            <el-col :md="12" :xs="24">
              <el-form-item label="Personal Email">
                <el-input v-model="selectedStudent.personalEmail" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="drawer-section">
          <h3 class="section-title">Mailing Address</h3>
          <el-row :gutter="20">
            <el-col :md="12" :xs="24">
              <el-form-item label="Mobile Country">
                <el-input v-model="selectedStudent.mobileCountry" />
              </el-form-item>
            </el-col>
            <el-col :md="12" :xs="24">
              <el-form-item label="Street Address">
                <el-input v-model="selectedStudent.streetAddress" />
              </el-form-item>
            </el-col>
            <el-col :md="12" :xs="24">
              <el-form-item label="Unit Number">
                <el-input v-model="selectedStudent.unitNumber" />
              </el-form-item>
            </el-col>
            <el-col :md="12" :xs="24">
              <el-form-item label="Postal Code">
                <el-input v-model="selectedStudent.postalCode" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        <div class="drawer-actions">
          <el-button type="primary" @click="handleDrawerSubmit">Submit</el-button>
        </div>
      </el-form>
    </el-drawer>

    <el-dialog v-model="viewDialogVisible" width="420px" title="attendance overview" append-to-body>
      <div class="student-overview">
        <el-avatar :size="80" :src="viewStudent.photo || defaultAvatar" class="overview-avatar">
          {{ viewStudent.initials }}
        </el-avatar>
        <div class="overview-core">
          <h3>{{ viewStudent.name || '-' }}</h3>
          <p>ID: {{ viewStudent.studentId || '-' }}</p>
        </div>
      </div>
      <div class="semester-table">
        <h4>Semester Records</h4>
        <el-table v-loading="semesterLoading" :data="semesterRecords" border size="small" height="220">
          <el-table-column label="Semester" prop="semester" min-width="140" />
          <el-table-column label="Start Day" prop="startDay">
            <template #default="scope">{{ scope.row.startDay || '-' }}</template>
          </el-table-column>
          <el-table-column label="End Day" prop="endDay">
            <template #default="scope">{{ scope.row.endDay || '-' }}</template>
          </el-table-column>
          <el-table-column label="Attendance" prop="attendance">
            <template #default="scope">{{ scope.row.attendance || '-' }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!semesterLoading && !semesterRecords.length" description="No semester data" />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewDialogVisible = false">Close</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Students" lang="ts">
import type { ComponentInternalInstance } from 'vue';
import type { FormInstance, TableInstance } from 'element-plus';
import { listAdminStudents, addAdminStudent, updateAdminStudent, delAdminStudent, listAdminUsers, getAdminUser, addAdminUser, updateAdminUser, getStudentSemesterAttendance, getSecureDocumentUrl, listPartnerUniversities } from '@/api/admin';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

interface StudentRow {
  id: number; // user ID (数字，用于API操作)
  studentId: string | number; // student_id (字符串，显示用)
  name: string;
  email?: string;
  personalEmail?: string;
  programme?: string;
  mobile?: string;
  addressStreet?: string;
  addressUnit?: string;
  addressPostal?: string;
  addressCountry?: string;
  attendanceRate?: number;
  threshold?: number;
  status?: string;
  photo?: string;
  partnerUniId?: number | null;
}

const studentList = ref<StudentRow[]>([]);
const allStudentList = ref<StudentRow[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref('');
const drawerTitle = ref('');
const drawerVisible = ref(false);
const viewDialogVisible = ref(false);
const semesterLoading = ref(false);

interface SemesterRecord {
  semester: string;
  startDay?: string;
  endDay?: string;
  attendance: string;
}

const defaultAvatar = 'https://placehold.co/120x120?text=ID';
const viewStudent = reactive({
  name: '',
  studentId: '',
  startDay: '',
  endDay: '',
  attendanceRate: undefined as number | undefined,
  photo: '',
  initials: '',
  userId: 0 as number | string
});

const semesterRecords = ref<SemesterRecord[]>([]);
const statusOptions = ref([
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' }
]);

// Programme options - 可根据学校实际课程列表调整
const programmeOptions = ref([
  'Diploma in Information Technology',
  'Diploma in Business Administration',
  'Diploma in Accountancy',
  'Diploma in Engineering',
  'Diploma in Hospitality & Tourism',
  'Diploma in Media & Communications',
  'Diploma in Design',
  'Diploma in Health Sciences',
  'Bachelor of Computer Science',
  'Bachelor of Business',
  'Other'
]);

const partnerUniOptions = ref<Array<{ id: number; name: string }>>([]);

const getPartnerUniName = (id?: number | string | null) => {
  if (id === null || id === undefined || id === '') {
    return '-';
  }
  const targetId = Number(id);
  const match = partnerUniOptions.value.find((item) => item.id === targetId);
  return match?.name || '-';
};

const selectedStudent = reactive({
  id: 0, // user ID (数字，用于更新)
  firstName: '',
  lastName: '',
  studentId: '',
  schoolEmail: '',
  personalEmail: '',
  currentStatus: 'active', // 后端使用小写
  programme: '',
  attendanceRate: '0%',
  mobileNumber: '',
  mobileCountry: '',
  streetAddress: '',
  unitNumber: '',
  postalCode: '',
  status: 'active' // 后端使用小写
});

const queryFormRef = ref<FormInstance>();
const studentTableRef = ref<TableInstance>();

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  status: '',
  programme: '',
  partnerUni: '',
  attendancePreset: '',
  attendanceMin: '',
  attendanceMax: ''
});

const isFiltering = computed(() => {
  return (
    !!queryParams.value.keyword ||
    !!queryParams.value.status ||
    !!queryParams.value.programme ||
    !!queryParams.value.partnerUni ||
    !!queryParams.value.attendancePreset ||
    queryParams.value.attendanceMin !== '' ||
    queryParams.value.attendanceMax !== ''
  );
});

// 前端关键字过滤（不区分大小写）
const filteredStudentList = computed(() => {
  let result = isFiltering.value ? allStudentList.value : studentList.value;
  
  // 关键字搜索（不区分大小写）
  if (queryParams.value.keyword) {
    const keyword = queryParams.value.keyword.toLowerCase();
    result = result.filter(student => {
      return (
        (student.name && student.name.toLowerCase().includes(keyword)) ||
        (student.studentId && String(student.studentId).toLowerCase().includes(keyword)) ||
        (student.email && student.email.toLowerCase().includes(keyword)) ||
        (student.mobile && student.mobile.toLowerCase().includes(keyword)) ||
        (student.programme && student.programme.toLowerCase().includes(keyword))
      );
    });
  }
  
  // 状态过滤
  if (queryParams.value.status) {
    result = result.filter(student => student.status === queryParams.value.status);
  }

  // Programme 过滤（格式需与 programmeOptions 一致）
  if (queryParams.value.programme) {
    result = result.filter(student => (student.programme || '') === queryParams.value.programme);
  }

  if (queryParams.value.partnerUni) {
    const targetId = Number(queryParams.value.partnerUni);
    result = result.filter(student => Number(student.partnerUniId ?? -1) === targetId);
  }

  const preset = queryParams.value.attendancePreset;
  const parseBound = (value: string | number) => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    const numeric = Number(value);
    return Number.isNaN(numeric) ? null : numeric;
  };
  const minValue = parseBound(queryParams.value.attendanceMin);
  const maxValue = parseBound(queryParams.value.attendanceMax);

  if (preset) {
    if (preset === 'lt80') {
      result = result.filter(student => Number(student.attendanceRate ?? 0) < 80);
    } else if (preset === '80-90') {
      result = result.filter(student => {
        const rate = Number(student.attendanceRate ?? 0);
        return rate >= 80 && rate <= 90;
      });
    } else if (preset === 'gt90') {
      result = result.filter(student => Number(student.attendanceRate ?? 0) > 90);
    }
  } else {
    if (minValue !== null) {
      result = result.filter(student => Number(student.attendanceRate ?? 0) >= minValue);
    }
    if (maxValue !== null) {
      result = result.filter(student => Number(student.attendanceRate ?? 0) <= maxValue);
    }
  }
  
  return result;
});

const pagedStudentList = computed(() => {
  if (!isFiltering.value) return filteredStudentList.value;
  const start = (queryParams.value.pageNum - 1) * queryParams.value.pageSize;
  return filteredStudentList.value.slice(start, start + queryParams.value.pageSize);
});

const normalizeStudent = (item: any): StudentRow => {
  // 后端 Admin API 返回的是 user_details 嵌套对象
  const user = item?.user_details ?? {};
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  // 后端存储的是 'active' 或 'suspended'
  const statusRaw = (user.status ?? item?.status ?? 'active').toString().toLowerCase();
  return {
    id: item?.user ?? user?.id ?? item?.id ?? 0, // user ID (数字，用于删除/更新)
    studentId: item?.student_id ?? item?.studentId ?? '', // student_id (字符串，显示用)
    name: fullName || user.username || item?.name || '-',
    email: user.email ?? item?.email ?? '',
    personalEmail: user.personal_email ?? item?.personal_email ?? '',
    programme: item?.programme ?? '',
    mobile: user.phone_number ?? item?.mobile ?? '',
    addressStreet: user.address_street ?? '',
    addressUnit: user.address_unit ?? '',
    addressPostal: user.address_postal ?? '',
    addressCountry: user.address_country ?? '',
    attendanceRate: item?.attendance_rate ?? item?.attendanceRate ?? 0,
    threshold: item?.attendance_threshold ?? item?.threshold ?? 80,
    status: statusRaw, // 直接使用后端的小写值
    photo: user.image_path ?? user.image_url ?? item?.image_path ?? item?.photo ?? '',
    partnerUniId: item?.partner_uni ?? null
  };
};

const isFullUrl = (value?: string) => Boolean(value && /^https?:\/\//i.test(value));

const resolveUserPhoto = async (userId?: number | string, rawPath?: string) => {
  if (!rawPath) {
    return '';
  }
  if (isFullUrl(rawPath)) {
    return rawPath;
  }
  if (!userId) {
    return rawPath;
  }
  try {
    const payload: any = await getSecureDocumentUrl({ id: userId, type: 'user' });
    return payload?.data?.url ?? payload?.url ?? '';
  } catch (error: any) {
    proxy?.$modal?.msgError?.(error?.message || 'Failed to load student photo');
    return rawPath;
  }
};

const resolveUserPhotoFromApi = async (userId?: number | string, fallbackPath?: string) => {
  if (!userId) {
    return resolveUserPhoto(undefined, fallbackPath);
  }
  let rawPath = fallbackPath;
  if (!rawPath) {
    try {
      const payload: any = await getAdminUser(userId);
      rawPath = payload?.image_path ?? payload?.image_url ?? '';
    } catch (error: any) {
      proxy?.$modal?.msgError?.(error?.message || 'Failed to load user profile');
      rawPath = '';
    }
  }
  return resolveUserPhoto(userId, rawPath);
};

const buildStudentQuery = () => {
  const params: Record<string, any> = {
    page: queryParams.value.pageNum,
    page_size: queryParams.value.pageSize
  };
  // 后端获取所有数据，前端进行过滤
  return params;
};

const fetchAllStudents = async () => {
  const results: StudentRow[] = [];
  let page = 1;
  const pageSize = queryParams.value.pageSize || 10;
  let totalCount: number | null = null;

  while (true) {
    const payload: any = await listAdminStudents({ page });
    const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
    const count = payload?.data?.count ?? payload?.count;
    if (typeof count === 'number') totalCount = count;
    if (!Array.isArray(rows) || rows.length === 0) break;
    results.push(...rows.map(normalizeStudent));
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
      allStudentList.value = await fetchAllStudents();
      studentList.value = [];
      total.value = filteredStudentList.value.length;
    } else {
      allStudentList.value = [];
      const params = buildStudentQuery();
      const payload: any = await listAdminStudents(params);
      const pagination = payload?.data?.pagination ?? payload?.pagination;
      const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
      studentList.value = Array.isArray(rows) ? rows.map(normalizeStudent) : [];
      total.value = pagination?.total_items ?? payload?.count ?? studentList.value.length ?? 0;
    }
  } catch (error: any) {
    studentList.value = [];
    allStudentList.value = [];
    total.value = 0;
    proxy?.$modal?.msgError?.(error?.message || 'Failed to load student list');
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

watch(
  () => queryParams.value.partnerUni,
  () => {
    handleQuery();
  }
);

const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value.programme = '';
  queryParams.value.partnerUni = '';
  queryParams.value.attendancePreset = '';
  queryParams.value.attendanceMin = '';
  queryParams.value.attendanceMax = '';
  queryParams.value.pageNum = 1;
  getList();
};

const handleAttendancePresetChange = (value?: string) => {
  if (value === 'lt80') {
    queryParams.value.attendanceMin = '';
    queryParams.value.attendanceMax = '80';
  } else if (value === '80-90') {
    queryParams.value.attendanceMin = '80';
    queryParams.value.attendanceMax = '90';
  } else if (value === 'gt90') {
    queryParams.value.attendanceMin = '90';
    queryParams.value.attendanceMax = '';
  } else {
    queryParams.value.attendanceMin = '';
    queryParams.value.attendanceMax = '';
  }
};

const handleAttendanceRangeChange = () => {
  if (queryParams.value.attendancePreset) {
    queryParams.value.attendancePreset = '';
  }
};

const handleSelectionChange = (selection: any[]) => {
  ids.value = selection.map((item) => item.id); // 使用 user ID (数字)
  multiple.value = !selection.length;
  single.value = selection.length != 1;
};

const handleAdd = () => {
  populateDrawer();
  drawerTitle.value = 'Add Student';
  drawerVisible.value = true;
};

const handleUpdate = (row?: any) => {
  const targetRow = row || studentList.value.find((item) => item.id === ids.value[0]);
  // 允许编辑任何状态的学生（包括Inactive）
  populateDrawer(targetRow);
  drawerTitle.value = 'Edit Student Information';
  drawerVisible.value = true;
};

const handleView = async (row: any) => {
  viewStudent.name = row?.name || '';
  viewStudent.studentId = row?.studentId || '';
  viewStudent.startDay = row?.startDay || '';
  viewStudent.endDay = row?.endDay || '';
  viewStudent.attendanceRate = row?.attendanceRate;
  viewStudent.photo = row?.photo || '';
  viewStudent.userId = row?.id || 0;
  viewStudent.initials = (row?.name || '')
    .split(' ')
    .map((part: string) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
  loadSemesterRecords(row?.studentId);
  viewDialogVisible.value = true;
  const resolvedPhoto = await resolveUserPhotoFromApi(viewStudent.userId, viewStudent.photo);
  if (resolvedPhoto) {
    viewStudent.photo = resolvedPhoto;
  }
};

const loadSemesterRecords = async (studentId?: string | number) => {
  if (!studentId) {
    semesterRecords.value = [];
    return;
  }
  semesterLoading.value = true;
  try {
    const payload: any = await getStudentSemesterAttendance(studentId);
    const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
    const formatAttendance = (value: any) => {
      if (value === null || value === undefined || value === '') {
        return '-';
      }
      if (typeof value === 'number') {
        return `${value}%`;
      }
      const text = String(value);
      return text.includes('%') ? text : `${text}%`;
    };
    semesterRecords.value = Array.isArray(rows)
      ? rows.map((item: any) => ({
          semester: item?.name || item?.semester || '-',
          startDay: item?.start_date || item?.startDay || '',
          endDay: item?.end_date || item?.endDay || '',
          attendance: formatAttendance(item?.attendance_rate ?? item?.attendance)
        }))
      : [];
  } catch (error: any) {
    semesterRecords.value = [];
    proxy?.$modal?.msgError?.(error?.message || 'Failed to load semester attendance');
  } finally {
    semesterLoading.value = false;
  }
};

const populateDrawer = (student?: any) => {
  const [first = '', ...rest] = (student?.name || '').split(' ');
  const last = rest.join(' ');
  Object.assign(selectedStudent, {
    id: student?.id || 0, // user ID (数字)
    firstName: student?.firstName || first,
    lastName: student?.lastName || last,
    studentId: student?.studentId || '',
    schoolEmail: student?.email || '',
    personalEmail: student?.personalEmail || '',
    currentStatus: (student?.status || 'active').toString().toLowerCase(),
    programme: student?.programme || '',
    attendanceRate: student?.attendanceRate ? `${student.attendanceRate}%` : '0%',
    mobileNumber: student?.mobile || '',
    mobileCountry: student?.addressCountry || '',
    streetAddress: student?.addressStreet || '',
    unitNumber: student?.addressUnit || '',
    postalCode: student?.addressPostal || ''
  });
};

const handleDelete = async (row?: any) => {
  const deleteIds = row?.id ? [row.id] : ids.value;
  const displayIds = row?.studentId || ids.value.join(', ');
  await proxy?.$modal.confirm('Are you sure you want to delete student ID "' + displayIds + '"?');
  try {
    // 使用 user ID (数字) 进行删除
    for (const id of deleteIds) {
      await delAdminStudent(id);
    }
    await getList();
    proxy?.$modal.msgSuccess('Delete successful');
  } catch (error: any) {
    proxy?.$modal.msgError(error?.message || 'Delete failed');
  }
};

const markAsActive = async () => {
  if (!ids.value.length) {
    proxy?.$modal?.msgWarning?.('Please select at least one student');
    return;
  }
  await proxy?.$modal.confirm('Are you sure you want to mark selected students as Active?');
  try {
    // status 字段在 User 表上，需要使用 updateAdminUser
    for (const id of ids.value) {
      await updateAdminUser(id, { status: 'active' });
    }
    proxy?.$modal.msgSuccess('Students marked as Active');
    await getList();
  } catch (error: any) {
    proxy?.$modal.msgError(error?.message || 'Operation failed');
  }
};

const markAsSuspended = async () => {
  if (!ids.value.length) {
    proxy?.$modal?.msgWarning?.('Please select at least one student');
    return;
  }
  await proxy?.$modal.confirm('Are you sure you want to mark selected students as Suspended?');
  try {
    // status 字段在 User 表上，需要使用 updateAdminUser
    for (const id of ids.value) {
      await updateAdminUser(id, { status: 'suspended' });
    }
    proxy?.$modal.msgSuccess('Students marked as Suspended');
    await getList();
  } catch (error: any) {
    proxy?.$modal.msgError(error?.message || 'Operation failed');
  }
};

const handleDrawerSubmit = async () => {
  try {
    if (drawerTitle.value === 'Add Student') {
      // 步骤1: 先创建 User
      const userData = {
        username: selectedStudent.schoolEmail?.split('@')[0] || selectedStudent.firstName.toLowerCase() + Date.now(),
        password: 'attendify', // 默认密码
        email: selectedStudent.schoolEmail,
        first_name: selectedStudent.firstName,
        last_name: selectedStudent.lastName,
        phone_number: selectedStudent.mobileNumber,
        personal_email: selectedStudent.personalEmail,
        address_street: selectedStudent.streetAddress,
        address_unit: selectedStudent.unitNumber,
        address_postal: selectedStudent.postalCode,
        address_country: selectedStudent.mobileCountry || 'Singapore',
        role_type: 'student',
        status: selectedStudent.currentStatus.toLowerCase()
      };
      
      console.log('Creating user with data:', userData);
      const userResponse: any = await addAdminUser(userData);
      console.log('User response:', userResponse);
      
      // 后端返回格式: { status, code, message, data: { id, ... } }
      // request.ts 已经提取了 data，所以 userResponse 就是 { id, username, ... }
      const userId = userResponse?.id;
      
      if (!userId) {
        console.error('User response:', userResponse);
        throw new Error('Failed to get user ID from response');
      }
      
      // 步骤2: 创建 Student 关联到 User
      const studentData = {
        user: userId,
        student_id: selectedStudent.studentId,
        programme: selectedStudent.programme || 'General',
        attendance_rate: parseFloat(selectedStudent.attendanceRate) || 100,
        attendance_threshold: 80
      };
      
      console.log('Creating student with data:', studentData);
      await addAdminStudent(studentData);
      proxy?.$modal.msgSuccess('Student added successfully');
    } else {
      // 更新学生 - 使用 user ID (数字) 进行更新
      // 步骤1: 更新 User 表的信息（包括 status）
      const userUpdateData = {
        first_name: selectedStudent.firstName,
        last_name: selectedStudent.lastName,
        email: selectedStudent.schoolEmail,
        phone_number: selectedStudent.mobileNumber,
        personal_email: selectedStudent.personalEmail,
        address_street: selectedStudent.streetAddress,
        address_unit: selectedStudent.unitNumber,
        address_postal: selectedStudent.postalCode,
        address_country: selectedStudent.mobileCountry || 'Singapore',
        status: selectedStudent.currentStatus.toLowerCase() === 'active' ? 'active' : 'suspended'
      };
      await updateAdminUser(selectedStudent.id, userUpdateData);
      
      // 步骤2: 更新 Student 表的信息
      const studentUpdateData = {
        student_id: selectedStudent.studentId,
        programme: selectedStudent.programme || 'General',
        attendance_rate: parseFloat(selectedStudent.attendanceRate) || 100,
        attendance_threshold: 80
      };
      await updateAdminStudent(selectedStudent.id, studentUpdateData);
      proxy?.$modal.msgSuccess('Student updated successfully');
    }
    
    drawerVisible.value = false;
    await getList();
  } catch (error: any) {
    console.error('Submit error:', error);
    // 尝试获取更详细的错误信息
    let errorMsg = 'Operation failed';
    if (error?.response?.data) {
      const data = error.response.data;
      if (data.message) {
        errorMsg = data.message;
      } else if (data.email) {
        errorMsg = 'Email already exists: ' + (Array.isArray(data.email) ? data.email[0] : data.email);
      } else if (data.username) {
        errorMsg = 'Username already exists: ' + (Array.isArray(data.username) ? data.username[0] : data.username);
      } else if (data.student_id) {
        errorMsg = 'Student ID already exists: ' + (Array.isArray(data.student_id) ? data.student_id[0] : data.student_id);
      } else if (typeof data === 'string') {
        errorMsg = data;
      }
    } else if (error?.message) {
      errorMsg = error.message;
    }
    proxy?.$modal.msgError(errorMsg);
  }
};

onMounted(() => {
  getList();
  loadPartnerUniOptions();
});

const loadPartnerUniOptions = async () => {
  try {
    const payload: any = await listPartnerUniversities({ page_size: 200 });
    const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
    partnerUniOptions.value = Array.isArray(rows)
      ? rows.map((item: any) => ({ id: item.id, name: item.name }))
      : [];
  } catch (error: any) {
    partnerUniOptions.value = [];
  }
};
</script>

<style scoped lang="scss">
.student-overview {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}
.overview-avatar {
  background-color: #e5e7eb;
  color: #111827;
}
.overview-core {
  h3 {
    margin: 0;
    font-size: 18px;
  }
  p {
    margin: 4px 0 0;
    color: #6b7280;
  }
}
.semester-table {
  margin-top: 16px;
  h4 {
    margin: 12px 0;
    font-size: 15px;
    color: #374151;
  }
}
.student-detail-drawer {
  :deep(.el-drawer__body) {
    padding: 10px 32px 32px;
    background-color: #fafafa;
  }
}
.drawer-section {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}
.section-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}
.profile-row {
  display: flex;
  gap: 16px;
  align-items: center;
}
.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}
.profile-text {
  margin: 0;
  font-weight: 500;
}
.profile-subtext {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}
.student-form :deep(.el-form-item__label) {
  color: #4b5563;
  font-weight: 500;
}
.add-module-btn {
  width: 100%;
}
.attendance-value {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #6b7280;
  margin-top: 8px;
  strong {
    font-size: 16px;
    color: #1f2937;
  }
}
.drawer-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
.attendance-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}
.attendance-input {
  width: 90px;
}
.attendance-separator {
  color: #9ca3af;
}
</style>

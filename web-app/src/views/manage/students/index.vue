<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="Name" prop="studentName">
              <el-input v-model="queryParams.studentName" placeholder="Enter student name" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="Student ID" prop="studentId" label-width="100px">
              <el-input v-model="queryParams.studentId" placeholder="Enter student ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="School Email" prop="email" label-width="100px">
              <el-input v-model="queryParams.email" placeholder="Enter school email" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain :disabled="multiple" @click="markAsInactive">Mark as Inactive</el-button>
          </el-col>
          <el-col :span="2">
            <el-button type="primary" plain :disabled="multiple" @click="markAsArchived">Mark as Archived</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table
        class="attendify-table"
        ref="studentTableRef"
        v-loading="loading"
        :data="studentList"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="Name" prop="name" :show-overflow-tooltip="true" min-width="160" />
        <el-table-column label="Student ID" prop="studentId" min-width="120" />
        <el-table-column label="School Email" prop="email" :show-overflow-tooltip="true" min-width="180" />
        <el-table-column label="Mobile" prop="mobile" :show-overflow-tooltip="true" min-width="130" />
        <el-table-column label="Semester start day" prop="startDay" :show-overflow-tooltip="true" min-width="150" />
        <el-table-column label="Semester end day" prop="endDay" :show-overflow-tooltip="true" min-width="150" />
        <el-table-column label="Attendance Rate" prop="attendanceRate" sortable="custom" min-width="130">
          <template #default="scope">{{ scope.row.attendanceRate || '0' }}%</template>
        </el-table-column>
        <el-table-column label="Threshold" prop="threshold" sortable="custom" min-width="120">
          <template #default="scope">{{ scope.row.threshold || '0' }}%</template>
        </el-table-column>
        <el-table-column label="Status" prop="status" sortable="custom" min-width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'Active'" type="success">Active</el-tag>
            <el-tag v-else type="danger">Inactive</el-tag>
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
                  <el-option v-for="item in statusOptions" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :md="12" :xs="24">
              <el-form-item label="Enrolled Module 1">
                <el-select v-model="selectedStudent.enrolledModule1">
                  <el-option v-for="item in moduleOptions" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :md="12" :xs="24">
              <el-form-item label="Enrolled Module 2">
                <el-select v-model="selectedStudent.enrolledModule2">
                  <el-option v-for="item in moduleOptions" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :md="12" :xs="24">
              <el-form-item label=" ">
                <el-button class="add-module-btn" disabled>Add Module</el-button>
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
        <el-table :data="semesterRecords" border size="small" height="220">
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
        <el-empty v-if="!semesterRecords.length" description="No semester data" />
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
import { listAdminStudents } from '@/api/admin';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

interface StudentRow {
  studentId: string | number;
  name: string;
  email?: string;
  mobile?: string;
  startDay?: string;
  endDay?: string;
  attendanceRate?: number;
  threshold?: number;
  status?: string;
  photo?: string;
}

const studentList = ref<StudentRow[]>([]);
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
interface SemesterRecord {
  semester: string;
  startDay: string | undefined;
  endDay: string | undefined;
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
  initials: ''
});
const semesterRecords = ref<SemesterRecord[]>([]);
const moduleOptions = ref(['Intro to Python Programming', 'CSTM3 - Game Production', 'Dance Club Entry Audition']);
const statusOptions = ref(['Active', 'Inactive']);
const selectedStudent = reactive({
  firstName: '',
  lastName: '',
  studentId: '',
  schoolEmail: '',
  personalEmail: '',
  currentStatus: 'Active',
  enrolledModule1: '',
  enrolledModule2: '',
  attendanceRate: '97.65%',
  mobileNumber: '',
  mobileCountry: '',
  streetAddress: '',
  unitNumber: '',
  postalCode: '',
  status: 'Active'
});

const queryFormRef = ref<ElFormInstance>();
const studentTableRef = ref<ElTableInstance>();

// Query parameters
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  studentName: '',
  studentId: '',
  email: ''
});

const normalizeStudent = (item: any): StudentRow => {
  const user = item?.user_details ?? {};
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  const statusRaw = (user.status ?? item?.status ?? '').toString().toLowerCase();
  return {
    studentId: item?.student_id ?? item?.studentId ?? user?.id ?? item?.id ?? '',
    name: fullName || user.username || item?.name || '—',
    email: user.email ?? item?.email ?? '',
    mobile: user.phone_number ?? item?.mobile ?? '',
    startDay: item?.start_day ?? item?.startDay ?? item?.semester?.start_date,
    endDay: item?.end_day ?? item?.endDay ?? item?.semester?.end_date,
    attendanceRate: item?.attendance_rate ?? item?.attendanceRate ?? 0,
    threshold: item?.threshold ?? 0,
    status: statusRaw === 'active' ? 'Active' : 'Inactive',
    photo: user.image_url ?? item?.photo ?? ''
  };
};

const buildStudentQuery = () => {
  const params: Record<string, any> = {
    page: queryParams.value.pageNum,
    page_size: queryParams.value.pageSize
  };
  if (queryParams.value.studentName) params.name = queryParams.value.studentName;
  if (queryParams.value.studentId) params.student_id = queryParams.value.studentId;
  if (queryParams.value.email) params.email = queryParams.value.email;
  // 兼容旧字段，避免后端字段差异
  params.studentName = queryParams.value.studentName;
  params.studentId = queryParams.value.studentId;
  return params;
};

/** Query student list */
const getList = async () => {
  loading.value = true;
  try {
    const params = buildStudentQuery();
    const payload: any = await listAdminStudents(params);
    const pagination = payload?.data?.pagination ?? payload?.pagination;
    const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
    studentList.value = Array.isArray(rows) ? rows.map(normalizeStudent) : [];
    total.value = pagination?.total_items ?? payload?.count ?? studentList.value.length ?? 0;
  } catch (error: any) {
    studentList.value = [];
    total.value = 0;
    proxy?.$modal?.msgError?.(error?.message || 'Failed to load student list');
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
  ids.value = selection.map((item) => item.studentId);
  multiple.value = !selection.length;
  single.value = selection.length != 1;
};

/** Add button action */
const handleAdd = () => {
  populateDrawer();
  drawerTitle.value = 'Add Student';
  drawerVisible.value = true;
};

/** Edit button action */
const handleUpdate = (row?: any) => {
  const targetRow = row || studentList.value.find((item) => item.studentId === (ids.value[0] as string));
  if (targetRow?.status === 'Inactive') {
    proxy?.$modal.msgError('Inactive students cannot be edited.');
    return;
  }
  populateDrawer(targetRow);
  drawerTitle.value = 'Edit Student Information';
  drawerVisible.value = true;
};

const handleView = (row: any) => {
  viewStudent.name = row?.name || '';
  viewStudent.studentId = row?.studentId || '';
  viewStudent.startDay = row?.startDay || '';
  viewStudent.endDay = row?.endDay || '';
  viewStudent.attendanceRate = row?.attendanceRate;
  viewStudent.photo = row?.photo || '';
  viewStudent.initials = (row?.name || '')
    .split(' ')
    .map((part: string) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
  buildSemesterRecords(row);
  viewDialogVisible.value = true;
};

const buildSemesterRecords = (row: any) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const semesterTemplates = [
    { semester: `Semester 1`, year: currentYear },
    { semester: `Semester 2`, year: currentYear },
    { semester: `Semester 1`, year: currentYear - 1 }
  ];
  semesterRecords.value = semesterTemplates.map((template, index) => ({
    semester: `${template.year} ${template.semester}`,
    startDay: index === 0 ? row?.startDay : undefined,
    endDay: index === 0 ? row?.endDay : undefined,
    attendance: index === 0 && row?.attendanceRate !== undefined ? `${row.attendanceRate}%` : '-'
  }));
};

const populateDrawer = (student?: any) => {
  const [first = '', ...rest] = (student?.name || '').split(' ');
  const last = rest.join(' ');
  Object.assign(selectedStudent, {
    firstName: student?.firstName || first,
    lastName: student?.lastName || last,
    studentId: student?.studentId || '',
    schoolEmail: student?.email || '',
    personalEmail: student?.email || '',
    currentStatus: student?.status || 'Active',
    enrolledModule1: moduleOptions.value[0],
    enrolledModule2: moduleOptions.value[1],
    attendanceRate: student?.attendanceRate ? `${student.attendanceRate}%` : '97.65%',
    mobileNumber: student?.mobile || '',
    mobileCountry: 'Singapore',
    streetAddress: '777 Anchorvale Drive',
    unitNumber: '12-45',
    postalCode: '520513'
  });
};

/** Delete button action */
const handleDelete = async (row?: any) => {
  const studentIds = row?.studentId || ids.value;
  await proxy?.$modal.confirm('Are you sure you want to delete student ID "' + studentIds + '"?');
  // TODO: Call actual API to delete student
  await getList();
  proxy?.$modal.msgSuccess('Delete successful');
};

const markAsActive = () => {
  proxy?.$modal?.msgWarning?.('TODO: Implement mark as active');
};
const markAsInactive = () => {
  proxy?.$modal?.msgWarning?.('TODO: Implement mark as inactive');
};
const markAsArchived = () => {
  proxy?.$modal?.msgWarning?.('TODO: Implement mark as archived');
};

const handleDrawerSubmit = () => {
  drawerVisible.value = false;
  proxy?.$modal.msgSuccess('Saved (mock)');
};

onMounted(() => {
  getList();
});
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
</style>

<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="Student Name" prop="studentName" label-width="140px">
              <el-input v-model="queryParams.studentName" placeholder="Enter student name" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="Student ID" prop="studentId" label-width="100px">
              <el-input v-model="queryParams.studentId" placeholder="Enter student ID" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="Date" label-width="100px" style="width: 308px">
              <el-date-picker
                v-model="dateRange"
                value-format="YYYY-MM-DD"
                type="daterange"
                range-separator="-"
                start-placeholder="Start date"
                end-placeholder="End date"
              ></el-date-picker>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">Search</el-button>
              <el-button icon="Refresh" @click="resetQuery">Reset</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>

    <el-card class="class-details-card" shadow="never">
      <div class="class-details-title">Class Information</div>
      <div class="class-details-row">
        <div class="class-details-item">
          <p class="class-details-label">Class</p>
          <p class="class-details-value">{{ classDetail.className }}</p>
        </div>
        <div class="class-details-item">
          <p class="class-details-label">Lecturer / Tutor</p>
          <p class="class-details-value">{{ classDetail.lecturer }}</p>
        </div>
        <div class="class-details-item">
          <p class="class-details-label">Venue</p>
          <p class="class-details-value">{{ classDetail.venue }}</p>
        </div>
        <div class="class-details-item">
          <p class="class-details-label">Date / Time</p>
          <p class="class-details-value">{{ formatDateTime(classDetail.dateTime) }}</p>
        </div>
        <div class="class-details-item status-item">
          <p class="class-details-label">Current Status</p>
          <p class="class-details-status">{{ classDetail.currentStatus }}</p>
        </div>
      </div>
      <div class="class-details-row">
        <div class="class-details-item">
          <p class="class-details-label">Total</p>
          <p class="class-details-value">{{ classDetail.total }}</p>
        </div>
        <div class="class-details-item">
          <p class="class-details-label">Present</p>
          <p class="class-details-value">{{ classDetail.present }}</p>
        </div>
        <div class="class-details-item">
          <p class="class-details-label">Late</p>
          <p class="class-details-value">{{ classDetail.late }}</p>
        </div>
        <div class="class-details-item">
          <p class="class-details-label">Absent</p>
          <p class="class-details-value">{{ classDetail.absent }}</p>
        </div>
        <div class="class-details-item">
          <p class="class-details-label">Attendance Rate</p>
          <p class="class-details-value">{{ classDetail.attendanceRate }}</p>
        </div>
      </div>
    </el-card>

    <el-card shadow="hover" class="class-table-card">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd()">Add</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain :disabled="single" icon="Edit" @click="handleUpdate()">Edit</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain :disabled="multiple" icon="Delete" @click="handleDelete()">Delete</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport">Export</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table
        class="attendify-table"
        ref="attendanceTableRef"
        v-loading="loading"
        :data="attendanceList"
        border
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="Name" prop="studentName" :show-overflow-tooltip="true" min-width="180" />
        <el-table-column label="Student ID" prop="studentId" min-width="130" />
        <el-table-column label="School Email" prop="schoolEmail" :show-overflow-tooltip="true" min-width="220" />
        <el-table-column label="Mobile" prop="mobile" min-width="140" />
        <el-table-column label="Attendance Rate" prop="attendanceRate" min-width="150" />
        <el-table-column label="Status" prop="status" min-width="130">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'present'" type="success">Present</el-tag>
            <el-tag v-else-if="scope.row.status === 'absent'" type="danger">Absent</el-tag>
            <el-tag v-else-if="scope.row.status === 'late'" type="warning">Late</el-tag>
            <el-tag v-else type="warning">Pending</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="140" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" @click="handleUpdate(scope.row)">Review</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- Add Attendance Record Dialog -->
    <el-dialog v-model="addDialogVisible" title="Add Attendance Record" width="500px" append-to-body>
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="140px">
        <el-form-item label="Name" prop="studentName">
          <el-input v-model="addForm.studentName" placeholder="Enter name" />
        </el-form-item>
        <el-form-item label="Student ID" prop="studentId">
          <el-input v-model="addForm.studentId" placeholder="Enter student ID" />
        </el-form-item>
        <el-form-item label="School Email" prop="schoolEmail">
          <el-input v-model="addForm.schoolEmail" placeholder="Enter school email" />
        </el-form-item>
        <el-form-item label="Mobile" prop="mobile">
          <el-input v-model="addForm.mobile" placeholder="Enter mobile number" />
        </el-form-item>
        <el-form-item label="Attendance Rate" prop="attendanceRate">
          <el-input v-model="addForm.attendanceRate" placeholder="Enter attendance rate (e.g. 95%)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelAdd">Cancel</el-button>
          <el-button type="primary" @click="submitAdd">Submit</el-button>
        </div>
      </template>
    </el-dialog>

    <el-drawer v-model="drawerVisible" :title="drawerTitle" custom-class="class-edit-drawer" size="50%">
      <div class="drawer-body">
        <div class="drawer-header-text">Class Information</div>
        <el-form ref="classFormRef" :model="form" :rules="rules" label-width="140px" class="class-edit-form">
          <div class="form-grid">
            <div class="form-column">
              <el-form-item label="Class" prop="className">
                <el-select v-model="form.className" placeholder="Select class" filterable>
                  <el-option v-for="item in classOptions" :key="item.value" :label="item.label" :value="item.label" />
                </el-select>
              </el-form-item>
              <el-form-item label="Lecturer / Tutor" prop="lecturer">
                <el-select v-model="form.lecturer" placeholder="Select lecturer" filterable allow-create>
                  <el-option v-for="name in lecturerOptions" :key="name" :label="name" :value="name" />
                </el-select>
              </el-form-item>
              <el-form-item label="Venue" prop="venue">
                <el-select v-model="form.venue" placeholder="Select venue">
                  <el-option v-for="venue in venueOptions" :key="venue" :label="venue" :value="venue" />
                </el-select>
              </el-form-item>
            </div>
            <div class="form-column">
              <el-form-item label="Date / Time" prop="dateTime">
                <el-date-picker
                  v-model="form.dateTime"
                  type="datetime"
                  value-format="YYYY-MM-DDTHH:mm"
                  placeholder="Select date/time"
                  style="width: 100%"
                />
              </el-form-item>
              <el-form-item label="Current Status" prop="currentStatus">
                <el-select v-model="form.currentStatus" placeholder="Select status">
                  <el-option v-for="status in statusOptions" :key="status" :label="status" :value="status" />
                </el-select>
              </el-form-item>
            </div>
          </div>

          <div class="class-stats-grid">
            <div class="stat-item">
              <span>Total</span>
              <span>{{ form.total }}</span>
            </div>
            <div class="stat-item">
              <span>Present</span>
              <span>{{ form.present || '-' }}</span>
            </div>
            <div class="stat-item">
              <span>Late</span>
              <span>{{ form.late || '-' }}</span>
            </div>
            <div class="stat-item">
              <span>Absent</span>
              <span>{{ form.absent || '-' }}</span>
            </div>
            <div class="stat-item">
              <span>Attendance Rate</span>
              <span>{{ form.attendanceRate || '-' }}</span>
            </div>
          </div>
        </el-form>
        <div class="drawer-footer">
          <el-button type="primary" @click="submitForm">Submit</el-button>
          <el-button @click="cancel">Cancel</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup name="Attendance" lang="ts">
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const attendanceList = ref<any[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const drawerTitle = ref('Edit Class Information');
const dateRange = ref<[DateModelType, DateModelType]>(['', '']);

// Class summary card data (initially empty when entering from menu)
const classDetail = ref({
  className: '',
  lecturer: '',
  venue: '',
  dateTime: '',
  currentStatus: '',
  total: 0,
  present: 0,
  late: 0,
  absent: 0,
  attendanceRate: ''
});

const queryFormRef = ref<ElFormInstance>();
const attendanceTableRef = ref<ElTableInstance>();
const classFormRef = ref<ElFormInstance>();

// Add dialog state
const addDialogVisible = ref(false);
const addFormRef = ref<ElFormInstance>();
const addForm = ref({
  studentName: '',
  studentId: '',
  schoolEmail: '',
  mobile: '',
  attendanceRate: ''
});
const addRules = {
  studentName: [{ required: true, message: 'Name is required', trigger: 'blur' }],
  studentId: [{ required: true, message: 'Student ID is required', trigger: 'blur' }],
  schoolEmail: [{ required: true, message: 'School email is required', trigger: 'blur' }],
  mobile: [{ required: true, message: 'Mobile is required', trigger: 'blur' }],
  attendanceRate: [{ required: true, message: 'Attendance rate is required', trigger: 'blur' }]
};

// Query parameters
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  studentName: '',
  studentId: ''
});

const classOptions = ref([
  { label: 'CSIT351 - Intro to Python Programming', value: 'CSIT351' },
  { label: 'CSIT332 - Game Production', value: 'CSIT332' },
  { label: 'CSIT120 - Intro to Web Development', value: 'CSIT120' }
]);

const lecturerOptions = ref(['Lawrence Long', 'Lee Hup Seng', 'Mason Carter']);
const venueOptions = ref(['LT A1.17', 'LT B2.05', 'Lab C4']);
const statusOptions = ref(['Completed', 'In Progress', 'Not Started']);

// Mock class templates for per-row randomization
const classTemplates = [
  {
    className: 'CSIT351 - Intro to Python Programming',
    lecturer: 'Lawrence Long',
    venue: 'LT A1.17',
    dateTime: '2025-10-11T12:00',
    currentStatus: 'Completed'
  },
  {
    className: 'CSIT332 - Game Production',
    lecturer: 'Lee Hup Seng',
    venue: 'LT B2.05',
    dateTime: '2025-10-12T09:30',
    currentStatus: 'In Progress'
  },
  {
    className: 'CSIT120 - Intro to Web Development',
    lecturer: 'Mason Carter',
    venue: 'Lab C4',
    dateTime: '2025-10-13T14:15',
    currentStatus: 'Not Started'
  }
];

const pickRandomClassInfo = () => {
  const index = Math.floor(Math.random() * classTemplates.length);
  return classTemplates[index];
};

// Drawer form parameters
const form = ref({
  className: '',
  lecturer: '',
  venue: '',
  dateTime: '',
  currentStatus: '',
  total: 0,
  present: 0,
  late: 0,
  absent: 0,
  attendanceRate: '0%'
});

const rules = {
  className: [{ required: true, message: 'Class is required', trigger: 'change' }],
  lecturer: [{ required: true, message: 'Lecturer is required', trigger: 'blur' }],
  venue: [{ required: true, message: 'Venue is required', trigger: 'change' }],
  dateTime: [{ required: true, message: 'Date/Time is required', trigger: 'blur' }],
  currentStatus: [{ required: true, message: 'Status is required', trigger: 'change' }]
};

const drawerVisible = ref(false);

const formatDateTime = (value: string) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

/** Query attendance list */
const getList = async () => {
  loading.value = true;
  // TODO: Call actual API here
  setTimeout(() => {
    const baseList = [
      {
        id: 1,
        studentName: 'Tiger Nixon',
        studentId: '8442876',
        schoolEmail: 'tnix435@myschool.edu.au',
        mobile: '87665544',
        attendanceRate: '100%',
        status: 'present'
      },
      {
        id: 2,
        studentName: 'Ashton Cox',
        studentId: '8143255',
        schoolEmail: 'acox321@myschool.edu.au',
        mobile: '87325674',
        attendanceRate: '100%',
        status: 'absent'
      },
      {
        id: 3,
        studentName: 'Ethan Winters',
        studentId: '8754264',
        schoolEmail: 'ewin873@myschool.edu.au',
        mobile: '85466657',
        attendanceRate: '87.5%',
        status: 'present'
      },
      {
        id: 4,
        studentName: 'Cedric Kelly',
        studentId: '7462990',
        schoolEmail: 'ckel865@myschool.edu.au',
        mobile: '83458954',
        attendanceRate: '100%',
        status: 'present'
      },
      {
        id: 5,
        studentName: 'Airi Satou',
        studentId: '8526431',
        schoolEmail: 'asat045@myschool.edu.au',
        mobile: '95448375',
        attendanceRate: '100%',
        status: 'present'
      },
      {
        id: 6,
        studentName: 'Brielle Williamson',
        studentId: '7749235',
        schoolEmail: 'bwill653@myschool.edu.au',
        mobile: '89654095',
        attendanceRate: '64.98%',
        status: 'present'
      },
      {
        id: 7,
        studentName: 'Herrod Chandler',
        studentId: '5739407',
        schoolEmail: 'hcha332@myschool.edu.au',
        mobile: '96546006',
        attendanceRate: '87%',
        status: 'present'
      },
      {
        id: 8,
        studentName: 'Rhona Davidson',
        studentId: '8787405',
        schoolEmail: 'rdav989@myschool.edu.au',
        mobile: '85445467',
        attendanceRate: '100%',
        status: 'pending'
      },
      {
        id: 9,
        studentName: 'Colleen Hurst',
        studentId: '7879502',
        schoolEmail: 'chur467@myschool.edu.au',
        mobile: '85436754',
        attendanceRate: '92.63%',
        status: 'present'
      },
      {
        id: 10,
        studentName: 'Sonya Frost',
        studentId: '7540214',
        schoolEmail: 'sfro762@myschool.edu.au',
        mobile: '95435004',
        attendanceRate: '92.63%',
        status: 'late'
      },
      {
        id: 11,
        studentName: 'Harry Porter',
        studentId: '8143255-2',
        schoolEmail: 'hpor765@myschool.edu.au',
        mobile: '93892358',
        attendanceRate: '100%',
        status: 'present'
      }
    ];

    // Attach random class info to each row so that clicking Review shows different values
    attendanceList.value = baseList.map((item) => ({
      ...item,
      classInfo: {
        ...pickRandomClassInfo()
      }
    }));
    total.value = attendanceList.value.length;
    loading.value = false;
  }, 500);
};

/** Search button action */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** Reset button action */
const resetQuery = () => {
  dateRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  queryParams.value.pageNum = 1;
  getList();
};

/** Multiple selection change */
const handleSelectionChange = (selection: any[]) => {
  ids.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
  single.value = selection.length != 1;
};

/** Open add dialog */
const handleAdd = () => {
  addForm.value = {
    studentName: '',
    studentId: '',
    schoolEmail: '',
    mobile: '',
    attendanceRate: ''
  };
  addDialogVisible.value = true;
};

/** Recalculate class statistics from attendance list */
const computeClassStats = () => {
  const total = attendanceList.value.length;
  const present = attendanceList.value.filter((item) => item.status === 'present').length;
  const late = attendanceList.value.filter((item) => item.status === 'late').length;
  const absent = attendanceList.value.filter((item) => item.status === 'absent').length;
  const rate = total ? `${((present / total) * 100).toFixed(2)}%` : '0%';
  return {
    total,
    present,
    late,
    absent,
    attendanceRate: rate
  };
};

/** Submit add dialog */
const submitAdd = () => {
  addFormRef.value?.validate((valid: boolean) => {
    if (!valid) return;
    const newId = attendanceList.value.length ? Math.max(...attendanceList.value.map((i) => i.id || 0)) + 1 : 1;
    attendanceList.value.push({
      id: newId,
      studentName: addForm.value.studentName,
      studentId: addForm.value.studentId,
      schoolEmail: addForm.value.schoolEmail,
      mobile: addForm.value.mobile,
      attendanceRate: addForm.value.attendanceRate,
      status: 'present'
    });
    total.value = attendanceList.value.length;
    const stats = computeClassStats();
    classDetail.value = { ...classDetail.value, ...stats };
    addDialogVisible.value = false;
    proxy?.$modal.msgSuccess('Attendance record added');
  });
};

/** Cancel add dialog */
const cancelAdd = () => {
  addDialogVisible.value = false;
  addFormRef.value?.resetFields();
};

/** Click row to update class summary card */
const handleRowClick = (row: any) => {
  const stats = computeClassStats();
  const info = row.classInfo || pickRandomClassInfo();
  classDetail.value = {
    ...info,
    ...stats
  };
};

/** Edit button action (Review) */
const handleUpdate = (row?: any) => {
  const sourceInfo = row?.classInfo || classDetail.value || pickRandomClassInfo();
  const stats = computeClassStats();
  form.value = {
    className: sourceInfo.className,
    lecturer: sourceInfo.lecturer,
    venue: sourceInfo.venue,
    dateTime: sourceInfo.dateTime,
    currentStatus: sourceInfo.currentStatus,
    total: stats.total,
    present: stats.present,
    late: stats.late,
    absent: stats.absent,
    attendanceRate: stats.attendanceRate
  };
  drawerTitle.value = 'Edit Class Information';
  drawerVisible.value = true;
};

/** Submit button */
const submitForm = () => {
  classFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      classDetail.value = { ...classDetail.value, ...form.value };
      proxy?.$modal.msgSuccess('Class information updated');
      drawerVisible.value = false;
    }
  });
};

/** Delete button action */
const handleDelete = async (row?: any) => {
  const attendanceIds = row?.id || ids.value;
  await proxy?.$modal.confirm('Are you sure you want to delete attendance record ID "' + attendanceIds + '"?');
  // TODO: Call actual API to delete attendance record
  await getList();
  proxy?.$modal.msgSuccess('Delete successful');
};

/** Export button action */
const handleExport = () => {
  proxy?.download(
    'attendance/export',
    {
      ...queryParams.value
    },
    `attendance_${new Date().getTime()}.xlsx`
  );
};

/** Cancel button */
const cancel = () => {
  drawerVisible.value = false;
  reset();
};

/** Form reset */
const reset = () => {
  form.value = {
    className: classDetail.value.className,
    lecturer: classDetail.value.lecturer,
    venue: classDetail.value.venue,
    dateTime: classDetail.value.dateTime,
    currentStatus: classDetail.value.currentStatus,
    total: classDetail.value.total,
    present: classDetail.value.present,
    late: classDetail.value.late,
    absent: classDetail.value.absent,
    attendanceRate: classDetail.value.attendanceRate
  };
  classFormRef.value?.clearValidate();
};

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.class-details-card {
  margin-bottom: 16px;
  padding: 18px 24px 12px;
  border-radius: 12px;
  background-color: #f3f4f6;
  border: none;
}

.class-details-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.class-details-row {
  display: flex;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 8px;
}

.class-details-item {
  flex: 1;
  min-width: 0;
}

.class-details-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.class-details-value {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-item .class-details-status {
  font-size: 14px;
  font-weight: 700;
  color: #10b981;
}

.class-table-card {
  margin-top: 12px;
}

@media (max-width: 1024px) {
  .class-details-row {
    flex-wrap: wrap;
  }

  .class-details-item {
    flex: 0 0 50%;
  }
}

.class-edit-drawer {
  .el-drawer__body {
    padding: 0;
  }
}

.drawer-body {
  padding: 24px;
  background-color: #f9fafb;
  min-height: 100%;
}

.drawer-header-text {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 16px;
  color: #111827;
}

.form-grid {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.form-column {
  flex: 1;
  min-width: 280px;
}

.class-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 24px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  background-color: #fff;
  border-radius: 10px;
  padding: 12px 16px;
  font-weight: 600;
  color: #111827;
}

.drawer-footer {
  text-align: right;
  margin-top: 24px;
}
</style>

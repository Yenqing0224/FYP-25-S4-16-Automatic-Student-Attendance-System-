<template>
  <div class="module-detail p-4">
    <div class="detail-header">
      <el-button link icon="ArrowLeft" @click="goBack">Back to Module List</el-button>
      <div class="detail-title">
        <h2>{{ moduleDetail.moduleName || 'Module Detail' }}</h2>
        <p class="detail-subtitle">{{ moduleDetail.moduleCode }}</p>
      </div>
    </div>

    <el-card class="module-summary-card" shadow="never">
      <div class="module-summary-title">Module Information</div>
      <div class="module-summary-row">
        <div class="module-summary-item">
          <p class="module-summary-label">Module Code</p>
          <p class="module-summary-value">{{ moduleDetail.moduleCode || '-' }}</p>
        </div>
        <div class="module-summary-item">
          <p class="module-summary-label">Module Name</p>
          <p class="module-summary-value">{{ moduleDetail.moduleName || '-' }}</p>
        </div>
        <div class="module-summary-item">
          <p class="module-summary-label">Credit Points</p>
          <p class="module-summary-value">{{ moduleDetail.credits }}</p>
        </div>
        <div class="module-summary-item">
          <p class="module-summary-label">Students Enrolled</p>
          <p class="module-summary-value">{{ moduleDetail.studentsEnrolled }}</p>
        </div>
        <div class="module-summary-item status-item">
          <p class="module-summary-label">Status</p>
          <p class="module-summary-status">{{ moduleDetail.status || '-' }}</p>
        </div>
      </div>
      <div class="module-summary-row">
        <div class="module-summary-item">
          <p class="module-summary-label">Avg Attendance</p>
          <p class="module-summary-value">{{ moduleDetail.avgAttendance ?? 0 }}%</p>
        </div>
        <div class="module-summary-item">
          <p class="module-summary-label">Lecturer / Tutor</p>
          <p class="module-summary-value">
            <span v-if="moduleDetail.lecturers?.length">
              {{ moduleDetail.lecturers.join(', ') }}
            </span>
            <span v-else>-</span>
          </p>
        </div>
      </div>
    </el-card>

    <div class="module-related-row">
      <el-card class="module-related-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>Classes for {{ moduleDetail.moduleCode }}</span>
            <span class="card-caption">Select a class to view enrolled students</span>
          </div>
        </template>
        <el-table ref="classTableRef" class="attendify-table" :data="pagedClassList" border highlight-current-row @row-click="handleClassRowClick">
          <el-table-column label="Class Type" prop="type" width="120" />
          <el-table-column label="Lecturer / Tutor" prop="lecturer" min-width="180" />
          <el-table-column label="Venue" prop="venue" min-width="160" />
          <el-table-column label="Date & Time" prop="date" min-width="200" />
          <el-table-column label="Present" prop="present" width="100" />
          <el-table-column label="Absent" prop="absent" width="100" />
          <el-table-column label="Attendance Rate" prop="attendanceRate" width="100" />
          <el-table-column label="Status" prop="status" width="130">
            <template #default="scope">
              <el-tag v-if="scope.row.status === 'Active'" type="success">Active</el-tag>
              <el-tag v-else-if="scope.row.status === 'Scheduled'" type="info">Scheduled</el-tag>
              <el-tag v-else type="warning">Completed</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <pagination
          v-show="classPaginationTotal > 0"
          v-model:page="classPagination.pageNum"
          v-model:limit="classPagination.pageSize"
          :total="classPaginationTotal"
          @pagination="handleClassPagination"
        />
      </el-card>

      <el-card v-if="selectedClass" class="module-related-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>Students for {{ selectedClass?.type }} · {{ selectedClass?.date }}</span>
            <span class="card-caption">{{ selectedClass?.venue }} · {{ selectedClass?.lecturer }}</span>
          </div>
        </template>
        <el-table class="attendify-table" :data="studentList" border>
          <el-table-column type="index" width="60" label="#" />
          <el-table-column label="Student ID" prop="studentId" min-width="140" />
          <el-table-column label="Name" prop="name" min-width="200" />
          <el-table-column label="Check-in Time" prop="inTime" min-width="140" />
          <el-table-column label="Check-out Time" prop="outTime" min-width="200" />
          <el-table-column label="Status" prop="status" width="140">
            <template #default="scope">
              <el-tag v-if="scope.row.status === 'Present'" type="success">Present</el-tag>
              <el-tag v-else-if="scope.row.status === 'Absent'" type="danger">Absent</el-tag>
              <el-tag v-else type="warning">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup name="ModuleDetail" lang="ts">
interface ModuleInfo {
  id: number;
  moduleCode: string;
  moduleName: string;
  credits: number;
  studentsEnrolled: number;
  avgAttendance: number;
  lecturers: string[];
  status: string;
}

interface ModuleClass {
  id: string;
  type: 'Lecture' | 'Tutorial';
  lecturer: string;
  venue: string;
  date: string;
  present: number;
  absent: number;
  attendanceRate: number;
  status: 'Active' | 'Scheduled' | 'Completed';
}

interface ClassStudent {
  id: number;
  studentId: string;
  name: string;
  status: 'Present' | 'Absent' | 'Late';
}

const router = useRouter();
const route = useRoute();
const moduleId = computed(() => Number(route.params.moduleId));

const classTableRef = ref<ElTableInstance>();
const moduleDetail = reactive<ModuleInfo>({
  id: 0,
  moduleCode: '',
  moduleName: '',
  credits: 0,
  studentsEnrolled: 0,
  avgAttendance: 0,
  lecturers: [],
  status: ''
});
const classList = ref<ModuleClass[]>([]);
const selectedClass = ref<ModuleClass | null>(null);
const studentList = ref<ClassStudent[]>([]);
const classPagination = reactive({
  pageNum: 1,
  pageSize: 5
});
const pagedClassList = computed(() => {
  const start = (classPagination.pageNum - 1) * classPagination.pageSize;
  return classList.value.slice(start, start + classPagination.pageSize);
});
const classPaginationTotal = computed(() => classList.value.length);

const moduleCatalog: Record<number, ModuleInfo> = {
  1: {
    id: 1,
    moduleCode: 'CSIT131',
    moduleName: 'Intro to Python Programming',
    credits: 6,
    studentsEnrolled: 213,
    avgAttendance: 78,
    lecturers: ['Lawrence Long', 'Jamie Oliver'],
    status: 'Inactive'
  },
  2: {
    id: 2,
    moduleCode: 'CSCI256',
    moduleName: 'Advanced Programming',
    credits: 6,
    studentsEnrolled: 213,
    avgAttendance: 78,
    lecturers: ['Dr. Parker'],
    status: 'Active'
  },
  3: {
    id: 3,
    moduleCode: 'CSCI305',
    moduleName: 'Baseball Analytics',
    credits: 6,
    studentsEnrolled: 213,
    avgAttendance: 97.65,
    lecturers: ['ICT Department'],
    status: 'Active'
  },
  4: {
    id: 4,
    moduleCode: 'DNC101',
    moduleName: 'Dance Club Entry Audition',
    credits: 6,
    studentsEnrolled: 213,
    avgAttendance: 97.65,
    lecturers: ['Dance Club'],
    status: 'Active'
  }
};

const moduleClassMap: Record<number, ModuleClass[]> = {
  1: [
    {
      id: 'CSIT131-L1',
      type: 'Lecture',
      lecturer: 'Lawrence Long',
      venue: 'Main Hall 1',
      date: 'Mon · 09:00 - 11:00',
      present: 180,
      absent: 33,
      attendanceRate: 84.5,
      status: 'Active'
    },
    {
      id: 'CSIT131-T1',
      type: 'Tutorial',
      lecturer: 'Jamie Oliver',
      venue: 'Room B203',
      date: 'Wed · 14:00 - 15:00',
      present: 25,
      absent: 5,
      attendanceRate: 83.3,
      status: 'Scheduled'
    },
    {
      id: 'CSIT131-L2',
      type: 'Lecture',
      lecturer: 'Lawrence Long',
      venue: 'Main Hall 2',
      date: 'Tue · 11:00 - 13:00',
      present: 170,
      absent: 43,
      attendanceRate: 79.8,
      status: 'Scheduled'
    },
    {
      id: 'CSIT131-T2',
      type: 'Tutorial',
      lecturer: 'Jamie Oliver',
      venue: 'Room B205',
      date: 'Thu · 09:00 - 10:00',
      present: 28,
      absent: 2,
      attendanceRate: 93.3,
      status: 'Active'
    },
    {
      id: 'CSIT131-L3',
      type: 'Lecture',
      lecturer: 'Guest Lecturer',
      venue: 'Auditorium B',
      date: 'Fri · 15:00 - 17:00',
      present: 160,
      absent: 53,
      attendanceRate: 75.1,
      status: 'Completed'
    },
    {
      id: 'CSIT131-T3',
      type: 'Tutorial',
      lecturer: 'Teaching Assistants',
      venue: 'Room C101',
      date: 'Sat · 10:00 - 11:00',
      present: 26,
      absent: 4,
      attendanceRate: 86.7,
      status: 'Scheduled'
    }
  ],
  2: [
    {
      id: 'CSCI256-L1',
      type: 'Lecture',
      lecturer: 'Dr. Parker',
      venue: 'Auditorium A',
      date: 'Tue · 10:00 - 12:00',
      present: 185,
      absent: 28,
      attendanceRate: 86.9,
      status: 'Active'
    },
    {
      id: 'CSCI256-T2',
      type: 'Tutorial',
      lecturer: 'ICT Department',
      venue: 'Lab 3',
      date: 'Thu · 13:00 - 14:30',
      present: 32,
      absent: 3,
      attendanceRate: 91.4,
      status: 'Scheduled'
    },
    {
      id: 'CSCI256-L2',
      type: 'Lecture',
      lecturer: 'Dr. Parker',
      venue: 'Auditorium A',
      date: 'Thu · 09:00 - 11:00',
      present: 178,
      absent: 35,
      attendanceRate: 83.6,
      status: 'Scheduled'
    },
    {
      id: 'CSCI256-T3',
      type: 'Tutorial',
      lecturer: 'ICT Mentors',
      venue: 'Lab 5',
      date: 'Fri · 14:00 - 15:30',
      present: 30,
      absent: 5,
      attendanceRate: 85.7,
      status: 'Active'
    }
  ],
  3: [
    {
      id: 'CSCI305-L1',
      type: 'Lecture',
      lecturer: 'Coach Miles',
      venue: 'Stadium Briefing Room',
      date: 'Fri · 08:00 - 10:00',
      present: 110,
      absent: 10,
      attendanceRate: 91.7,
      status: 'Active'
    },
    {
      id: 'CSCI305-T1',
      type: 'Tutorial',
      lecturer: 'Analytics Team',
      venue: 'Sports Lab',
      date: 'Mon · 16:00 - 17:30',
      present: 40,
      absent: 3,
      attendanceRate: 93.0,
      status: 'Scheduled'
    },
    {
      id: 'CSCI305-T2',
      type: 'Tutorial',
      lecturer: 'Analytics Team',
      venue: 'Sports Lab',
      date: 'Wed · 16:00 - 17:30',
      present: 38,
      absent: 5,
      attendanceRate: 88.4,
      status: 'Completed'
    }
  ],
  4: [
    {
      id: 'DNC101-L1',
      type: 'Lecture',
      lecturer: 'Dance Club',
      venue: 'Studio 4',
      date: 'Sat · 10:00 - 12:00',
      present: 55,
      absent: 5,
      attendanceRate: 91.7,
      status: 'Scheduled'
    },
    {
      id: 'DNC101-T1',
      type: 'Tutorial',
      lecturer: 'Dance Coaches',
      venue: 'Studio 2',
      date: 'Sun · 09:00 - 10:30',
      present: 48,
      absent: 2,
      attendanceRate: 96.0,
      status: 'Active'
    }
  ]
};

const classStudentMap: Record<string, ClassStudent[]> = {
  'CSIT131-L1': [
    { id: 1, studentId: 'S001', name: 'Emily Carter', status: 'Present' },
    { id: 2, studentId: 'S002', name: 'Daniel Kim', status: 'Late' },
    { id: 3, studentId: 'S003', name: 'Sofia Liu', status: 'Present' }
  ],
  'CSIT131-T1': [
    { id: 1, studentId: 'S004', name: 'Michael Chan', status: 'Present' },
    { id: 2, studentId: 'S005', name: 'Chloe Smith', status: 'Absent' }
  ],
  'CSIT131-L2': [
    { id: 1, studentId: 'S006', name: 'Brian Zhao', status: 'Present' },
    { id: 2, studentId: 'S007', name: 'Alice Moore', status: 'Present' },
    { id: 3, studentId: 'S008', name: 'Kayden Ross', status: 'Late' }
  ],
  'CSIT131-T2': [
    { id: 1, studentId: 'S009', name: 'Priya Patel', status: 'Present' },
    { id: 2, studentId: 'S010', name: 'Leo Martin', status: 'Present' }
  ],
  'CSIT131-L3': [
    { id: 1, studentId: 'S011', name: 'Hannah Reed', status: 'Absent' },
    { id: 2, studentId: 'S012', name: 'Marcus Allen', status: 'Present' }
  ],
  'CSIT131-T3': [
    { id: 1, studentId: 'S013', name: 'Sophia Diaz', status: 'Present' },
    { id: 2, studentId: 'S014', name: 'Noah Wright', status: 'Late' }
  ],
  'CSCI256-L1': [
    { id: 1, studentId: 'S101', name: 'Olivia White', status: 'Present' },
    { id: 2, studentId: 'S102', name: 'Noah Patel', status: 'Present' }
  ],
  'CSCI256-T2': [
    { id: 1, studentId: 'S103', name: 'Liam Johnson', status: 'Late' },
    { id: 2, studentId: 'S104', name: 'Isabella Green', status: 'Present' }
  ],
  'CSCI256-L2': [
    { id: 1, studentId: 'S105', name: 'Evelyn Scott', status: 'Present' },
    { id: 2, studentId: 'S106', name: 'Caleb Price', status: 'Late' }
  ],
  'CSCI256-T3': [
    { id: 1, studentId: 'S107', name: 'Amelia Young', status: 'Present' },
    { id: 2, studentId: 'S108', name: 'Ethan Cooper', status: 'Present' }
  ],
  'CSCI305-L1': [
    { id: 1, studentId: 'S201', name: 'Ethan Baker', status: 'Present' },
    { id: 2, studentId: 'S202', name: 'Grace Hill', status: 'Present' }
  ],
  'CSCI305-T1': [
    { id: 1, studentId: 'S203', name: 'Lucas Perez', status: 'Present' },
    { id: 2, studentId: 'S204', name: 'Samantha Ward', status: 'Absent' }
  ],
  'CSCI305-T2': [
    { id: 1, studentId: 'S205', name: 'Aiden Bell', status: 'Present' },
    { id: 2, studentId: 'S206', name: 'Zara Fox', status: 'Present' }
  ],
  'DNC101-L1': [
    { id: 1, studentId: 'S301', name: 'Mia Flores', status: 'Present' },
    { id: 2, studentId: 'S302', name: 'Kayla Reed', status: 'Late' }
  ],
  'DNC101-T1': [
    { id: 1, studentId: 'S303', name: 'Natalie Cruz', status: 'Present' },
    { id: 2, studentId: 'S304', name: 'Oliver Hayes', status: 'Present' }
  ]
};

const highlightSelectedClass = () => {
  if (!selectedClass.value) {
    classTableRef.value?.setCurrentRow(null);
    return;
  }
  const isVisible = pagedClassList.value.some((cls) => cls.id === selectedClass.value?.id);
  nextTick(() => {
    classTableRef.value?.setCurrentRow(isVisible ? selectedClass.value : null);
  });
};

const handleClassPagination = ({ page, limit }: { page: number; limit: number }) => {
  classPagination.pageNum = page;
  classPagination.pageSize = limit;
  highlightSelectedClass();
};

const loadModuleDetail = () => {
  const detail = moduleCatalog[moduleId.value];
  if (!detail) {
    router.replace('/modules');
    return;
  }
  Object.assign(moduleDetail, detail);
  classList.value = moduleClassMap[moduleId.value] || [];
  classPagination.pageNum = 1;
  selectedClass.value = classList.value[0] || null;
  studentList.value = selectedClass.value ? classStudentMap[selectedClass.value.id] || [] : [];
  highlightSelectedClass();
};

const handleClassRowClick = (row: ModuleClass) => {
  selectedClass.value = row;
  studentList.value = classStudentMap[row.id] || [];
  highlightSelectedClass();
};

const goBack = () => {
  router.push('/modules');
};

watch(
  () => moduleId.value,
  () => {
    loadModuleDetail();
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.module-detail {
  min-height: calc(100vh - 120px);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.detail-title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.detail-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.module-summary-card {
  margin-bottom: 16px;
  padding: 18px 24px 12px;
  border-radius: 12px;
  background-color: #f3f4f6;
  border: none;
}

.module-related-row {
  display: flex;
  gap: 16px;
  margin-top: 16px;
  align-items: stretch;
}

.module-related-card {
  flex: 1 1 50%;
}

.module-summary-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.module-summary-row {
  display: flex;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 8px;
}

.module-summary-item {
  flex: 1;
  min-width: 0;
}

.module-summary-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.module-summary-value {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-item .module-summary-status {
  font-size: 14px;
  font-weight: 700;
  color: #10b981;
}

@media (max-width: 1024px) {
  .module-summary-row {
    flex-wrap: wrap;
  }

  .module-summary-item {
    flex: 0 0 50%;
  }
}

.card-header {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.card-caption {
  font-size: 12px;
  color: #9ca3af;
}

@media (max-width: 1024px) {
  .module-related-row {
    flex-direction: column;
  }

  .module-related-card {
    flex: 1 1 100%;
  }
}
</style>

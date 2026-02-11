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
              <el-tag v-if="scope.row.status === 'Upcoming'" type="info">Upcoming</el-tag>
              <el-tag v-else-if="scope.row.status === 'In Progress'" type="warning">In Progress</el-tag>
              <el-tag v-else-if="scope.row.status === 'Completed'" type="success">Completed</el-tag>
              <el-tag v-else-if="scope.row.status === 'Cancelled'" type="danger">Cancelled</el-tag>
              <el-tag v-else-if="scope.row.status === 'Rescheduled'" type="info">Rescheduled</el-tag>
              <el-tag v-else type="info">{{ scope.row.status }}</el-tag>
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
          <el-table-column label="Duration" prop="duration" min-width="120">
            <template #default="scope">{{ formatDuration(scope.row.duration) }}</template>
          </el-table-column>
          <el-table-column label="Status" prop="status" width="140">
            <template #default="scope">
              <el-tag v-if="scope.row.status === 'Present'" type="success">Present</el-tag>
              <el-tag v-else-if="scope.row.status === 'Absent'" type="danger">Absent</el-tag>
              <el-tag v-else-if="scope.row.status === 'On Leave'" type="warning">On Leave</el-tag>
              <el-tag v-else type="info">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup name="ModuleDetail" lang="ts">
import { getModule, listClassSessions, listAttendanceRecords, listAdminStudents, listAdminLecturers } from '@/api/admin';

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
  id: number | string;
  type: 'Lecture' | 'Tutorial';
  lecturer: string;
  venue: string;
  date: string;
  present: number;
  absent: number;
  attendanceRate: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled' | 'Rescheduled';
}

interface ClassStudent {
  id: number;
  studentId: string;
  name: string;
  inTime: string;
  outTime: string;
  duration: number | null;
  status: 'Present' | 'Absent' | 'On Leave';
}

const router = useRouter();
const route = useRoute();
const moduleId = computed(() => Number(route.params.moduleId));

const classTableRef = ref<ElTableInstance>();
const loading = ref(false);
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
const studentOptionsMap = ref<Map<number, any>>(new Map()); // 学生ID映射表
const lecturerOptionsMap = ref<Map<number, string>>(new Map()); // 讲师ID映射表
const classPagination = reactive({
  pageNum: 1,
  pageSize: 5
});
const pagedClassList = computed(() => {
  const start = (classPagination.pageNum - 1) * classPagination.pageSize;
  return classList.value.slice(start, start + classPagination.pageSize);
});
const classPaginationTotal = computed(() => classList.value.length);

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

const loadModuleDetail = async () => {
  if (!moduleId.value) {
    router.replace('/modules');
    return;
  }
  
  loading.value = true;
  try {
    // 加载模块详情（必须成功）
    const moduleRes: any = await getModule(moduleId.value);
    const lecturerName = moduleRes?.lecturer_details 
      ? `${moduleRes.lecturer_details.first_name || ''} ${moduleRes.lecturer_details.last_name || ''}`.trim()
      : '';
    
    Object.assign(moduleDetail, {
      id: moduleRes.id,
      moduleCode: moduleRes.code || '',
      moduleName: moduleRes.name || '',
      credits: moduleRes.credit || 0,
      studentsEnrolled: moduleRes.student_enrolled || moduleRes.students?.length || 0,
      avgAttendance: moduleRes.average_attendance || 0,
      lecturers: lecturerName ? [lecturerName] : [],
      status: moduleRes.status === 'active' ? 'Active' : 'Inactive'
    });
    
    // 加载学生列表和讲师列表（失败不阻断详情展示）
    try {
      await Promise.all([loadStudentOptions(), loadLecturerOptions()]);
    } catch (error) {
      console.warn('Failed to load dropdown options:', error);
    }
    
    // 加载该模块的课程会话（失败则显示空列表）
    let sessions: any[] = [];
    try {
      const sessionsRes: any = await listClassSessions({ module: moduleId.value, page_size: 100 });
      sessions = sessionsRes?.data?.results ?? sessionsRes?.results ?? sessionsRes?.data ?? [];
    } catch (error) {
      console.warn('Failed to load class sessions:', error);
      sessions = [];
    }
    
    classList.value = sessions.map((s: any) => {
      // 尝试从 session 的嵌套信息获取讲师，如果没有则从映射表查找
      let lecName = '-';
      if (s.module_details?.lecturer_details) {
        lecName = `${s.module_details.lecturer_details.first_name || ''} ${s.module_details.lecturer_details.last_name || ''}`.trim() || '-';
      } else if (moduleDetail.lecturers?.length) {
        // 使用模块的讲师信息
        lecName = moduleDetail.lecturers[0];
      } else {
        // 从映射表中查找
        const lecturerId = s.module_details?.lecturer || moduleRes?.lecturer;
        if (lecturerId && lecturerOptionsMap.value.has(lecturerId)) {
          lecName = lecturerOptionsMap.value.get(lecturerId) || '-';
        }
      }
      return {
        id: s.id,
        type: s.type === 'lecture' ? 'Lecture' : 'Tutorial',
        lecturer: lecName,
        venue: s.venue?.name ?? s.venue ?? '-',
        date: `${s.date || ''} · ${s.start_time || ''} - ${s.end_time || ''}`,
        present: s.present_students || 0,
        absent: s.absent_students || 0,
        attendanceRate: `${s.attendance_rate || 0}%`,
        status: s.status === 'completed'
          ? 'Completed'
          : s.status === 'in_progress'
            ? 'In Progress'
            : s.status === 'cancelled'
              ? 'Cancelled'
              : (s.status === 'rescheduled' || s.status === 'reschedule')
                ? 'Rescheduled'
                : 'Upcoming'
      };
    });
    
    classPagination.pageNum = 1;
    selectedClass.value = classList.value[0] || null;
    
    if (selectedClass.value) {
      try {
        await loadStudentsForSession(selectedClass.value.id);
      } catch (error) {
        console.warn('Failed to load students for session:', error);
      }
    }
    
    highlightSelectedClass();
  } catch (error) {
    console.error('Failed to load module detail:', error);
    router.replace('/modules');
  } finally {
    loading.value = false;
  }
};

const loadStudentsForSession = async (sessionId: number | string) => {
  try {
    const recordsRes: any = await listAttendanceRecords({ session: sessionId, page_size: 100 });
    const records = recordsRes?.data?.results ?? recordsRes?.results ?? recordsRes?.data ?? [];
    
    studentList.value = records.map((r: any) => {
      // 尝试从嵌套信息获取
      let studentId = '-';
      let fullName = '-';
      
      if (r.student_details?.student_id) {
        // 后端返回了嵌套信息
        const student = r.student_details;
        const user = student.user_details ?? {};
        studentId = student.student_id || '-';
        fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '-';
      } else {
        // 后端只返回了 student ID（user ID），从已加载的学生列表中查找
        const studentUserId = r.student; // 这是 user ID
        const studentData = studentOptionsMap.value.get(studentUserId);
        if (studentData) {
          studentId = studentData.studentId || '-';
          fullName = studentData.name || '-';
        }
      }
      
      return {
        id: r.id,
        studentId: studentId,
        name: fullName,
        inTime: r.entry_time ? new Date(r.entry_time).toLocaleTimeString() : '-',
        outTime: r.exit_time ? new Date(r.exit_time).toLocaleTimeString() : '-',
        duration: r.duration ?? null,
        status: r.status === 'present' ? 'Present' : r.status === 'absent' ? 'Absent' : r.status === 'on_leave' ? 'On Leave' : r.status
      };
    });
  } catch (error) {
    console.error('Failed to load students:', error);
    studentList.value = [];
  }
};

/** 加载学生选项列表 */
const loadStudentOptions = async () => {
  try {
    const payload: any = await listAdminStudents({ page_size: 200 });
    const students = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
    
    studentOptionsMap.value.clear();
    students.forEach((s: any) => {
      const userDetails = s.user_details ?? {};
      const fullName = `${userDetails.first_name || ''} ${userDetails.last_name || ''}`.trim() || userDetails.username || '-';
      // 使用 user ID 作为 key，因为 attendance 记录中的 student 字段实际上是 user ID
      studentOptionsMap.value.set(s.user, {
        studentId: s.student_id || '-',
        name: fullName,
        email: userDetails.email || '-',
        phone: userDetails.phone_number || '-'
      });
    });
  } catch (error) {
    console.error('Failed to load student options:', error);
  }
};

/** 加载讲师选项列表 */
const loadLecturerOptions = async () => {
  try {
    const payload: any = await listAdminLecturers({ page_size: 100 });
    const lecturers = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
    
    lecturerOptionsMap.value.clear();
    lecturers.forEach((l: any) => {
      const userDetails = l.user_details ?? {};
      const fullName = `${userDetails.first_name || ''} ${userDetails.last_name || ''}`.trim() || userDetails.username || '-';
      // 使用 user ID 作为 key
      lecturerOptionsMap.value.set(l.user, fullName);
    });
    
    // 如果模块讲师为空，尝试从映射表补充
    if (!moduleDetail.lecturers?.length) {
      const moduleRes: any = await getModule(moduleId.value);
      const lecturerId = moduleRes?.lecturer;
      if (lecturerId && lecturerOptionsMap.value.has(lecturerId)) {
        moduleDetail.lecturers = [lecturerOptionsMap.value.get(lecturerId) || '-'];
      }
    }
  } catch (error) {
    console.error('Failed to load lecturer options:', error);
  }
};

const handleClassRowClick = async (row: ModuleClass) => {
  selectedClass.value = row;
  await loadStudentsForSession(row.id);
  highlightSelectedClass();
};

const goBack = () => {
  router.push('/modules');
};

const formatDuration = (seconds?: number | null) => {
  if (!seconds || seconds <= 0) {
    return '-';
  }
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
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

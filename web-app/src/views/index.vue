<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h3 class="dashboard-title">Dashboard</h3>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col v-for="stat in stats" :key="stat.label" :xs="24" :sm="12" :lg="8" :xl="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-sub">{{ stat.sub }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="panel-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="panel-card">
          <div class="panel-title">Alerts</div>
          <div class="panel-sub">Low attendance below {{ alertThreshold }}%</div>
          <div v-if="alerts.length" class="alert-list">
            <div v-for="alert in alerts" :key="alert.id" class="alert-item">
              <div class="alert-main">
                <span class="alert-name">{{ alert.className }}</span>
                <span class="alert-percent">{{ alert.attendance }}%</span>
              </div>
              <div class="alert-meta">{{ alert.module }} - {{ alert.time }}</div>
            </div>
          </div>
          <div v-else class="panel-empty">No alerts</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="panel-card">
          <div class="panel-title">Recent Activity</div>
          <div class="panel-sub">Latest changes in the system</div>
          <div v-if="activities.length" class="activity-list">
            <div v-for="activity in activities" :key="activity.id" class="activity-item">
              <div class="activity-main">
                <span class="activity-user">{{ activity.user }}</span>
                <span class="activity-action">{{ activity.action }}</span>
                <span class="activity-target">{{ activity.target }}</span>
              </div>
              <div class="activity-meta">{{ activity.detail }} - {{ activity.time }}</div>
            </div>
          </div>
          <div v-else class="panel-empty">No recent activity</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="Index" lang="ts">
import { listAdminStudents, listAdminLecturers, listAdmins, listModules, listClassSessions } from '@/api/admin';

const loading = ref(true);

const stats = ref([
  { label: 'Total Students', value: '0', sub: 'Across all intakes' },
  { label: 'Total Staffs', value: '0', sub: 'Lecturer and admins' },
  { label: 'Active Modules', value: '0', sub: 'Running this semester' },
  { label: "Today's Classes", value: '0', sub: 'Scheduled sessions' },
  { label: 'Avg Attendance', value: '0%', sub: 'Last 7 days' }
]);

const alertThreshold = 75;

const alerts = ref<any[]>([]);
const activities = ref<any[]>([]);

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** 加载Dashboard统计数据 */
const loadDashboardStats = async () => {
  loading.value = true;
  try {
    const todayStr = formatLocalDate(new Date());
    // 并行请求所有统计数据
    const [studentsRes, lecturersRes, adminsRes, modulesRes, sessionsRes, todaySessionsRes] = await Promise.all([
      listAdminStudents({ page_size: 1 }),
      listAdminLecturers({ page_size: 1 }),
      listAdmins({ page_size: 1 }),
      listModules({ status: 'active', page_size: 1 }),
      listClassSessions({ page_size: 100 }),
      listClassSessions({ date: todayStr, page_size: 1 })
    ]);

    // 提取总数 - request.ts 已经提取了 data 字段，所以直接访问 pagination
    const totalStudents = studentsRes?.pagination?.total_items ?? studentsRes?.count ?? 0;
    const totalLecturers = lecturersRes?.pagination?.total_items ?? lecturersRes?.count ?? 0;
    const totalAdmins = adminsRes?.pagination?.total_items ?? adminsRes?.count ?? 0;
    const totalModules = modulesRes?.pagination?.total_items ?? modulesRes?.count ?? 0;
    
    // 计算今日课程数（后端按 date 过滤，避免分页和时区问题）
    const sessions = sessionsRes?.results ?? [];
    const todaySessionsCount = todaySessionsRes?.count ?? 0;
    
    // 计算平均出勤率
    const sessionsWithRate = sessions.filter((s: any) => s.attendance_rate > 0);
    const avgAttendance = sessionsWithRate.length > 0 
      ? (sessionsWithRate.reduce((sum: number, s: any) => sum + (s.attendance_rate || 0), 0) / sessionsWithRate.length).toFixed(1)
      : '0';

    // 更新统计数据
    stats.value = [
      { label: 'Total Students', value: totalStudents.toLocaleString(), sub: 'Across all intakes' },
      { label: 'Total Staffs', value: (totalLecturers + totalAdmins).toLocaleString(), sub: 'Lecturer and admins' },
      { label: 'Active Modules', value: totalModules.toLocaleString(), sub: 'Running this semester' },
      { label: "Today's Classes", value: todaySessionsCount.toString(), sub: 'Scheduled sessions' },
      { label: 'Avg Attendance', value: `${avgAttendance}%`, sub: 'Last 7 days' }
    ];

    // 生成低出勤率警报
    const lowAttendanceSessions = sessions
      .filter((s: any) => s.attendance_rate > 0 && s.attendance_rate < alertThreshold)
      .slice(0, 5)
      .map((s: any, index: number) => ({
        id: index + 1,
        className: s.name || `Session ${s.id}`,
        attendance: s.attendance_rate?.toFixed(1) || 0,
        module: s.module_details?.name || s.module_details?.code || 'Unknown Module',
        time: s.date ? new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'
      }));
    
    alerts.value = lowAttendanceSessions;

    // 最近活动 (暂时使用静态数据，因为后端没有活动日志API)
    activities.value = [
      { id: 1, user: 'System', action: 'loaded', target: 'Dashboard', detail: 'Statistics refreshed', time: 'Just now' }
    ];

  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadDashboardStats();
});
</script>

<style lang="scss" scoped>
.dashboard {
  padding: 16px;
}

.dashboard-title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.stats-row {
  margin-bottom: 12px;
}

.stat-card {
  border-radius: 12px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.stat-sub {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 6px;
}

.panel-row {
  margin-top: 8px;
}

.panel-card {
  border-radius: 12px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.panel-sub {
  font-size: 12px;
  color: #6b7280;
  margin: 4px 0 12px;
}

.alert-list,
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item,
.activity-item {
  padding: 10px 12px;
  border-radius: 10px;
  background: #f9fafb;
}

.alert-main,
.activity-main {
  display: flex;
  gap: 6px;
  align-items: baseline;
  flex-wrap: wrap;
}

.alert-name,
.activity-user {
  font-weight: 600;
  color: #111827;
}

.alert-percent {
  font-weight: 700;
  color: #ef4444;
}

.activity-action {
  color: #6b7280;
}

.activity-target {
  font-weight: 600;
  color: #2563eb;
}

.alert-meta,
.activity-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #9ca3af;
}

.panel-empty {
  font-size: 13px;
  color: #9ca3af;
}
</style>


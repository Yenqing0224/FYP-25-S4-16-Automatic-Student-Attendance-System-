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
const stats = [
  { label: 'Total Students', value: '1,248', sub: 'Across all intakes' },
  { label: 'Total Staffs', value: '86', sub: 'Lecturer and admins' },
  { label: 'Active Modules', value: '34', sub: 'Running this semester' },
  { label: "Today's Classes", value: '12', sub: 'Scheduled sessions' },
  { label: 'Avg Attendance', value: '92.3%', sub: 'Last 7 days' }
];

const alertThreshold = 75;

const alerts = [
  { id: 1, className: 'COMP1101 - Tutorial A', attendance: 71.5, module: 'Programming I', time: 'Today 9:30 AM' },
  { id: 2, className: 'MATH2103 - Lecture 2', attendance: 68.2, module: 'Discrete Math', time: 'Yesterday 2:00 PM' },
  { id: 3, className: 'NETW2300 - Lab B', attendance: 73.9, module: 'Networking', time: 'Yesterday 4:30 PM' }
];

const activities = [
  { id: 1, user: 'Aisyah', action: 'added', target: 'Event', detail: 'Coding Workshop', time: '2 mins ago' },
  { id: 2, user: 'Justin', action: 'edited', target: 'Module', detail: 'Attendance threshold set to 75%', time: '18 mins ago' },
  { id: 3, user: 'YQ', action: 'deleted', target: 'Event', detail: 'Dance Club Entry Audition', time: '1 hour ago' },
  { id: 4, user: 'Admin', action: 'edited', target: 'Class', detail: 'COMP1101 - Lecture time update', time: '2 hours ago' }
];
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



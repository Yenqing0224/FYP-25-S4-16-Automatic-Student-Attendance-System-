<template>
  <div class="settings-page">
    <div class="settings-title">Settings</div>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="settings-card">
          <template #header>
            <span>Notifications</span>
          </template>
          <el-form label-width="190px" class="settings-form">
            <el-form-item label="Email alerts">
              <el-switch v-model="settings.emailAlerts" />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="settings-card">
          <template #header>
            <span>Class Schedule</span>
          </template>
          <el-form label-width="190px" class="settings-form">
            <el-form-item label="Class start time">
              <el-input v-model="settings.classStart" placeholder="09:00" />
            </el-form-item>
            <el-form-item label="Class end time">
              <el-input v-model="settings.classEnd" placeholder="17:00" />
            </el-form-item>
            <el-form-item label="Week starts on">
              <el-select v-model="settings.weekStartsOn" placeholder="Select day" style="width: 100%">
                <el-option v-for="day in weekDays" :key="day" :label="day" :value="day" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card shadow="hover" class="settings-card">
          <template #header>
            <span>System & Security</span>
          </template>
          <el-form label-width="190px" class="settings-form">
            <el-form-item label="Mask student IDs">
              <el-switch v-model="settings.maskStudentId" />
            </el-form-item>
            <el-form-item label="Audit log retention (days)">
              <el-input v-model="settings.auditRetentionDays" placeholder="e.g. 90" />
            </el-form-item>
            <el-form-item label="Timezone">
              <el-select v-model="settings.timezone" placeholder="Select timezone" style="width: 100%">
                <el-option v-for="zone in timezones" :key="zone" :label="zone" :value="zone" />
              </el-select>
            </el-form-item>
            <el-form-item label="Language">
              <el-select v-model="settings.language" placeholder="Select language" style="width: 100%">
                <el-option v-for="lang in languages" :key="lang" :label="lang" :value="lang" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <div class="settings-footer">
      <el-button type="primary" @click="handleSave">Save Changes</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

defineOptions({ name: 'SettingsPage' });

const settings = reactive({
  emailAlerts: true,
  smsAlerts: false,
  inAppAlerts: true,
  classStart: '09:00',
  classEnd: '17:00',
  weekStartsOn: 'Monday',
  maskStudentId: true,
  auditRetentionDays: '90',
  timezone: 'UTC+8',
  language: 'English'
});

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timezones = ['UTC+7', 'UTC+8', 'UTC+9'];
const languages = ['English', 'Bahasa Malaysia', 'Chinese'];

const handleSave = () => {
  console.log('Settings saved (mock)', JSON.stringify(settings));
};
</script>

<style scoped lang="scss">
.settings-page {
  padding: 16px;
}

.settings-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.settings-card {
  margin-bottom: 16px;
}

.settings-form :deep(.el-input),
.settings-form :deep(.el-select) {
  width: 100%;
}

.settings-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>

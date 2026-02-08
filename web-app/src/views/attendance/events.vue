<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="Event Name" prop="eventName" label-width="100px">
              <el-input v-model="queryParams.eventName" placeholder="Enter event name" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="Date/Time" style="width: 308px">
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

    <!-- Events summary card -->
    <el-card class="event-summary-card" shadow="never">
      <div class="event-summary-title">Events Information</div>
      <div class="event-summary-row">
        <div class="event-summary-item">
          <p class="event-summary-label">Event</p>
          <p class="event-summary-value">{{ eventDetail.eventName || '-' }}</p>
        </div>
        <div class="event-summary-item">
          <p class="event-summary-label">Organizer</p>
          <p class="event-summary-value">{{ eventDetail.organizer || '-' }}</p>
        </div>
        <div class="event-summary-item">
          <p class="event-summary-label">Venue</p>
          <p class="event-summary-value">{{ eventDetail.venue || '-' }}</p>
        </div>
        <div class="event-summary-item">
          <p class="event-summary-label">Date / Time</p>
          <p class="event-summary-value">
            <span v-if="eventDetail.dateRange[0] && eventDetail.dateRange[1]">
              {{ formatDateRange(eventDetail.dateRange) }} · {{ formatTimeRange(eventDetail.dateRange) }}
            </span>
            <span v-else>-</span>
          </p>
        </div>
        <div class="event-summary-item status-item">
          <p class="event-summary-label">Current Status</p>
          <p class="event-summary-status">{{ eventDetail.status || '-' }}</p>
        </div>
      </div>
      <div class="event-summary-row">
        <div class="event-summary-item">
          <p class="event-summary-label">Total</p>
          <p class="event-summary-value">{{ eventDetail.total }}</p>
        </div>
        <div class="event-summary-item">
          <p class="event-summary-label">Present</p>
          <p class="event-summary-value">{{ eventDetail.present }}</p>
        </div>
        <div class="event-summary-item">
          <p class="event-summary-label">Late</p>
          <p class="event-summary-value">{{ eventDetail.late }}</p>
        </div>
        <div class="event-summary-item">
          <p class="event-summary-label">Absent</p>
          <p class="event-summary-value">{{ eventDetail.absent }}</p>
        </div>
        <div class="event-summary-item">
          <p class="event-summary-label">Attendance Rate</p>
          <p class="event-summary-value">{{ eventDetail.rate || '0%' }}</p>
        </div>
      </div>
    </el-card>

    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd()">Add Event</el-button>
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

      <el-table
        class="attendify-table"
        ref="eventTableRef"
        v-loading="loading"
        :data="eventList"
        border
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="Event" prop="eventName" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="Organizer" prop="organizer" :show-overflow-tooltip="true" min-width="160" />
        <el-table-column label="Date / Time" min-width="240">
          <template #default="scope">
            <div class="event-date">{{ formatDateRange(scope.row.dateRange) }}</div>
            <div class="event-time">{{ formatTimeRange(scope.row.dateRange) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Rate" prop="rate" min-width="100" />
        <el-table-column label="Total" prop="total" min-width="80" />
        <el-table-column label="Present" prop="present" min-width="90" />
        <el-table-column label="Late" prop="late" min-width="80" />
        <el-table-column label="Absent" prop="absent" min-width="90" />
        <el-table-column label="Status" prop="status" min-width="130">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'Not Started'" type="info">Not Started</el-tag>
            <el-tag v-else-if="scope.row.status === 'Pending'" type="warning">Pending</el-tag>
            <el-tag v-else type="success">Completed</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="140" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">Edit</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- Add Event Dialog -->
    <el-dialog v-model="addDialogVisible" title="Add Event" width="520px" append-to-body>
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="140px">
        <el-form-item label="Event" prop="eventName">
          <el-input v-model="addForm.eventName" placeholder="Enter event name" />
        </el-form-item>
        <el-form-item label="Organizer" prop="organizer">
          <el-input v-model="addForm.organizer" placeholder="Enter organizer" />
        </el-form-item>
        <el-form-item label="Venue" prop="venue">
          <el-input v-model="addForm.venue" placeholder="Enter venue" />
        </el-form-item>
        <el-form-item label="Date / Time" prop="dateRange">
          <el-date-picker
            v-model="addForm.dateRange"
            type="datetimerange"
            value-format="YYYY-MM-DDTHH:mm"
            start-placeholder="Start"
            end-placeholder="End"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Attendance Rate" prop="rate">
          <el-input v-model="addForm.rate" placeholder="Enter rate (e.g. 97.65%)" />
        </el-form-item>
        <el-form-item label="Total" prop="total">
          <el-input v-model.number="addForm.total" type="number" placeholder="Enter total" />
        </el-form-item>
        <el-form-item label="Present" prop="present">
          <el-input v-model.number="addForm.present" type="number" placeholder="Enter present" />
        </el-form-item>
        <el-form-item label="Late" prop="late">
          <el-input v-model.number="addForm.late" type="number" placeholder="Enter late" />
        </el-form-item>
        <el-form-item label="Absent" prop="absent">
          <el-input v-model.number="addForm.absent" type="number" placeholder="Enter absent" />
        </el-form-item>
        <el-form-item label="Description" prop="description">
          <el-input v-model="addForm.description" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" placeholder="Enter description" />
        </el-form-item>
        <el-form-item label="Status" prop="status">
          <el-select v-model="addForm.status" placeholder="Select status">
            <el-option v-for="status in statusOptions" :key="status" :label="status" :value="status" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelAdd">Cancel</el-button>
          <el-button type="primary" @click="submitAdd">Submit</el-button>
        </div>
      </template>
    </el-dialog>

    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="45%" custom-class="event-drawer">
      <div class="event-drawer-body">
        <div class="event-drawer-section-title">Event Information</div>
        <el-form ref="eventFormRef" :model="form" :rules="rules" label-width="140px" class="event-form">
          <div class="event-form-grid">
            <div class="event-form-column">
              <el-form-item label="Event" prop="eventName">
                <el-input v-model="form.eventName" placeholder="Enter event name" />
              </el-form-item>
              <el-form-item label="Organizer" prop="organizer">
                <el-select v-model="form.organizer" placeholder="Select organizer" filterable>
                  <el-option v-for="org in organizerOptions" :key="org" :label="org" :value="org" />
                </el-select>
              </el-form-item>
              <el-form-item label="Venue" prop="venue">
                <el-select v-model="form.venue" placeholder="Select venue">
                  <el-option v-for="venue in venueOptions" :key="venue" :label="venue" :value="venue" />
                </el-select>
              </el-form-item>
            </div>
            <div class="event-form-column">
              <el-form-item label="Date / Time" prop="dateRange">
                <el-date-picker
                  v-model="form.dateRange"
                  type="datetimerange"
                  value-format="YYYY-MM-DDTHH:mm"
                  :default-time="defaultDateTimeRange"
                  start-placeholder="Start"
                  end-placeholder="End"
                  style="width: 100%"
                />
              </el-form-item>
              <el-form-item label="Current Status" prop="status">
                <el-select v-model="form.status" placeholder="Select status">
                  <el-option v-for="status in statusOptions" :key="status" :label="status" :value="status" />
                </el-select>
              </el-form-item>
            </div>
          </div>

          <div class="event-stats-grid">
            <div class="stat-item">
              <span>Total</span>
              <span>{{ form.total }}</span>
            </div>
            <div class="stat-item">
              <span>Present</span>
              <span>{{ form.present }}</span>
            </div>
            <div class="stat-item">
              <span>Late</span>
              <span>{{ form.late }}</span>
            </div>
            <div class="stat-item">
              <span>Absent</span>
              <span>{{ form.absent }}</span>
            </div>
            <div class="stat-item">
              <span>Attendance Rate</span>
              <span>{{ form.rate }}</span>
            </div>
          </div>

          <el-form-item prop="description" class="event-description-item" label-width="0">
            <div class="event-description-label">Description</div>
            <el-input v-model="form.description" class="event-description" type="textarea" placeholder="Enter description" />
          </el-form-item>
        </el-form>
        <div class="event-drawer-footer">
          <el-button type="primary" @click="submitForm">Submit</el-button>
          <el-button @click="cancel">Cancel</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup name="EventsAttendance" lang="ts">
import type { ComponentInternalInstance } from 'vue';
import type { FormInstance, TableInstance } from 'element-plus';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

type EventItem = {
  id: number | string;
  eventName: string;
  organizer: string;
  venue: string;
  dateRange: [string, string];
  rate: string;
  total: number;
  present: number;
  late: number;
  absent: number;
  status: string;
  description: string;
};

const eventList = ref<EventItem[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const dateRange = ref<[DateModelType, DateModelType]>(['', '']);

// Summary card data (empty when entering from menu)
const eventDetail = reactive<EventItem>({
  id: '',
  eventName: '',
  organizer: '',
  venue: '',
  dateRange: ['', ''],
  rate: '0%',
  total: 0,
  present: 0,
  late: 0,
  absent: 0,
  status: '',
  description: ''
});

const queryFormRef = ref<FormInstance>();
const eventTableRef = ref<TableInstance>();
const eventFormRef = ref<FormInstance>();

const drawerVisible = ref(false);
const drawerTitle = ref('Edit Event Information');

// Add dialog state
const addDialogVisible = ref(false);
const addFormRef = ref<FormInstance>();
const addForm = ref<EventItem>({
  id: '',
  eventName: '',
  organizer: '',
  venue: '',
  dateRange: ['', ''],
  rate: '',
  total: 0,
  present: 0,
  late: 0,
  absent: 0,
  status: '',
  description: ''
});
const addRules = {
  eventName: [{ required: true, message: 'Event is required', trigger: 'blur' }],
  organizer: [{ required: true, message: 'Organizer is required', trigger: 'blur' }],
  venue: [{ required: true, message: 'Venue is required', trigger: 'blur' }],
  dateRange: [{ required: true, message: 'Date/Time is required', trigger: 'change' }],
  rate: [{ required: true, message: 'Attendance rate is required', trigger: 'blur' }],
  total: [{ required: true, message: 'Total is required', trigger: 'blur' }],
  present: [{ required: true, message: 'Present is required', trigger: 'blur' }],
  late: [{ required: true, message: 'Late is required', trigger: 'blur' }],
  absent: [{ required: true, message: 'Absent is required', trigger: 'blur' }],
  status: [{ required: true, message: 'Status is required', trigger: 'change' }]
};

const organizerOptions = ref(['ICT Department', 'Baseball Club', 'Dance Club']);
const venueOptions = ref(['LT A1.17', 'LT B2.05', 'Field B2', 'Auditorium C3']);
const statusOptions = ref(['Not Started', 'Pending', 'Completed']);
const defaultDateTimeRange: [Date, Date] = [new Date(0, 0, 0, 12, 0, 0), new Date(0, 0, 0, 15, 0, 0)];

const form = ref<EventItem>({
  id: '',
  eventName: '',
  organizer: '',
  venue: '',
  dateRange: ['', ''],
  rate: '0%',
  total: 0,
  present: 0,
  late: 0,
  absent: 0,
  status: '',
  description: ''
});

const rules = {
  eventName: [{ required: true, message: 'Event is required', trigger: 'change' }],
  organizer: [{ required: true, message: 'Organizer is required', trigger: 'change' }],
  venue: [{ required: true, message: 'Venue is required', trigger: 'change' }],
  dateRange: [{ required: true, message: 'Date/Time is required', trigger: 'change' }],
  status: [{ required: true, message: 'Status is required', trigger: 'change' }]
};

// Query parameters
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  eventName: ''
});

const formatDateRange = (range?: EventItem['dateRange']) => {
  if (!range?.length) return '-';
  const [start, end] = range;
  const formatter = (value: string) => new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${formatter(start)} - ${formatter(end)}`;
};

const formatTimeRange = (range?: EventItem['dateRange']) => {
  if (!range?.length) return '-';
  const formatter = (value: string) => new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${formatter(range[0])} - ${formatter(range[1])}`;
};

const populateMockData = (): EventItem[] => [
  {
    id: 1,
    eventName: 'Coding Workshop',
    organizer: 'ICT Department',
    venue: 'LT A1.17',
    dateRange: ['2025-10-11T12:00', '2025-11-15T15:00'],
    rate: '97.65%',
    total: 213,
    present: 205,
    late: 3,
    absent: 5,
    status: 'Not Started',
    description: 'Introductory workshop for new coders.'
  },
  {
    id: 2,
    eventName: 'Baseball Trial',
    organizer: 'Baseball Club',
    venue: 'Field B2',
    dateRange: ['2025-10-08T09:00', '2025-10-08T18:00'],
    rate: '97.65%',
    total: 213,
    present: 205,
    late: 3,
    absent: 5,
    status: 'Pending',
    description: 'Open tryouts for the baseball team.'
  },
  {
    id: 3,
    eventName: 'Dance Club Entry Audition',
    organizer: 'Dance Club',
    venue: 'Auditorium C3',
    dateRange: ['2025-10-02T19:00', '2025-10-02T21:00'],
    rate: '97.65%',
    total: 213,
    present: 205,
    late: 3,
    absent: 5,
    status: 'Completed',
    description: 'Auditions for new dance club members.'
  }
];

/** Query event list */
const getList = async () => {
  loading.value = true;
  setTimeout(() => {
    eventList.value = populateMockData();
    total.value = eventList.value.length;
    loading.value = false;
  }, 300);
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

/** Row click: update summary card */
const handleRowClick = (row: EventItem) => {
  Object.assign(eventDetail, row);
};

const openDrawer = (title: string) => {
  drawerTitle.value = title;
  drawerVisible.value = true;
  nextTick(() => {
    eventFormRef.value?.clearValidate();
  });
};

/** Add button action */
const handleAdd = () => {
  addForm.value = {
    id: `EVT-${Date.now()}`,
    eventName: '',
    organizer: '',
    venue: '',
    dateRange: ['', ''],
    rate: '',
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    status: '',
    description: ''
  };
  addDialogVisible.value = true;
};

/** Edit button action */
const handleUpdate = (row?: any) => {
  const target = row || eventList.value.find((item) => item.id === ids.value[0]);
  if (!target) {
    proxy?.$modal.msgWarning('Please select an event to edit.');
    return;
  }
  form.value = { ...target, dateRange: [...target.dateRange] };
  openDrawer('Edit Event Information');
};

/** Submit button */
const submitForm = () => {
  eventFormRef.value?.validate((valid) => {
    if (!valid) return;
    const index = eventList.value.findIndex((item) => item.id === form.value.id);
    if (index >= 0) {
      eventList.value[index] = { ...form.value };
    } else {
      eventList.value.unshift({ ...form.value });
      total.value = eventList.value.length;
    }
    proxy?.$modal.msgSuccess('Event information saved');
    drawerVisible.value = false;
  });
};

/** Submit Add dialog */
const submitAdd = () => {
  addFormRef.value?.validate((valid) => {
    if (!valid) return;
    const newItem: EventItem = {
      ...addForm.value,
      // ensure dateRange is copied
      dateRange: [...addForm.value.dateRange] as [string, string]
    };
    eventList.value.unshift(newItem);
    total.value = eventList.value.length;
    proxy?.$modal.msgSuccess('Event added');
    addDialogVisible.value = false;
  });
};

/** Cancel Add dialog */
const cancelAdd = () => {
  addDialogVisible.value = false;
  addFormRef.value?.resetFields();
};

/** Delete button action */
const handleDelete = async (row?: any) => {
  const eventIds = row?.id || ids.value;
  await proxy?.$modal.confirm('Are you sure you want to delete event ID "' + eventIds + '"?');
  if (Array.isArray(eventIds)) {
    eventList.value = eventList.value.filter((item) => !eventIds.includes(item.id));
  } else {
    eventList.value = eventList.value.filter((item) => item.id !== eventIds);
  }
  total.value = eventList.value.length;
  proxy?.$modal.msgSuccess('Delete successful (mock)');
};

const cancel = () => {
  drawerVisible.value = false;
};

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.event-summary-card {
  margin-bottom: 16px;
  padding: 18px 24px 12px;
  border-radius: 12px;
  background-color: #f3f4f6;
  border: none;
}

.event-summary-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.event-summary-row {
  display: flex;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 8px;
}

.event-summary-item {
  flex: 1;
  min-width: 0;
}

.event-summary-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.event-summary-value {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-item .event-summary-status {
  font-size: 14px;
  font-weight: 700;
  color: #10b981;
}

@media (max-width: 1024px) {
  .event-summary-row {
    flex-wrap: wrap;
  }

  .event-summary-item {
    flex: 0 0 50%;
  }
}

.event-date {
  font-weight: 600;
  color: #111827;
}

.event-time {
  color: #6b7280;
  font-size: 12px;
}

.event-drawer {
  .el-drawer__body {
    padding: 0;
  }
}

.event-drawer-body {
  padding: 24px;
  background-color: #f9fafb;
  min-height: 100%;
}

.event-drawer-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.event-form-grid {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.event-form-column {
  flex: 1;
  min-width: 280px;
}

.event-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-top: 24px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  background: #fff;
  border-radius: 10px;
  padding: 12px 16px;
  font-weight: 600;
  color: #111827;
}

.event-drawer-footer {
  text-align: right;
  margin-top: 24px;
}

.event-description-item :deep(.el-form-item__content) {
  margin-left: 0;
  display: block;
}

.event-description-label {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
}

.event-description :deep(textarea) {
  height: 320px;
  resize: vertical;
}
</style>

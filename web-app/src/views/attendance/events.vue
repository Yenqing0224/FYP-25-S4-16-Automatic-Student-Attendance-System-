<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="Search" prop="keyword">
              <el-input v-model="queryParams.keyword" placeholder="Search by event name, organizer, venue..." clearable style="width: 300px" @keyup.enter="handleQuery" />
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
            <span v-if="eventDetail.eventDate">
              {{ formatEventDate(eventDetail.eventDate) }} · {{ formatEventTime(eventDetail.eventDate) }}
            </span>
            <span v-else>-</span>
          </p>
        </div>
        <div class="event-summary-item status-item">
          <p class="event-summary-label">Current Status</p>
          <p class="event-summary-status">{{ getStatusLabel(eventDetail.status) }}</p>
        </div>
      </div>
      <div class="event-summary-row">
        <div class="event-summary-item">
          <p class="event-summary-label">Slot Limit</p>
          <p class="event-summary-value">{{ eventDetail.id ? formatSlotLimit(eventDetail.slotLimit) : '-' }}</p>
        </div>
        <div class="event-summary-item">
          <p class="event-summary-label">Total Students</p>
          <p class="event-summary-value">{{ eventDetail.id ? eventDetail.totalStudent : '-' }}</p>
        </div>
        <div class="event-summary-item">
          <p class="event-summary-label">Slots Remaining</p>
          <p class="event-summary-value">{{ eventDetail.id ? formatSlotsRemaining(eventDetail.slotsRemaining, eventDetail.slotLimit) : '-' }}</p>
        </div>
        <div class="event-summary-item">
          <p class="event-summary-label">Is Full</p>
          <p class="event-summary-value">{{ eventDetail.id ? formatIsFull(eventDetail.isFull, eventDetail.slotLimit) : '-' }}</p>
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
        :data="pagedEventList"
        border
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="Event" prop="eventName" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="Organizer" prop="organizer" :show-overflow-tooltip="true" min-width="160" />
        <el-table-column label="Media" min-width="140">
          <template #default="scope">
            <div class="media-cell">
              <el-image
                v-if="isImageUrl(scope.row.imageUrl)"
                :src="scope.row.imageUrl"
                class="media-thumb"
                fit="cover"
                :preview-teleported="true"
                :hide-on-click-modal="true"
                :z-index="10000"
                :preview-src-list="[scope.row.imageUrl]"
              />
              <span v-else>-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Date / Time" min-width="240">
          <template #default="scope">
            <div class="event-date">{{ formatEventDate(scope.row.eventDate) }}</div>
            <div class="event-time">{{ formatEventTime(scope.row.eventDate) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Slot Limit" prop="slotLimit" min-width="110">
          <template #default="scope">{{ formatSlotLimit(scope.row.slotLimit) }}</template>
        </el-table-column>
        <el-table-column label="Total Students" prop="totalStudent" min-width="130" />
        <el-table-column label="Slots Remaining" prop="slotsRemaining" min-width="130">
          <template #default="scope">{{ formatSlotsRemaining(scope.row.slotsRemaining, scope.row.slotLimit) }}</template>
        </el-table-column>
        <el-table-column label="Full" prop="isFull" min-width="90">
          <template #default="scope">
            <el-tag v-if="scope.row.isFull" type="danger">Yes</el-tag>
            <el-tag v-else type="success">No</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Status" prop="status" min-width="130">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">{{ getStatusLabel(scope.row.status) }}</el-tag>
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
          <el-select v-model="addForm.organizer" placeholder="Select organizer" filterable allow-create style="width: 100%">
            <el-option v-for="org in organizerOptions" :key="org.value" :label="org.label" :value="org.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Venue" prop="venue">
          <el-input v-model="addForm.venue" placeholder="Enter venue" />
        </el-form-item>
        <el-form-item label="Date / Time" prop="eventDate">
          <el-date-picker
            v-model="addForm.eventDate"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm"
            placeholder="Select date/time"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Slot Limit" prop="slotLimit">
          <el-input v-model="addForm.slotLimit" type="number" clearable placeholder="Leave empty for unlimited" />
        </el-form-item>
        <el-form-item label="Description" prop="description">
          <el-input v-model="addForm.description" type="textarea" :autosize="{ minRows: 4, maxRows: 8 }" placeholder="Enter description" />
        </el-form-item>
        <el-form-item label="Media">
          <el-upload
            class="upload-block"
            action="#"
            :auto-upload="false"
            :file-list="addUploadFileList"
            :limit="1"
            accept="image/*"
            :on-change="handleAddUploadChange"
            :on-remove="handleAddUploadRemove"
          >
            <el-button type="primary" icon="Upload">Select Image</el-button>
            <template #tip>
              <div class="el-upload__tip">Supports image files.</div>
            </template>
          </el-upload>
          <div v-if="addMediaPreviewUrl" class="media-preview">
            <el-image
              v-if="addMediaPreviewIsImage"
              :src="addMediaPreviewUrl"
              class="media-thumb"
              fit="cover"
              :preview-teleported="true"
              :hide-on-click-modal="true"
              :z-index="10000"
              :preview-src-list="[addMediaPreviewUrl]"
            />
          </div>
        </el-form-item>
        <el-form-item label="Status" prop="status">
          <el-select v-model="addForm.status" placeholder="Select status">
            <el-option v-for="status in statusOptions" :key="status.value" :label="status.label" :value="status.value" />
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
                <el-select v-model="form.organizer" placeholder="Select organizer" filterable allow-create>
                  <el-option v-for="org in organizerOptions" :key="org.value" :label="org.label" :value="org.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="Venue" prop="venue">
                <el-select v-model="form.venue" placeholder="Select venue">
                  <el-option v-for="venue in venueOptions" :key="venue" :label="venue" :value="venue" />
                </el-select>
              </el-form-item>
            </div>
            <div class="event-form-column">
              <el-form-item label="Date / Time" prop="eventDate">
                <el-date-picker
                  v-model="form.eventDate"
                  type="datetime"
                  value-format="YYYY-MM-DDTHH:mm"
                  placeholder="Select date/time"
                  style="width: 100%"
                />
              </el-form-item>
              <el-form-item label="Slot Limit" prop="slotLimit">
                <el-input v-model="form.slotLimit" type="number" clearable placeholder="Leave empty for unlimited" />
              </el-form-item>
              <el-form-item label="Current Status" prop="status">
                <el-select v-model="form.status" placeholder="Select status">
                  <el-option v-for="status in statusOptions" :key="status.value" :label="status.label" :value="status.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="Media">
                <el-upload
                  class="upload-block"
                  action="#"
                  :auto-upload="false"
                  :file-list="editUploadFileList"
                  :limit="1"
                  accept="image/*"
                  :on-change="handleEditUploadChange"
                  :on-remove="handleEditUploadRemove"
                >
                  <el-button type="primary" icon="Upload">Select Image</el-button>
                  <template #tip>
                    <div class="el-upload__tip">Supports image files.</div>
                  </template>
                </el-upload>
                <div v-if="editMediaPreviewUrl" class="media-preview">
                  <el-image
                    v-if="editMediaPreviewIsImage"
                    :src="editMediaPreviewUrl"
                    class="media-thumb"
                    fit="cover"
                    :preview-teleported="true"
                    :hide-on-click-modal="true"
                    :z-index="10000"
                    :preview-src-list="[editMediaPreviewUrl]"
                  />
                </div>
              </el-form-item>
            </div>
            </div>

            <div class="event-stats-grid">
              <div class="stat-item">
                <span>Slot Limit</span>
                <span>{{ formatSlotLimit(form.slotLimit) }}</span>
              </div>
              <div class="stat-item">
                <span>Total Students</span>
                <span>{{ form.totalStudent }}</span>
              </div>
              <div class="stat-item">
                <span>Slots Remaining</span>
                <span>{{ formatSlotsRemaining(form.slotsRemaining, form.slotLimit) }}</span>
              </div>
              <div class="stat-item">
                <span>Is Full</span>
                <span>{{ formatIsFull(form.isFull, form.slotLimit) }}</span>
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
import { listEvents, addEvent, updateEvent, delEvent, listAdminUsers } from '@/api/admin';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

type EventItem = {
  id: number | string;
  eventName: string;
  organizer: string;
  venue: string;
  eventDate: string;
  slotLimit: number | null | string;
  totalStudent: number;
  slotsRemaining?: number | null;
  isFull?: boolean;
  present?: number;
  absent?: number;
  status: string;
  description: string;
  imageUrl: string;
};

const eventList = ref<EventItem[]>([]);
const allEventList = ref<EventItem[]>([]);
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
  eventDate: '',
  slotLimit: null,
  totalStudent: 0,
  slotsRemaining: null,
  isFull: false,
  present: 0,
  absent: 0,
  status: '',
  description: '',
  imageUrl: ''
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
  eventDate: '',
  slotLimit: null,
  totalStudent: 0,
  slotsRemaining: null,
  isFull: false,
  present: 0,
  absent: 0,
  status: '',
  description: '',
  imageUrl: ''
});
const validateSlotLimit = (_rule: any, value: any, callback: (error?: Error) => void) => {
  if (value === '' || value === null || value === undefined) {
    callback();
    return;
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    callback(new Error('Slot limit must be a positive integer'));
    return;
  }
  callback();
};
const normalizeSlotLimitValue = (value: EventItem['slotLimit']) => {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};
const addRules = {
  eventName: [{ required: true, message: 'Event is required', trigger: 'blur' }],
  organizer: [{ required: true, message: 'Organizer is required', trigger: 'blur' }],
  venue: [{ required: true, message: 'Venue is required', trigger: 'blur' }],
  eventDate: [{ required: true, message: 'Date/Time is required', trigger: 'change' }],
  slotLimit: [{ validator: validateSlotLimit, trigger: 'blur' }],
  description: [{ required: true, message: 'Description is required', trigger: 'blur' }],
  status: [{ required: true, message: 'Status is required', trigger: 'change' }]
};

const addUploadFileList = ref<any[]>([]);
const addUploadFile = ref<File | null>(null);
const addUploadPreviewUrl = ref('');
const addUploadPreviewType = ref('');

const editUploadFileList = ref<any[]>([]);
const editUploadFile = ref<File | null>(null);
const editUploadPreviewUrl = ref('');
const editUploadPreviewType = ref('');

const organizerOptions = ref<Array<{label: string; value: string}>>([]);
const venueOptions = ref(['LT A1.17', 'LT B2.05', 'Field B2', 'Auditorium C3']);
const statusOptions = ref([
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Happening Today', value: 'happening_today' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
]);
const form = ref<EventItem>({
  id: '',
  eventName: '',
  organizer: '',
  venue: '',
  eventDate: '',
  slotLimit: null,
  totalStudent: 0,
  slotsRemaining: null,
  isFull: false,
  present: 0,
  absent: 0,
  status: '',
  description: '',
  imageUrl: ''
});

const rules = {
  eventName: [{ required: true, message: 'Event is required', trigger: 'change' }],
  organizer: [{ required: true, message: 'Organizer is required', trigger: 'change' }],
  venue: [{ required: true, message: 'Venue is required', trigger: 'change' }],
  eventDate: [{ required: true, message: 'Date/Time is required', trigger: 'change' }],
  slotLimit: [{ validator: validateSlotLimit, trigger: 'blur' }],
  status: [{ required: true, message: 'Status is required', trigger: 'change' }]
};

// Query parameters
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  keyword: ''
});

const isFiltering = computed(() => {
  return !!queryParams.value.keyword || !!dateRange.value?.[0] || !!dateRange.value?.[1];
});

// 前端关键字过滤（不区分大小写）
const filteredEventList = computed(() => {
  let result = isFiltering.value ? allEventList.value : eventList.value;
  
  // 关键字搜索（不区分大小写）
  if (queryParams.value.keyword) {
    const keyword = queryParams.value.keyword.toLowerCase();
    result = result.filter(event => {
      return (
        (event.eventName && event.eventName.toLowerCase().includes(keyword)) ||
        (event.organizer && event.organizer.toLowerCase().includes(keyword)) ||
        (event.venue && event.venue.toLowerCase().includes(keyword)) ||
        (event.description && event.description.toLowerCase().includes(keyword)) ||
        (event.status && event.status.toLowerCase().includes(keyword))
      );
    });
  }
  
  if (dateRange.value?.[0] || dateRange.value?.[1]) {
    const start = dateRange.value[0] ? new Date(dateRange.value[0]) : null;
    const end = dateRange.value[1] ? new Date(dateRange.value[1]) : null;
    if (end) {
      end.setHours(23, 59, 59, 999);
    }
    result = result.filter(event => {
      if (!event.eventDate) return false;
      const eventTime = new Date(event.eventDate);
      if (Number.isNaN(eventTime.getTime())) return false;
      if (start && eventTime < start) return false;
      if (end && eventTime > end) return false;
      return true;
    });
  }

  return result;
});

const pagedEventList = computed(() => {
  if (!isFiltering.value) return filteredEventList.value;
  const start = (queryParams.value.pageNum - 1) * queryParams.value.pageSize;
  return filteredEventList.value.slice(start, start + queryParams.value.pageSize);
});

const isImageUrl = (value?: string) => {
  if (!value) return false;
  const lower = value.toLowerCase();
  return lower.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|bmp)(\?|#|$)/.test(lower);
};

const addMediaPreviewUrl = computed(() => addUploadPreviewUrl.value || addForm.value.imageUrl || '');
const editMediaPreviewUrl = computed(() => editUploadPreviewUrl.value || form.value.imageUrl || '');

const addMediaPreviewIsImage = computed(() => {
  if (addUploadPreviewUrl.value) {
    return addUploadPreviewType.value.startsWith('image/');
  }
  return isImageUrl(addForm.value.imageUrl);
});

const editMediaPreviewIsImage = computed(() => {
  if (editUploadPreviewUrl.value) {
    return editUploadPreviewType.value.startsWith('image/');
  }
  return isImageUrl(form.value.imageUrl);
});

const normalizeEventStatus = (status?: string) => {
  if (!status) return '';
  if (status === 'in_progress') return 'happening_today';
  return status;
};

const statusLabelMap: Record<string, string> = {
  upcoming: 'Upcoming',
  happening_today: 'Happening Today',
  completed: 'Completed',
  cancelled: 'Cancelled',
  in_progress: 'In Progress'
};

const getStatusLabel = (status?: string) => statusLabelMap[status || ''] || status || '-';

const getStatusTagType = (status?: string) => {
  const value = normalizeEventStatus(status);
  if (value === 'upcoming') return 'info';
  if (value === 'happening_today' || value === 'in_progress') return 'warning';
  if (value === 'completed') return 'success';
  if (value === 'cancelled') return 'danger';
  return 'info';
};

const isAllowedUpload = (file: File) => {
  const type = (file.type || '').toLowerCase();
  if (type.startsWith('image/')) return true;
  const name = (file.name || '').toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp)$/.test(name);
};

const resetAddUploadState = () => {
  if (addUploadPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(addUploadPreviewUrl.value);
  }
  addUploadFileList.value = [];
  addUploadFile.value = null;
  addUploadPreviewUrl.value = '';
  addUploadPreviewType.value = '';
};

const resetEditUploadState = () => {
  if (editUploadPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(editUploadPreviewUrl.value);
  }
  editUploadFileList.value = [];
  editUploadFile.value = null;
  editUploadPreviewUrl.value = '';
  editUploadPreviewType.value = '';
};

const handleAddUploadChange = (file: any, fileList: any[]) => {
  const rawFile = file?.raw as File | undefined;
  if (!rawFile) return;
  if (!isAllowedUpload(rawFile)) {
    proxy?.$modal?.msgError?.('Only image files are allowed.');
    resetAddUploadState();
    return;
  }
  if (addUploadPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(addUploadPreviewUrl.value);
  }
  addUploadFile.value = rawFile;
  addUploadPreviewUrl.value = URL.createObjectURL(rawFile);
  addUploadPreviewType.value = rawFile.type || '';
  addUploadFileList.value = fileList.slice(-1);
};

const handleAddUploadRemove = () => {
  resetAddUploadState();
};

const handleEditUploadChange = (file: any, fileList: any[]) => {
  const rawFile = file?.raw as File | undefined;
  if (!rawFile) return;
  if (!isAllowedUpload(rawFile)) {
    proxy?.$modal?.msgError?.('Only image files are allowed.');
    resetEditUploadState();
    return;
  }
  if (editUploadPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(editUploadPreviewUrl.value);
  }
  editUploadFile.value = rawFile;
  editUploadPreviewUrl.value = URL.createObjectURL(rawFile);
  editUploadPreviewType.value = rawFile.type || '';
  editUploadFileList.value = fileList.slice(-1);
};

const handleEditUploadRemove = () => {
  resetEditUploadState();
};

const formatEventDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatEventTime = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const formatSlotLimit = (value: EventItem['slotLimit']) => {
  if (value === '' || value === null || value === undefined) return 'Unlimited';
  const num = Number(value);
  return Number.isNaN(num) ? '-' : String(num);
};

const formatSlotsRemaining = (value: EventItem['slotsRemaining'], slotLimit: EventItem['slotLimit']) => {
  if (slotLimit === '' || slotLimit === null || slotLimit === undefined) return 'Unlimited';
  if (value === null || value === undefined) return '-';
  return String(value);
};

const formatIsFull = (value?: boolean, slotLimit?: EventItem['slotLimit']) => {
  if (slotLimit === '' || slotLimit === null || slotLimit === undefined) return 'No';
  return value ? 'Yes' : 'No';
};

const populateMockData = (): EventItem[] => [
  {
    id: 1,
    eventName: 'Coding Workshop',
    organizer: 'ICT Department',
    venue: 'LT A1.17',
    eventDate: '2025-10-11T12:00',
    slotLimit: 300,
    totalStudent: 213,
    slotsRemaining: 87,
    isFull: false,
    present: 205,
    absent: 8,
    status: 'upcoming',
    description: 'Introductory workshop for new coders.',
    imageUrl: ''
  },
  {
    id: 2,
    eventName: 'Baseball Trial',
    organizer: 'Baseball Club',
    venue: 'Field B2',
    eventDate: '2025-10-08T09:00',
    slotLimit: null,
    totalStudent: 213,
    slotsRemaining: null,
    isFull: false,
    present: 205,
    absent: 8,
    status: 'happening_today',
    description: 'Open tryouts for the baseball team.',
    imageUrl: ''
  },
  {
    id: 3,
    eventName: 'Dance Club Entry Audition',
    organizer: 'Dance Club',
    venue: 'Auditorium C3',
    eventDate: '2025-10-02T19:00',
    slotLimit: 250,
    totalStudent: 213,
    slotsRemaining: 37,
    isFull: false,
    present: 205,
    absent: 8,
    status: 'completed',
    description: 'Auditions for new dance club members.',
    imageUrl: ''
  }
];

const normalizeEvent = (item: any): EventItem => ({
  id: item.id,
  eventName: item.name || item.title || '',
  organizer: item.organizer || '',
  venue: item.venue || item.location || '',
  eventDate: item.event_date || item.start_time || item.start_date || '',
  slotLimit: item.slot_limit ?? null,
  totalStudent: item.total_student || item.total_participants || 0,
  slotsRemaining: item.slots_remaining ?? null,
  isFull: item.is_full ?? false,
  present: item.present_student || item.present_count || 0,
  absent: item.absent_student || item.absent_count || 0,
  status: normalizeEventStatus(item.status || 'upcoming'),
  description: item.description || '',
  imageUrl: item.image_url || item.imageUrl || ''
});

const buildEventQuery = () => {
  const params: Record<string, any> = {
    page: queryParams.value.pageNum,
    page_size: queryParams.value.pageSize
  };
  if (dateRange.value[0]) params.event_date__gte = dateRange.value[0];
  if (dateRange.value[1]) params.event_date__lte = dateRange.value[1];
  return params;
};

const fetchAllEvents = async () => {
  const results: EventItem[] = [];
  let page = 1;
  const pageSize = queryParams.value.pageSize || 10;
  let totalCount: number | null = null;
  const baseParams = buildEventQuery();

  while (true) {
    const payload: any = await listEvents({ ...baseParams, page });
    const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
    const count = payload?.data?.count ?? payload?.count;
    if (typeof count === 'number') totalCount = count;
    if (!Array.isArray(rows) || rows.length === 0) break;
    results.push(...rows.map(normalizeEvent));
    if (totalCount !== null && results.length >= totalCount) break;
    if (rows.length < pageSize) break;
    page += 1;
    if (page > 200) break;
  }

  return results;
};

/** Query event list */
const getList = async () => {
  loading.value = true;
  try {
    if (isFiltering.value) {
      allEventList.value = await fetchAllEvents();
      eventList.value = [];
      total.value = filteredEventList.value.length;
    } else {
      allEventList.value = [];
      const params = buildEventQuery();
      const payload: any = await listEvents(params);
      const pagination = payload?.data?.pagination ?? payload?.pagination;
      const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
      
      eventList.value = Array.isArray(rows) ? rows.map(normalizeEvent) : [];
      total.value = pagination?.total_items ?? payload?.count ?? eventList.value.length ?? 0;
    }
  } catch (error: any) {
    eventList.value = [];
    allEventList.value = [];
    total.value = 0;
    proxy?.$modal?.msgError?.(error?.message || 'Failed to load events');
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
    eventDate: '',
    slotLimit: null,
    totalStudent: 0,
    slotsRemaining: null,
    isFull: false,
    present: 0,
    absent: 0,
    status: 'upcoming',
    description: '',
    imageUrl: ''
  };
  resetAddUploadState();
  addDialogVisible.value = true;
};

/** Edit button action */
const handleUpdate = (row?: any) => {
  const target = row || eventList.value.find((item) => item.id === ids.value[0]);
  if (!target) {
    proxy?.$modal.msgWarning('Please select an event to edit.');
    return;
  }
  form.value = { ...target, status: normalizeEventStatus(target.status) };
  resetEditUploadState();
  openDrawer('Edit Event Information');
};

/** Submit button */
const submitForm = () => {
  eventFormRef.value?.validate(async (valid) => {
    if (!valid) return;
    try {
      const slotLimitValue = normalizeSlotLimitValue(form.value.slotLimit);
      if (editUploadFile.value) {
        const eventData = new FormData();
        eventData.append('title', form.value.eventName || '');
        eventData.append('message', form.value.eventName || '');
        eventData.append('organizer', form.value.organizer || '');
        eventData.append('venue', form.value.venue || '');
        eventData.append('event_date', form.value.eventDate || '');
        eventData.append('status', form.value.status || '');
        eventData.append('description', form.value.description || '');
        if (slotLimitValue !== null) {
          eventData.append('slot_limit', String(slotLimitValue));
        }
        eventData.append('upload_image', editUploadFile.value);
        await updateEvent(form.value.id, eventData);
      } else {
        await updateEvent(form.value.id, {
          title: form.value.eventName || '',
          message: form.value.eventName || '',
          organizer: form.value.organizer || '',
          venue: form.value.venue || '',
          event_date: form.value.eventDate || '',
          status: form.value.status || '',
          description: form.value.description || '',
          slot_limit: slotLimitValue
        });
      }
      proxy?.$modal.msgSuccess('Event updated successfully');
      drawerVisible.value = false;
      await getList();
    } catch (error: any) {
      proxy?.$modal.msgError(error?.message || 'Operation failed');
    }
  });
};

/** Submit Add dialog */
const submitAdd = () => {
  addFormRef.value?.validate(async (valid) => {
    if (!valid) return;
    try {
      const slotLimitValue = normalizeSlotLimitValue(addForm.value.slotLimit);
      if (addUploadFile.value) {
        const eventData = new FormData();
        eventData.append('title', addForm.value.eventName || '');
        eventData.append('message', addForm.value.eventName || '');
        eventData.append('organizer', addForm.value.organizer || '');
        eventData.append('venue', addForm.value.venue || '');
        eventData.append('event_date', addForm.value.eventDate || '');
        eventData.append('status', addForm.value.status || '');
        eventData.append('description', addForm.value.description || '');
        if (slotLimitValue !== null) {
          eventData.append('slot_limit', String(slotLimitValue));
        }
        eventData.append('upload_image', addUploadFile.value);
        await addEvent(eventData);
      } else {
        await addEvent({
          title: addForm.value.eventName || '',
          message: addForm.value.eventName || '',
          organizer: addForm.value.organizer || '',
          venue: addForm.value.venue || '',
          event_date: addForm.value.eventDate || '',
          status: addForm.value.status || '',
          description: addForm.value.description || '',
          slot_limit: slotLimitValue
        });
      }
      proxy?.$modal.msgSuccess('Event added successfully');
      addDialogVisible.value = false;
      await getList();
    } catch (error: any) {
      proxy?.$modal.msgError(error?.message || 'Operation failed');
    }
  });
};

/** Cancel Add dialog */
const cancelAdd = () => {
  addDialogVisible.value = false;
  addFormRef.value?.resetFields();
  resetAddUploadState();
};

/** Delete button action */
const handleDelete = async (row?: any) => {
  const eventIds = row?.id || ids.value;
  await proxy?.$modal.confirm('Are you sure you want to delete event ID "' + eventIds + '"?');
  try {
    if (Array.isArray(eventIds)) {
      for (const id of eventIds) {
        await delEvent(id);
      }
    } else {
      await delEvent(eventIds);
    }
    await getList();
    proxy?.$modal.msgSuccess('Delete successful');
  } catch (error: any) {
    proxy?.$modal.msgError(error?.message || 'Delete failed');
  }
};

const cancel = () => {
  drawerVisible.value = false;
  resetEditUploadState();
};

/** 加载组织者选项（从后端获取用户列表） */
const loadOrganizerOptions = async () => {
  try {
    const payload: any = await listAdminUsers({ page_size: 100 });
    const users = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
    
    // 生成组织者选项：使用用户全名
    const userOptions = Array.isArray(users) ? users.map((user: any) => {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;
      return {
        label: fullName,
        value: fullName
      };
    }) : [];
    
    // 添加一些默认组织/部门选项
    const defaultOrgs = [
      { label: 'ICT Department', value: 'ICT Department' },
      { label: 'Student Affairs', value: 'Student Affairs' },
      { label: 'Academic Office', value: 'Academic Office' }
    ];
    
    organizerOptions.value = [...defaultOrgs, ...userOptions];
  } catch (error) {
    console.error('Failed to load organizer options:', error);
    // 如果加载失败，使用默认选项
    organizerOptions.value = [
      { label: 'ICT Department', value: 'ICT Department' },
      { label: 'Student Affairs', value: 'Student Affairs' },
      { label: 'Academic Office', value: 'Academic Office' }
    ];
  }
};

onMounted(() => {
  getList();
  loadOrganizerOptions();
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

.media-cell {
  display: flex;
  align-items: center;
  min-height: 40px;
}

.media-preview {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.media-thumb {
  width: 72px;
  height: 48px;
  border-radius: 6px;
  overflow: hidden;
  background: #f3f4f6;
}


.upload-block {
  width: 100%;
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

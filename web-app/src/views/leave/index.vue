<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="Search" prop="keyword">
              <el-input v-model="queryParams.keyword" placeholder="Search by applicant name, reason..." clearable style="width: 300px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="Status" prop="status">
              <el-select v-model="queryParams.status" placeholder="Select status" clearable>
                <el-option label="Pending" value="pending" />
                <el-option label="Approved" value="approved" />
                <el-option label="Rejected" value="rejected" />
              </el-select>
            </el-form-item>
            <el-form-item label="Date Range" style="width: 308px">
              <el-date-picker
                v-model="dateRange"
                value-format="YYYY-MM-DD"
                type="daterange"
                range-separator="-"
                start-placeholder="Start"
                end-placeholder="End"
              />
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
            <el-button type="success" plain :disabled="single" icon="Edit" @click="handleUpdate()">Edit</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain :disabled="multiple" icon="Delete" @click="handleDelete()">Delete</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table class="attendify-table" ref="leaveTableRef" v-loading="loading" :data="pagedLeaveList" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="Applicant" prop="applicant" :show-overflow-tooltip="true" min-width="160" />
        <el-table-column label="Start Date" prop="startDate" min-width="120" />
        <el-table-column label="End Date" prop="endDate" min-width="120" />
        <el-table-column label="Reason" prop="reason" :show-overflow-tooltip="true" min-width="150" />
        <el-table-column label="Description" prop="description" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="Status" prop="status" min-width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'approved'" type="success">Approved</el-tag>
            <el-tag v-else-if="scope.row.status === 'rejected'" type="danger">Rejected</el-tag>
            <el-tag v-else type="warning">Pending</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Created At" prop="createdAt" min-width="160" />
        <el-table-column label="Actions" width="200" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="View" @click="handleView(scope.row)">View</el-button>
            <el-button link type="success" icon="Check" @click="handleApprove(scope.row)" :disabled="scope.row.status !== 'pending'">Approve</el-button>
            <el-button link type="danger" icon="Close" @click="handleReject(scope.row)" :disabled="scope.row.status !== 'pending'">Reject</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- Add/Edit Leave Dialog -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" append-to-body>
      <el-form ref="leaveFormRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="Start Date" prop="startDate">
          <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" placeholder="Select start date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="End Date" prop="endDate">
          <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" placeholder="Select end date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Reason" prop="reason">
          <el-select v-model="form.reason" placeholder="Select reason" style="width: 100%">
            <el-option label="Medical Leave" value="Medical Leave" />
            <el-option label="Personal Leave" value="Personal Leave" />
            <el-option label="Family Emergency" value="Family Emergency" />
            <el-option label="Other" value="Other" />
          </el-select>
        </el-form-item>
        <el-form-item label="Description" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="Enter description" />
        </el-form-item>
        <el-form-item label="Document">
          <el-upload class="upload-block" action="#" :auto-upload="false" :file-list="fileList" :limit="1" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg">
            <el-button type="primary" icon="Upload">Upload Document</el-button>
            <template #tip>
              <div class="el-upload__tip">Supports pdf/doc/image files up to 5MB.</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">Submit</el-button>
          <el-button @click="dialogVisible = false">Cancel</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- View Leave Dialog -->
    <el-dialog title="Leave Request Details" v-model="viewDialogVisible" width="500px" append-to-body>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="Applicant">{{ viewData.applicant }}</el-descriptions-item>
        <el-descriptions-item label="Start Date">{{ viewData.startDate }}</el-descriptions-item>
        <el-descriptions-item label="End Date">{{ viewData.endDate }}</el-descriptions-item>
        <el-descriptions-item label="Reason">{{ viewData.reason }}</el-descriptions-item>
        <el-descriptions-item label="Description">{{ viewData.description }}</el-descriptions-item>
        <el-descriptions-item label="Status">
          <el-tag v-if="viewData.status === 'approved'" type="success">Approved</el-tag>
          <el-tag v-else-if="viewData.status === 'rejected'" type="danger">Rejected</el-tag>
          <el-tag v-else type="warning">Pending</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Remarks">{{ viewData.remarks || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Created At">{{ viewData.createdAt }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" :disabled="!viewData.documentUrl" @click="handleViewDocument">View Document</el-button>
        <el-button @click="viewDialogVisible = false">Close</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="LeaveRequests" lang="ts">
import { listLeaveRequests, addLeaveRequest, updateLeaveRequest, delLeaveRequest, listAdminUsers, getSecureDocumentUrl } from '@/api/admin';
import { useUserStore } from '@/store/modules/user';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const userStore = useUserStore();

interface LeaveRow {
  id: number | string;
  userId: number;
  applicant: string;
  startDate: string;
  endDate: string;
  reason: string;
  description: string;
  documentUrl: string;
  status: string;
  remarks: string;
  createdAt: string;
}

const leaveList = ref<LeaveRow[]>([]);
const allLeaveList = ref<LeaveRow[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const dialogTitle = ref('');
const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const dateRange = ref<[DateModelType, DateModelType]>(['', '']);
const fileList = ref<any[]>([]);

const queryFormRef = ref<ElFormInstance>();
const leaveFormRef = ref<ElFormInstance>();
const leaveTableRef = ref<ElTableInstance>();

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  status: ''
});

const isFiltering = computed(() => {
  return (
    !!queryParams.value.keyword ||
    !!queryParams.value.status ||
    !!dateRange.value?.[0] ||
    !!dateRange.value?.[1]
  );
});

// 前端关键字过滤（不区分大小写）
const filteredLeaveList = computed(() => {
  let result = isFiltering.value ? allLeaveList.value : leaveList.value;
  
  // 关键字搜索（不区分大小写）
  if (queryParams.value.keyword) {
    const keyword = queryParams.value.keyword.toLowerCase();
    result = result.filter(leave => {
      return (
        (leave.applicant && leave.applicant.toLowerCase().includes(keyword)) ||
        (leave.reason && leave.reason.toLowerCase().includes(keyword)) ||
        (leave.description && leave.description.toLowerCase().includes(keyword))
      );
    });
  }
  
  // 状态过滤
  if (queryParams.value.status) {
    result = result.filter(leave => leave.status === queryParams.value.status);
  }

  if (dateRange.value?.[0] || dateRange.value?.[1]) {
    const start = dateRange.value[0] ? new Date(dateRange.value[0]) : null;
    const end = dateRange.value[1] ? new Date(dateRange.value[1]) : null;
    if (end) {
      end.setHours(23, 59, 59, 999);
    }
    result = result.filter(leave => {
      const leaveStart = leave.startDate ? new Date(leave.startDate) : null;
      const leaveEnd = leave.endDate ? new Date(leave.endDate) : null;
      if (start && (!leaveStart || Number.isNaN(leaveStart.getTime()) || leaveStart < start)) return false;
      if (end && (!leaveEnd || Number.isNaN(leaveEnd.getTime()) || leaveEnd > end)) return false;
      return true;
    });
  }
  
  return result;
});

const pagedLeaveList = computed(() => {
  if (!isFiltering.value) return filteredLeaveList.value;
  const start = (queryParams.value.pageNum - 1) * queryParams.value.pageSize;
  return filteredLeaveList.value.slice(start, start + queryParams.value.pageSize);
});

const form = ref<any>({});
const viewData = ref<LeaveRow>({} as LeaveRow);
const userOptions = ref<Array<{id: number, name: string, email: string}>>([]);

const rules = {
  startDate: [{ required: true, message: 'Start date is required', trigger: 'change' }],
  endDate: [{ required: true, message: 'End date is required', trigger: 'change' }],
  reason: [{ required: true, message: 'Reason is required', trigger: 'change' }]
};

const normalizeLeave = (item: any): LeaveRow => {
  // 线上后端可能返回 user ID 或嵌套的 user_details
  let userInfo = item?.user_details ?? item?.user;
  
  // 如果后端只返回 ID，从已加载的选项中查找
  if (typeof userInfo === 'number') {
    const found = userOptions.value.find(u => u.id === userInfo);
    userInfo = found ? { id: found.id, name: found.name, email: found.email } : {};
  }
  
  const user = userInfo ?? {};
  const fullName = user?.name || 
    (typeof user === 'object' ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username : '') ||
    item?.applicant_name || item?.student_name || '-';
  return {
    id: item.id,
    userId: item.user || user.id,
    applicant: fullName || '-',
    startDate: item.start_date || '',
    endDate: item.end_date || '',
    reason: item.reason || '',
    description: item.description || '',
    documentUrl: item.document_path || item.documentPath || item.document_url || '',
    status: item.status || 'pending',
    remarks: item.remarks || '',
    createdAt: item.created_at ? new Date(item.created_at).toLocaleString() : ''
  };
};

const fetchAllLeaveRequests = async () => {
  const results: LeaveRow[] = [];
  let page = 1;
  const pageSize = queryParams.value.pageSize || 10;
  let totalCount: number | null = null;

  while (true) {
    const params: Record<string, any> = { page };
    if (queryParams.value.status) params.status = queryParams.value.status;
    if (dateRange.value[0]) params.start_date__gte = dateRange.value[0];
    if (dateRange.value[1]) params.end_date__lte = dateRange.value[1];

    const payload: any = await listLeaveRequests(params);
    const rows = payload?.results ?? payload?.data?.results ?? payload?.data ?? payload ?? [];
    const count = payload?.count ?? payload?.data?.count;
    if (typeof count === 'number') totalCount = count;
    if (!Array.isArray(rows) || rows.length === 0) break;
    results.push(...rows.map(normalizeLeave));
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
      allLeaveList.value = await fetchAllLeaveRequests();
      leaveList.value = [];
      total.value = filteredLeaveList.value.length;
    } else {
      allLeaveList.value = [];
      const params: Record<string, any> = {
        page: queryParams.value.pageNum,
        page_size: queryParams.value.pageSize
      };
      if (queryParams.value.status) params.status = queryParams.value.status;
      if (dateRange.value[0]) params.start_date__gte = dateRange.value[0];
      if (dateRange.value[1]) params.end_date__lte = dateRange.value[1];

      const payload: any = await listLeaveRequests(params);
      const pagination = payload?.pagination ?? payload?.data?.pagination;
      const rows = payload?.results ?? payload?.data?.results ?? [];
      leaveList.value = Array.isArray(rows) ? rows.map(normalizeLeave) : [];
      total.value = pagination?.total_items ?? payload?.count ?? leaveList.value.length;
    }
  } catch (error: any) {
    leaveList.value = [];
    allLeaveList.value = [];
    total.value = 0;
    proxy?.$modal?.msgError?.(error?.message || 'Failed to load leave requests');
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

const resetQuery = () => {
  dateRange.value = ['', ''];
  queryFormRef.value?.resetFields();
  queryParams.value.pageNum = 1;
  getList();
};

const handleSelectionChange = (selection: any[]) => {
  ids.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
  single.value = selection.length !== 1;
};

const handleAdd = () => {
  form.value = { startDate: '', endDate: '', reason: '', description: '' };
  fileList.value = [];
  dialogTitle.value = 'Apply Leave';
  dialogVisible.value = true;
};

const handleUpdate = (row?: any) => {
  const target = row || leaveList.value.find((item) => item.id === ids.value[0]);
  if (!target) return;
  form.value = {
    id: target.id,
    startDate: target.startDate,
    endDate: target.endDate,
    reason: target.reason,
    description: target.description
  };
  fileList.value = [];
  dialogTitle.value = 'Edit Leave Request';
  dialogVisible.value = true;
};

const handleView = (row: LeaveRow) => {
  viewData.value = row;
  viewDialogVisible.value = true;
};

const handleViewDocument = async () => {
  if (!viewData.value?.id) {
    proxy?.$modal?.msgWarning?.('No leave record selected.');
    return;
  }
  if (!viewData.value?.documentUrl) {
    proxy?.$modal?.msgWarning?.('No document attached.');
    return;
  }
  if (/^https?:\/\//i.test(viewData.value.documentUrl)) {
    window.open(viewData.value.documentUrl, '_blank');
    return;
  }
  try {
    const payload: any = await getSecureDocumentUrl({ id: viewData.value.id, type: 'leave' });
    const url = payload?.url || payload?.document_url || payload?.data?.url;
    if (!url) {
      proxy?.$modal?.msgError?.('Failed to get document link.');
      return;
    }
    window.open(url, '_blank');
  } catch (error: any) {
    proxy?.$modal?.msgError?.(error?.message || 'Failed to get document link.');
  }
};

const handleApprove = async (row: LeaveRow) => {
  await proxy?.$modal.confirm('Are you sure you want to approve this leave request?');
  try {
    await updateLeaveRequest(row.id, { status: 'approved' });
    proxy?.$modal.msgSuccess('Leave request approved');
    await getList();
  } catch (error: any) {
    proxy?.$modal.msgError(error?.message || 'Failed to approve');
  }
};

const handleReject = async (row: LeaveRow) => {
  await proxy?.$modal.confirm('Are you sure you want to reject this leave request?');
  try {
    await updateLeaveRequest(row.id, { status: 'rejected' });
    proxy?.$modal.msgSuccess('Leave request rejected');
    await getList();
  } catch (error: any) {
    proxy?.$modal.msgError(error?.message || 'Failed to reject');
  }
};

const submitForm = () => {
  leaveFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    
    // 验证用户ID有效性
    if (!userStore.userId) {
      proxy?.$modal.msgError('请登录后再提交请假申请');
      return;
    }
    
    try {
      const data = {
        start_date: form.value.startDate,
        end_date: form.value.endDate,
        reason: form.value.reason,
        description: form.value.description
      };
      if (form.value.id) {
        await updateLeaveRequest(form.value.id, data);
        proxy?.$modal.msgSuccess('Leave request updated');
      } else {
        // 使用当前登录用户的实际ID
        await addLeaveRequest({ ...data, user: userStore.userId });
        proxy?.$modal.msgSuccess('Leave request submitted');
      }
      dialogVisible.value = false;
      await getList();
    } catch (error: any) {
      proxy?.$modal.msgError(error?.message || 'Operation failed');
    }
  });
};

const handleDelete = async (row?: any) => {
  const deleteIds = row?.id ? [row.id] : ids.value;
  await proxy?.$modal.confirm('Are you sure you want to delete the selected leave request(s)?');
  try {
    for (const id of deleteIds) {
      await delLeaveRequest(id);
    }
    await getList();
    proxy?.$modal.msgSuccess('Delete successful');
  } catch (error: any) {
    proxy?.$modal.msgError(error?.message || 'Delete failed');
  }
};

// 加载用户列表以便根据 user ID 查找用户信息
const loadUserOptions = async () => {
  try {
    const res: any = await listAdminUsers({ page_size: 500 });
    const users = res?.results ?? [];
    userOptions.value = users.map((u: any) => {
      const fullName = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
      return {
        id: u.id,
        name: fullName || u.username || '',
        email: u.email || ''
      };
    });
  } catch (error) {
    console.error('Failed to load user options:', error);
  }
};

onMounted(async () => {
  await loadUserOptions();
  await getList();
});
</script>

<style scoped lang="scss">
.upload-block {
  width: 100%;
}
</style>

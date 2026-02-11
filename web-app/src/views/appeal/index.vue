<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="Search" prop="keyword">
              <el-input v-model="queryParams.keyword" placeholder="Search by student name, ID, session, reason..." clearable style="width: 300px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="Status" prop="status">
              <el-select v-model="queryParams.status" placeholder="Select status" clearable>
                <el-option label="Pending" value="pending" />
                <el-option label="Approved" value="approved" />
                <el-option label="Rejected" value="rejected" />
              </el-select>
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

      <el-table class="attendify-table" ref="appealTableRef" v-loading="loading" :data="pagedAppealList" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="Student" prop="studentName" :show-overflow-tooltip="true" min-width="160" />
        <el-table-column label="Student ID" prop="studentId" min-width="120" />
        <el-table-column label="Session" prop="sessionName" :show-overflow-tooltip="true" min-width="180" />
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

    <!-- Add/Edit Appeal Dialog -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" append-to-body>
      <el-form ref="appealFormRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="Session" prop="session">
          <el-select v-model="form.session" placeholder="Select session" style="width: 100%" filterable>
            <el-option v-for="s in sessionOptions" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Reason" prop="reason">
          <el-select v-model="form.reason" placeholder="Select reason" style="width: 100%">
            <el-option label="Technical Issue" value="Technical Issue" />
            <el-option label="Medical Emergency" value="Medical Emergency" />
            <el-option label="Transportation Issue" value="Transportation Issue" />
            <el-option label="Family Emergency" value="Family Emergency" />
            <el-option label="Other" value="Other" />
          </el-select>
        </el-form-item>
        <el-form-item label="Description" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="Provide details about your appeal" />
        </el-form-item>
        <el-form-item label="Document">
          <el-upload class="upload-block" action="#" :auto-upload="false" :file-list="fileList" :limit="1" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg">
            <el-button type="primary" icon="Upload">Upload Evidence</el-button>
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

    <!-- View Appeal Dialog -->
    <el-dialog title="Appeal Details" v-model="viewDialogVisible" width="500px" append-to-body>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="Student">{{ viewData.studentName }}</el-descriptions-item>
        <el-descriptions-item label="Student ID">{{ viewData.studentId }}</el-descriptions-item>
        <el-descriptions-item label="Session">{{ viewData.sessionName }}</el-descriptions-item>
        <el-descriptions-item label="Reason">{{ viewData.reason }}</el-descriptions-item>
        <el-descriptions-item label="Description">{{ viewData.description }}</el-descriptions-item>
        <el-descriptions-item label="Status">
          <el-tag v-if="viewData.status === 'approved'" type="success">Approved</el-tag>
          <el-tag v-else-if="viewData.status === 'rejected'" type="danger">Rejected</el-tag>
          <el-tag v-else type="warning">Pending</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Created At">{{ viewData.createdAt }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" :disabled="!viewData.documentUrl" @click="handleViewDocument">View Document</el-button>
        <el-button @click="viewDialogVisible = false">Close</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="AttendanceAppeals" lang="ts">
import { listAppeals, addAppeal, updateAppeal, delAppeal, listClassSessions, listAdminStudents, getSecureDocumentUrl } from '@/api/admin';
import { useUserStore } from '@/store/modules/user';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const userStore = useUserStore();

interface AppealRow {
  id: number | string;
  studentId: string;
  studentName: string;
  sessionId: number;
  sessionName: string;
  reason: string;
  description: string;
  documentUrl: string;
  status: string;
  createdAt: string;
}

const appealList = ref<AppealRow[]>([]);
const allAppealList = ref<AppealRow[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const dialogTitle = ref('');
const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const fileList = ref<any[]>([]);
const sessionOptions = ref<Array<{id: number, name: string}>>([]);
const studentOptions = ref<Array<{id: number, name: string, studentId: string}>>([]);
const currentStudentId = ref<number | null>(null);

const queryFormRef = ref<ElFormInstance>();
const appealFormRef = ref<ElFormInstance>();
const appealTableRef = ref<ElTableInstance>();

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  status: ''
});

const isFiltering = computed(() => !!queryParams.value.keyword || !!queryParams.value.status);

// 前端关键字过滤（不区分大小写）
const filteredAppealList = computed(() => {
  let result = isFiltering.value ? allAppealList.value : appealList.value;
  
  // 关键字搜索（不区分大小写）
  if (queryParams.value.keyword) {
    const keyword = queryParams.value.keyword.toLowerCase();
    result = result.filter(appeal => {
      return (
        (appeal.studentName && appeal.studentName.toLowerCase().includes(keyword)) ||
        (appeal.studentId && appeal.studentId.toLowerCase().includes(keyword)) ||
        (appeal.sessionName && appeal.sessionName.toLowerCase().includes(keyword)) ||
        (appeal.reason && appeal.reason.toLowerCase().includes(keyword)) ||
        (appeal.description && appeal.description.toLowerCase().includes(keyword))
      );
    });
  }
  
  // 状态过滤
  if (queryParams.value.status) {
    result = result.filter(appeal => appeal.status === queryParams.value.status);
  }
  
  return result;
});

const pagedAppealList = computed(() => {
  if (!isFiltering.value) return filteredAppealList.value;
  const start = (queryParams.value.pageNum - 1) * queryParams.value.pageSize;
  return filteredAppealList.value.slice(start, start + queryParams.value.pageSize);
});

const form = ref<any>({});
const viewData = ref<AppealRow>({} as AppealRow);

const rules = {
  session: [{ required: true, message: 'Session is required', trigger: 'change' }],
  reason: [{ required: true, message: 'Reason is required', trigger: 'change' }],
  description: [{ required: true, message: 'Description is required', trigger: 'blur' }]
};

const normalizeAppeal = (item: any): AppealRow => {
  // 线上后端可能返回 student_name 字符串，或者嵌套的 student_details，或者只是 ID
  let studentInfo = item?.student_details ?? item?.student;
  let sessionInfo = item?.session_details ?? item?.session;
  
  // 如果后端只返回 ID，从已加载的选项中查找
  if (typeof studentInfo === 'number') {
    const found = studentOptions.value.find(s => s.id === studentInfo);
    studentInfo = found ? { student_id: found.studentId, name: found.name } : {};
  }
  if (typeof sessionInfo === 'number') {
    const found = sessionOptions.value.find(s => s.id === sessionInfo);
    sessionInfo = found ? { id: found.id, name: found.name } : {};
  }
  
  const student = studentInfo ?? {};
  const user = typeof student === 'object' ? (student?.user_details ?? student?.user ?? {}) : {};
  const session = sessionInfo ?? {};
  const module = typeof session === 'object' ? (session?.module ?? {}) : {};
  
  // 优先使用 student.name（从 studentOptions 来），然后是 student_name，否则从 user 中提取
  const fullName = student?.name || item?.student_name || 
    (typeof user === 'object' ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username : '') || 
    '-';
  return {
    id: item.id,
    studentId: student.student_id || '-',
    studentName: fullName || user.username || '-',
    sessionId: item.session || session.id,
    sessionName: `${module.code || ''} - ${session.name || 'Session'}`.trim(),
    reason: item.reason || '',
    description: item.description || '',
    documentUrl: item.document_path || item.documentPath || item.document_url || '',
    status: item.status || 'pending',
    createdAt: item.created_at ? new Date(item.created_at).toLocaleString() : ''
  };
};

const fetchAllAppeals = async () => {
  const results: AppealRow[] = [];
  let page = 1;
  const pageSize = queryParams.value.pageSize || 10;
  let totalCount: number | null = null;

  while (true) {
    const params: Record<string, any> = { page };
    if (queryParams.value.status) params.status = queryParams.value.status;
    const payload: any = await listAppeals(params);
    const rows = payload?.results ?? payload?.data?.results ?? payload?.data ?? payload ?? [];
    const count = payload?.count ?? payload?.data?.count;
    if (typeof count === 'number') totalCount = count;
    if (!Array.isArray(rows) || rows.length === 0) break;
    results.push(...rows.map(normalizeAppeal));
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
      allAppealList.value = await fetchAllAppeals();
      appealList.value = [];
      total.value = filteredAppealList.value.length;
    } else {
      const params: Record<string, any> = {
        page: queryParams.value.pageNum,
        page_size: queryParams.value.pageSize
      };
      // 后端获取所有数据，前端进行过滤
      if (queryParams.value.status) params.status = queryParams.value.status;

      const payload: any = await listAppeals(params);
      const pagination = payload?.pagination;
      const rows = payload?.results ?? [];
      appealList.value = Array.isArray(rows) ? rows.map(normalizeAppeal) : [];
      total.value = pagination?.total_items ?? appealList.value.length;
    }
  } catch (error: any) {
    appealList.value = [];
    allAppealList.value = [];
    total.value = 0;
    proxy?.$modal?.msgError?.(error?.message || 'Failed to load appeals');
  } finally {
    loading.value = false;
  }
};

const loadDropdownOptions = async () => {
  try {
    // Load sessions - AdminClassSessionSerializer 不包含 module_details，只有 module ID
    const sessionsRes: any = await listClassSessions({ page_size: 100 });
    const sessions = sessionsRes?.results ?? [];
    sessionOptions.value = sessions.map((s: any) => ({
      id: s.id,
      name: `${s.name || 'Session ' + s.id} (${s.date || ''})`.trim()
    }));
    
    // Load students
    const studentsRes: any = await listAdminStudents({ page_size: 100 });
    const students = studentsRes?.results ?? [];
    studentOptions.value = students.map((s: any) => {
      const user = s?.user_details ?? {};
      const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
      return {
        id: s.user || user.id,
        name: fullName || user.username,
        studentId: s.student_id
      };
    });
  } catch (error) {
    console.error('Failed to load dropdown options:', error);
  }
};

// 加载当前用户的学生记录
const loadCurrentStudent = async () => {
  if (!userStore.userId) {
    console.warn('User not logged in, cannot load student record');
    return;
  }
  
  try {
    const res: any = await listAdminStudents({ user: userStore.userId });
    const students = res?.results ?? [];
    if (students.length > 0) {
      currentStudentId.value = students[0].id;
    } else {
      currentStudentId.value = null;
      console.warn('No student record found for current user');
    }
  } catch (error) {
    console.error('Failed to load student record:', error);
    currentStudentId.value = null;
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
  form.value = { session: '', reason: '', description: '' };
  fileList.value = [];
  dialogTitle.value = 'Submit Appeal';
  dialogVisible.value = true;
};

const handleUpdate = (row?: any) => {
  const target = row || appealList.value.find((item) => item.id === ids.value[0]);
  if (!target) return;
  form.value = {
    id: target.id,
    session: target.sessionId,
    reason: target.reason,
    description: target.description
  };
  fileList.value = [];
  dialogTitle.value = 'Edit Appeal';
  dialogVisible.value = true;
};

const handleView = (row: AppealRow) => {
  viewData.value = row;
  viewDialogVisible.value = true;
};

const handleViewDocument = async () => {
  if (!viewData.value?.id) {
    proxy?.$modal?.msgWarning?.('No appeal record selected.');
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
    const payload: any = await getSecureDocumentUrl({ id: viewData.value.id, type: 'appeal' });
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

const handleApprove = async (row: AppealRow) => {
  await proxy?.$modal.confirm('Are you sure you want to approve this appeal?');
  try {
    await updateAppeal(row.id, { status: 'approved' });
    proxy?.$modal.msgSuccess('Appeal approved');
    await getList();
  } catch (error: any) {
    proxy?.$modal.msgError(error?.message || 'Failed to approve');
  }
};

const handleReject = async (row: AppealRow) => {
  await proxy?.$modal.confirm('Are you sure you want to reject this appeal?');
  try {
    await updateAppeal(row.id, { status: 'rejected' });
    proxy?.$modal.msgSuccess('Appeal rejected');
    await getList();
  } catch (error: any) {
    proxy?.$modal.msgError(error?.message || 'Failed to reject');
  }
};

const submitForm = () => {
  appealFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    
    // 验证学生记录是否存在（仅新增时需要）
    if (!form.value.id && !currentStudentId.value) {
      proxy?.$modal.msgError('未找到学生记录，请联系管理员');
      return;
    }
    
    try {
      const data = {
        session: form.value.session,
        reason: form.value.reason,
        description: form.value.description
      };
      if (form.value.id) {
        await updateAppeal(form.value.id, data);
        proxy?.$modal.msgSuccess('Appeal updated');
      } else {
        // 使用当前登录学生的记录ID
        await addAppeal({ ...data, student: currentStudentId.value });
        proxy?.$modal.msgSuccess('Appeal submitted');
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
  await proxy?.$modal.confirm('Are you sure you want to delete the selected appeal(s)?');
  try {
    for (const id of deleteIds) {
      await delAppeal(id);
    }
    await getList();
    proxy?.$modal.msgSuccess('Delete successful');
  } catch (error: any) {
    proxy?.$modal.msgError(error?.message || 'Delete failed');
  }
};

onMounted(async () => {
  await loadDropdownOptions();
  await loadCurrentStudent();
  await getList();
});
</script>

<style scoped lang="scss">
.upload-block {
  width: 100%;
}
</style>

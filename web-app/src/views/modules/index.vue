<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="Module Name" prop="moduleName">
              <el-input v-model="queryParams.moduleName" placeholder="Enter module name" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="Module Code" prop="moduleCode">
              <el-input v-model="queryParams.moduleCode" placeholder="Enter module code" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="Status" prop="status">
              <el-select v-model="queryParams.status" placeholder="Select status" clearable>
                <el-option label="Active" value="1" />
                <el-option label="Inactive" value="0" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd()">Add</el-button>
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

      <el-table class="attendify-table" ref="moduleTableRef" v-loading="loading" :data="moduleList" border @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="Module Code" prop="moduleCode" sortable="custom" min-width="140" />
        <el-table-column label="Module Name" prop="moduleName" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="Credit Points" prop="credits" min-width="130" />
        <el-table-column label="Students Enrolled" prop="studentsEnrolled" min-width="160" />
        <el-table-column label="Avg Attendance" prop="avgAttendance" min-width="150">
          <template #default="scope">{{ scope.row.avgAttendance || '0' }}%</template>
        </el-table-column>
        <el-table-column label="Lecturer/Tutor" min-width="220">
          <template #default="scope">
            <div v-for="(name, index) in scope.row.lecturers" :key="name" class="lecturer-row">{{ index + 1 }}. {{ name }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Status" prop="status" sortable="custom" min-width="130">
          <template #default="scope">
            <el-tag v-if="scope.row.status === '1' || scope.row.status === 'Active'" type="success">Active</el-tag>
            <el-tag v-else-if="scope.row.status === '0' || scope.row.status === 'Inactive'" type="danger">Inactive</el-tag>
            <el-tag v-else type="info">Archived</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="160" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" @click.stop="viewModule(scope.row)">View</el-button>
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">Edit</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="total > 0" class="table-footer">
        <span class="results-summary">Showing {{ moduleList.length }} of {{ total }} results</span>
        <pagination v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" float="right" />
      </div>
    </el-card>

    <!-- Add or Edit Module Dialog -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="moduleFormRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="Module Code" prop="moduleCode">
          <el-input v-model="form.moduleCode" placeholder="Enter module code" />
        </el-form-item>
        <el-form-item label="Module Name" prop="moduleName">
          <el-input v-model="form.moduleName" placeholder="Enter module name" />
        </el-form-item>
        <el-form-item label="Description" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="Enter description" />
        </el-form-item>
        <el-form-item label="Attachments">
          <el-upload
            class="upload-block"
            action="#"
            :auto-upload="false"
            :file-list="moduleAttachmentList"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            :before-upload="handleModuleBeforeUpload"
            @change="handleModuleAttachmentChange"
            @remove="handleModuleAttachmentChange"
          >
            <el-button type="primary" icon="Upload">Select Files</el-button>
            <template #tip>
              <div class="el-upload__tip">Supports pdf/doc/image files up to 5MB each.</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="Credit Points" prop="credits">
          <el-input-number v-model="form.credits" :min="0" :max="10" placeholder="Enter credit points" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Status" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="1">Active</el-radio>
            <el-radio label="0">Inactive</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">Submit</el-button>
          <el-button @click="cancel">Cancel</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Modules" lang="ts">
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const router = useRouter();

const moduleList = ref<any[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref('');

const queryFormRef = ref<ElFormInstance>();
const moduleFormRef = ref<ElFormInstance>();
const moduleTableRef = ref<ElTableInstance>();
const moduleAttachmentList = ref<any[]>([]);

// Query parameters
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  moduleName: '',
  moduleCode: '',
  status: ''
});

// Form parameters
const form = ref<any>({});
const rules = {
  moduleCode: [{ required: true, message: 'Module code is required', trigger: 'blur' }],
  moduleName: [{ required: true, message: 'Module name is required', trigger: 'blur' }],
  credits: [{ required: true, message: 'Credit points is required', trigger: 'blur' }],
  status: [{ required: true, message: 'Status is required', trigger: 'change' }]
};

const open = ref(false);

/** Query module list */
const getList = async () => {
  loading.value = true;
  setTimeout(() => {
    moduleList.value = [
      {
        id: 1,
        moduleCode: 'CSIT131',
        moduleName: 'Intro to Python Programming',
        credits: 6,
        studentsEnrolled: 213,
        avgAttendance: 78,
        lecturers: ['Lawrence Long', 'Jamie Oliver'],
        status: 'Inactive'
      },
      {
        id: 2,
        moduleCode: 'CSCI256',
        moduleName: 'Advanced Programming',
        credits: 6,
        studentsEnrolled: 213,
        avgAttendance: 78,
        lecturers: ['Lawrence Long', 'Jamie Oliver'],
        status: 'Inactive'
      },
      {
        id: 3,
        moduleCode: 'CSCI305',
        moduleName: 'Baseball Analytics',
        credits: 6,
        studentsEnrolled: 213,
        avgAttendance: 97.65,
        lecturers: ['ICT Department'],
        status: 'Active'
      },
      {
        id: 4,
        moduleCode: 'DNC101',
        moduleName: 'Dance Club Entry Audition',
        credits: 6,
        studentsEnrolled: 213,
        avgAttendance: 97.65,
        lecturers: ['Dance Club'],
        status: 'Active'
      }
    ];
    total.value = moduleList.value.length;
    loading.value = false;
  }, 400);
};

/** Search button action */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** Reset button action */
const resetQuery = () => {
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

const viewModule = (row: any) => {
  if (!row?.id) return;
  router.push({ name: 'ModuleDetail', params: { moduleId: row.id } });
};

/** Helper: update status for selected modules */
const updateSelectedStatus = (status: string) => {
  if (!ids.value.length) {
    proxy?.$modal.msgWarning?.('Please select at least one module');
    return;
  }
  moduleList.value = moduleList.value.map((item) => {
    if (ids.value.includes(item.id)) {
      return { ...item, status };
    }
    return item;
  });
  proxy?.$modal.msgSuccess('Status updated successfully');
};

/** Mark selected modules as Active */
const markAsActive = () => {
  updateSelectedStatus('Active');
};

/** Mark selected modules as Inactive */
const markAsInactive = () => {
  updateSelectedStatus('Inactive');
};

/** Mark selected modules as Archived */
const markAsArchived = () => {
  updateSelectedStatus('Archived');
};

/** Add button action */
const handleAdd = () => {
  reset();
  open.value = true;
  title.value = 'Add Module';
};

/** Edit button action */
const handleUpdate = (row?: any) => {
  reset();
  const id = row?.id || ids.value[0];
  // TODO: Call actual API to get module details
  form.value = {
    id: row?.id || '',
    moduleCode: row?.moduleCode || '',
    moduleName: row?.moduleName || '',
    description: row?.description || '',
    credits: row?.credits || 0,
    status: row?.status || '1',
    attachments: row?.attachments || []
  };
  moduleAttachmentList.value = (form.value.attachments || []).map((name: string, index: number) => ({
    name,
    url: '',
    status: 'success',
    uid: `${id || 'temp'}-${index}`
  }));
  open.value = true;
  title.value = 'Edit Module';
};

/** Submit button */
const submitForm = () => {
  moduleFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      // TODO: Call actual API to save module information
      proxy?.$modal.msgSuccess('Operation successful');
      open.value = false;
      await getList();
    }
  });
};

/** Delete button action */
const handleDelete = async (row?: any) => {
  const moduleIds = row?.id || ids.value;
  await proxy?.$modal.confirm('Are you sure you want to delete module ID "' + moduleIds + '"?');
  // TODO: Call actual API to delete module
  await getList();
  proxy?.$modal.msgSuccess('Delete successful');
};

/** Cancel button */
const cancel = () => {
  open.value = false;
  reset();
};

/** Form reset */
const reset = () => {
  form.value = {
    id: '',
    moduleCode: '',
    moduleName: '',
    description: '',
    credits: 0,
    status: '1',
    attachments: []
  };
  moduleAttachmentList.value = [];
  moduleFormRef.value?.resetFields();
};

const handleModuleAttachmentChange = (_file: any, fileList: any[]) => {
  moduleAttachmentList.value = fileList;
  form.value.attachments = fileList.map((item: any) => item.name);
};

const handleModuleBeforeUpload = (file: any) => {
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    proxy?.$modal.msgWarning?.('Each file must be smaller than 5MB');
  }
  return isLt5M;
};

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.lecturer-row {
  line-height: 18px;
  color: #374151;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding: 0 10px 10px;
}

.results-summary {
  font-size: 13px;
  color: #6b7280;
}

.upload-block {
  width: 100%;
}
</style>

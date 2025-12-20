<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="Title" prop="title">
              <el-input v-model="queryParams.title" placeholder="Enter announcement title" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="Type" prop="type">
              <el-select v-model="queryParams.type" placeholder="Select type" clearable>
                <el-option label="Notice" value="notice" />
                <el-option label="Announcement" value="announcement" />
                <el-option label="Activity" value="activity" />
              </el-select>
            </el-form-item>
            <el-form-item label="Status" prop="status">
              <el-select v-model="queryParams.status" placeholder="Select status" clearable>
                <el-option label="Published" value="published" />
                <el-option label="Draft" value="draft" />
                <el-option label="Revoked" value="revoked" />
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

      <el-table
        class="attendify-table"
        ref="announcementTableRef"
        v-loading="loading"
        :data="announcementList"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="Title" prop="title" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="Type" prop="type" width="140">
          <template #default="scope">
            <el-tag v-if="scope.row.type === 'notice'" type="info">Notice</el-tag>
            <el-tag v-else-if="scope.row.type === 'announcement'" type="primary">Announcement</el-tag>
            <el-tag v-else type="success">Activity</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Author" prop="author" :show-overflow-tooltip="true" min-width="160" />
        <el-table-column label="Publish Time" prop="publishTime" width="200" />
        <el-table-column label="Status" prop="status" width="130">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'published'" type="success">Published</el-tag>
            <el-tag v-else-if="scope.row.status === 'draft'" type="warning">Draft</el-tag>
            <el-tag v-else type="danger">Revoked</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="200" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">Edit</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- Add or Edit Announcement Dialog -->
    <el-dialog :title="title" v-model="open" width="800px" append-to-body>
      <el-form ref="announcementFormRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="Title" prop="title">
          <el-input v-model="form.title" placeholder="Enter announcement title" />
        </el-form-item>
        <el-form-item label="Type" prop="type">
          <el-select v-model="form.type" placeholder="Select type" style="width: 100%">
            <el-option label="Notice" value="notice" />
            <el-option label="Announcement" value="announcement" />
            <el-option label="Activity" value="activity" />
          </el-select>
        </el-form-item>
        <el-form-item label="Content" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="8" placeholder="Enter announcement content" />
        </el-form-item>
        <el-form-item label="Attachments">
          <el-upload
            class="upload-block"
            action="#"
            :auto-upload="false"
            :file-list="attachmentList"
            multiple
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            :before-upload="handleBeforeUpload"
            @change="handleAttachmentChange"
            @remove="handleAttachmentChange"
          >
            <el-button type="primary" icon="Upload">Select Files</el-button>
            <template #tip>
              <div class="el-upload__tip">Supports pdf/doc/image files up to 5MB each.</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="Status" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="published">Published</el-radio>
            <el-radio label="draft">Draft</el-radio>
            <el-radio label="revoked">Revoked</el-radio>
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

<script setup name="Announcements" lang="ts">
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const announcementList = ref<any[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref('');

const queryFormRef = ref<ElFormInstance>();
const announcementFormRef = ref<ElFormInstance>();
const announcementTableRef = ref<ElTableInstance>();
const attachmentList = ref<any[]>([]);

// Query parameters
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  title: '',
  type: '',
  status: ''
});

// Form parameters
const form = ref<any>({});
const rules = {
  title: [{ required: true, message: 'Title is required', trigger: 'blur' }],
  type: [{ required: true, message: 'Type is required', trigger: 'change' }],
  content: [{ required: true, message: 'Content is required', trigger: 'blur' }],
  status: [{ required: true, message: 'Status is required', trigger: 'change' }]
};

const open = ref(false);

/** Query announcement list */
const getList = async () => {
  loading.value = true;
  // TODO: Call actual API here
  setTimeout(() => {
    announcementList.value = [];
    total.value = 0;
    loading.value = false;
  }, 500);
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

/** Add button action */
const handleAdd = () => {
  reset();
  open.value = true;
  title.value = 'Add Announcement';
};

/** Edit button action */
const handleUpdate = (row?: any) => {
  reset();
  const id = row?.id || ids.value[0];
  // TODO: Call actual API to get announcement details
  form.value = {
    id: row?.id || '',
    title: row?.title || '',
    type: row?.type || 'notice',
    content: row?.content || '',
    status: row?.status || 'draft',
    attachments: row?.attachments || []
  };
  attachmentList.value = (form.value.attachments || []).map((name: string, index: number) => ({
    name,
    url: '',
    status: 'success',
    uid: `${id || 'temp'}-${index}`
  }));
  open.value = true;
  title.value = 'Edit Announcement';
};

/** Submit button */
const submitForm = () => {
  announcementFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      // TODO: Call actual API to save announcement information
      proxy?.$modal.msgSuccess('Operation successful');
      open.value = false;
      await getList();
    }
  });
};

/** Delete button action */
const handleDelete = async (row?: any) => {
  const announcementIds = row?.id || ids.value;
  await proxy?.$modal.confirm('Are you sure you want to delete announcement ID "' + announcementIds + '"?');
  // TODO: Call actual API to delete announcement
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
    title: '',
    type: 'notice',
    content: '',
    status: 'draft',
    attachments: []
  };
  attachmentList.value = [];
  announcementFormRef.value?.resetFields();
};

const handleAttachmentChange = (_file: any, fileList: any[]) => {
  attachmentList.value = fileList;
  form.value.attachments = fileList.map((item: any) => item.name);
};

const handleBeforeUpload = (file: any) => {
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
.upload-block {
  width: 100%;
}
</style>

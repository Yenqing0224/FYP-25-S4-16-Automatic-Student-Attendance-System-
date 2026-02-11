<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="Search" prop="keyword">
              <el-input v-model="queryParams.keyword" placeholder="Search by title, content..." clearable style="width: 300px" @keyup.enter="handleQuery" />
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
        :data="pagedAnnouncementList"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="Title" prop="title" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="Content" prop="content" :show-overflow-tooltip="true" min-width="300" />
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
        <el-table-column label="Publish Time" prop="publishTime" width="200" />
        <el-table-column label="Actions" width="200" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">Edit</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- Add or Edit News Dialog -->
    <el-dialog :title="title" v-model="open" width="800px" append-to-body>
      <el-form ref="announcementFormRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="Title" prop="title">
          <el-input v-model="form.title" placeholder="Enter news title" />
        </el-form-item>
        <el-form-item label="Content" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="8" placeholder="Enter news content" />
        </el-form-item>
        <el-form-item label="Media">
          <el-upload
            class="upload-block"
            action="#"
            :auto-upload="false"
            :file-list="uploadFileList"
            :limit="1"
            accept="image/*"
            :on-change="handleUploadChange"
            :on-remove="handleUploadRemove"
          >
          <el-button type="primary" icon="Upload">Select Image</el-button>
            <template #tip>
              <div class="el-upload__tip">Supports image files.</div>
            </template>
          </el-upload>
          <div v-if="mediaPreviewUrl" class="media-preview">
            <el-image
              v-if="mediaPreviewIsImage"
              :src="mediaPreviewUrl"
              class="media-thumb"
              fit="cover"
              :preview-teleported="true"
              :hide-on-click-modal="true"
              :z-index="10000"
              :preview-src-list="[mediaPreviewUrl]"
            />
          </div>
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

<script setup name="News" lang="ts">
import { listNews, addNews, updateNews, delNews } from '@/api/admin';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const announcementList = ref<any[]>([]);
const allAnnouncementList = ref<any[]>([]);
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
const uploadFileList = ref<any[]>([]);
const uploadFile = ref<File | null>(null);
const uploadPreviewUrl = ref('');
const uploadPreviewType = ref('');
const existingMediaUrl = ref('');

// Query parameters
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  keyword: ''
});

const isFiltering = computed(() => !!queryParams.value.keyword);

// 前端关键字过滤（不区分大小写）
const filteredAnnouncementList = computed(() => {
  let result = isFiltering.value ? allAnnouncementList.value : announcementList.value;
  
  // 关键字搜索（不区分大小写）
  if (queryParams.value.keyword) {
    const keyword = queryParams.value.keyword.toLowerCase();
    result = result.filter(announcement => {
      return (
        (announcement.title && announcement.title.toLowerCase().includes(keyword)) ||
        (announcement.content && announcement.content.toLowerCase().includes(keyword)) ||
        (announcement.message && announcement.message.toLowerCase().includes(keyword))
      );
    });
  }
  
  return result;
});

const pagedAnnouncementList = computed(() => {
  if (!isFiltering.value) return filteredAnnouncementList.value;
  const start = (queryParams.value.pageNum - 1) * queryParams.value.pageSize;
  return filteredAnnouncementList.value.slice(start, start + queryParams.value.pageSize);
});

const isImageUrl = (value?: string) => {
  if (!value) return false;
  const lower = value.toLowerCase();
  return lower.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|bmp)(\?|#|$)/.test(lower);
};

const mediaPreviewUrl = computed(() => uploadPreviewUrl.value || existingMediaUrl.value);

const mediaPreviewIsImage = computed(() => {
  if (uploadPreviewUrl.value) {
    return uploadPreviewType.value.startsWith('image/');
  }
  return isImageUrl(existingMediaUrl.value);
});

const resetUploadState = () => {
  if (uploadPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(uploadPreviewUrl.value);
  }
  uploadFileList.value = [];
  uploadFile.value = null;
  uploadPreviewUrl.value = '';
  uploadPreviewType.value = '';
};

const isAllowedUpload = (file: File) => {
  const type = (file.type || '').toLowerCase();
  if (type.startsWith('image/')) return true;
  const name = (file.name || '').toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp)$/.test(name);
};

const handleUploadChange = (file: any, fileList: any[]) => {
  const rawFile = file?.raw as File | undefined;
  if (!rawFile) return;
  if (!isAllowedUpload(rawFile)) {
    proxy?.$modal?.msgError?.('Only image files are allowed.');
    resetUploadState();
    return;
  }
  if (uploadPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(uploadPreviewUrl.value);
  }
  uploadFile.value = rawFile;
  uploadPreviewUrl.value = URL.createObjectURL(rawFile);
  uploadPreviewType.value = rawFile.type || '';
  uploadFileList.value = fileList.slice(-1);
};

const handleUploadRemove = () => {
  resetUploadState();
};

// Form parameters
const form = ref<any>({});
const rules = {
  title: [{ required: true, message: 'Title is required', trigger: 'blur' }],
  content: [{ required: true, message: 'Content is required', trigger: 'blur' }]
};

const open = ref(false);

const normalizeNews = (item: any) => ({
  id: item.id,
  title: item.title || '',
  content: item.description || item.message || '',
  message: item.message || '',
  publishTime: item.news_date || '',
  imageUrl: item.image_url || item.imageUrl || ''
});

const fetchAllNews = async () => {
  const results: any[] = [];
  let page = 1;
  const pageSize = queryParams.value.pageSize || 10;
  let totalCount: number | null = null;

  while (true) {
    const payload: any = await listNews({ page });
    const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
    const count = payload?.data?.count ?? payload?.count;
    if (typeof count === 'number') totalCount = count;
    if (!Array.isArray(rows) || rows.length === 0) break;
    results.push(...rows.map(normalizeNews));
    if (totalCount !== null && results.length >= totalCount) break;
    if (rows.length < pageSize) break;
    page += 1;
    if (page > 200) break;
  }

  return results;
};

/** Query announcement list */
const getList = async () => {
  loading.value = true;
  try {
    if (isFiltering.value) {
      allAnnouncementList.value = await fetchAllNews();
      announcementList.value = [];
      total.value = filteredAnnouncementList.value.length;
    } else {
      allAnnouncementList.value = [];
      const params = {
        page: queryParams.value.pageNum,
        page_size: queryParams.value.pageSize
      };
      // 后端获取所有数据，前端进行过滤
      const payload: any = await listNews(params);
      const pagination = payload?.data?.pagination ?? payload?.pagination;
      const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
      
      announcementList.value = Array.isArray(rows) ? rows.map(normalizeNews) : [];
      total.value = pagination?.total_items ?? payload?.count ?? announcementList.value.length ?? 0;
    }
  } catch (error: any) {
    announcementList.value = [];
    allAnnouncementList.value = [];
    total.value = 0;
    proxy?.$modal?.msgError?.(error?.message || 'Failed to load news');
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
  title.value = 'Add News';
};

/** Edit button action */
const handleUpdate = (row?: any) => {
  reset();
  const id = row?.id || ids.value[0];
  // 使用从列表中获取的数据，包含完整的 content
  form.value = {
    id: row?.id || '',
    title: row?.title || '',
    content: row?.content || ''  // 这里 content 来自 getList 中映射的 description
  };
  existingMediaUrl.value = row?.imageUrl || '';
  open.value = true;
  title.value = 'Edit News';
};

/** Submit button */
const submitForm = () => {
  announcementFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const newsData = new FormData();
        newsData.append('title', form.value.title || '');
        newsData.append('message', form.value.title || '');
        newsData.append('description', form.value.content || '');
        if (uploadFile.value) {
          newsData.append('upload_image', uploadFile.value);
        }
        
        if (title.value === 'Add News') {
          await addNews(newsData);
          proxy?.$modal.msgSuccess('News added successfully');
        } else {
          await updateNews(form.value.id, newsData);
          proxy?.$modal.msgSuccess('News updated successfully');
        }
        open.value = false;
        await getList();
      } catch (error: any) {
        proxy?.$modal.msgError(error?.message || 'Operation failed');
      }
    }
  });
};

/** Delete button action */
const handleDelete = async (row?: any) => {
  const announcementIds = row?.id || ids.value;
  await proxy?.$modal.confirm('Are you sure you want to delete news ID "' + announcementIds + '"?');
  try {
    if (row?.id) {
      await delNews(row.id);
    } else {
      for (const id of ids.value) {
        await delNews(id);
      }
    }
    await getList();
    proxy?.$modal.msgSuccess('Delete successful');
  } catch (error: any) {
    proxy?.$modal.msgError(error?.message || 'Delete failed');
  }
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
    content: ''
  };
  existingMediaUrl.value = '';
  resetUploadState();
  announcementFormRef.value?.resetFields();
};

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.upload-block {
  width: 100%;
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

</style>

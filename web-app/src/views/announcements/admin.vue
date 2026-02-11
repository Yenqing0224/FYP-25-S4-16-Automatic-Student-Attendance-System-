<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="Search" prop="keyword">
              <el-input v-model="queryParams.keyword" placeholder="Search by title or description..." clearable style="width: 320px" @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd()">Add Announcement</el-button>
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
        <el-table-column label="Description" prop="description" :show-overflow-tooltip="true" min-width="360" />
        <el-table-column label="Posted By" prop="postedByName" min-width="160" />
        <el-table-column label="Actions" width="200" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">Edit</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="640px" append-to-body>
      <el-form ref="announcementFormRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="Title" prop="title">
          <el-input v-model="form.title" placeholder="Enter announcement title" />
        </el-form-item>
        <el-form-item label="Description" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="6" placeholder="Enter announcement description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">Submit</el-button>
          <el-button @click="dialogVisible = false">Cancel</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="AnnouncementsAdmin" lang="ts">
import type { ComponentInternalInstance } from 'vue';
import type { FormInstance, TableInstance } from 'element-plus';
import { listAnnouncements, addAnnouncement, updateAnnouncement, delAnnouncement, listAdminUsers } from '@/api/admin';
import { useUserStore } from '@/store/modules/user';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const userStore = useUserStore();

interface AnnouncementRow {
  id: number | string;
  title: string;
  description: string;
  postedBy: number | null;
  postedByName: string;
}

const announcementList = ref<AnnouncementRow[]>([]);
const allAnnouncementList = ref<AnnouncementRow[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const dialogTitle = ref('');
const dialogVisible = ref(false);

const queryFormRef = ref<FormInstance>();
const announcementFormRef = ref<FormInstance>();
const announcementTableRef = ref<TableInstance>();

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  keyword: ''
});

const usersMap = ref<Map<number, string>>(new Map());

const isFiltering = computed(() => !!queryParams.value.keyword);

const filteredList = computed(() => {
  let result = isFiltering.value ? allAnnouncementList.value : announcementList.value;
  if (queryParams.value.keyword) {
    const keyword = queryParams.value.keyword.toLowerCase();
    result = result.filter(item => {
      return (
        (item.title && item.title.toLowerCase().includes(keyword)) ||
        (item.description && item.description.toLowerCase().includes(keyword))
      );
    });
  }
  return result;
});

const pagedAnnouncementList = computed(() => {
  if (!isFiltering.value) return filteredList.value;
  const start = (queryParams.value.pageNum - 1) * queryParams.value.pageSize;
  return filteredList.value.slice(start, start + queryParams.value.pageSize);
});

const form = ref<{ id?: number | string; title: string; description: string }>({
  title: '',
  description: ''
});

const rules = {
  title: [{ required: true, message: 'Title is required', trigger: 'blur' }],
  description: [{ required: true, message: 'Description is required', trigger: 'blur' }]
};

const loadUsers = async () => {
  try {
    const payload: any = await listAdminUsers({ page_size: 200 });
    const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
    usersMap.value.clear();
    if (Array.isArray(rows)) {
      rows.forEach((user: any) => {
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || `User ${user.id}`;
        usersMap.value.set(user.id, fullName);
      });
    }
  } catch (error) {
    console.error('Failed to load users:', error);
  }
};

const normalizeAnnouncement = (item: any): AnnouncementRow => {
  const postedById = typeof item?.posted_by === 'number' ? item.posted_by : null;
  return {
    id: item?.id,
    title: item?.title || '',
    description: item?.description || '',
    postedBy: postedById,
    postedByName: postedById ? (usersMap.value.get(postedById) || `User ${postedById}`) : '-'
  };
};

const fetchAllAnnouncements = async () => {
  const results: AnnouncementRow[] = [];
  let page = 1;
  const pageSize = queryParams.value.pageSize || 10;
  let totalCount: number | null = null;

  while (true) {
    const payload: any = await listAnnouncements({ page });
    const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
    const count = payload?.data?.count ?? payload?.count;
    if (typeof count === 'number') totalCount = count;
    if (!Array.isArray(rows) || rows.length === 0) break;
    results.push(...rows.map(normalizeAnnouncement));
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
      allAnnouncementList.value = await fetchAllAnnouncements();
      announcementList.value = [];
      total.value = filteredList.value.length;
    } else {
      allAnnouncementList.value = [];
      const params = {
        page: queryParams.value.pageNum,
        page_size: queryParams.value.pageSize
      };
      const payload: any = await listAnnouncements(params);
      const pagination = payload?.data?.pagination ?? payload?.pagination;
      const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
      announcementList.value = Array.isArray(rows) ? rows.map(normalizeAnnouncement) : [];
      total.value = pagination?.total_items ?? payload?.count ?? announcementList.value.length ?? 0;
    }
  } catch (error: any) {
    announcementList.value = [];
    allAnnouncementList.value = [];
    total.value = 0;
    proxy?.$modal?.msgError?.(error?.message || 'Failed to load announcements');
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
  form.value = { title: '', description: '' };
  dialogTitle.value = 'Add Announcement';
  dialogVisible.value = true;
};

const handleUpdate = (row?: any) => {
  const target = row || announcementList.value.find((item) => item.id === ids.value[0]);
  if (!target) return;
  form.value = {
    id: target.id,
    title: target.title || '',
    description: target.description || ''
  };
  dialogTitle.value = 'Edit Announcement';
  dialogVisible.value = true;
};

const submitForm = () => {
  announcementFormRef.value?.validate(async (valid) => {
    if (!valid) return;

    try {
      if (form.value.id) {
        await updateAnnouncement(form.value.id, {
          title: form.value.title,
          description: form.value.description
        });
        proxy?.$modal?.msgSuccess('Announcement updated');
      } else {
        if (!userStore.userId) {
          proxy?.$modal?.msgError('User not found. Please re-login.');
          return;
        }
        await addAnnouncement({
          title: form.value.title,
          description: form.value.description,
          posted_by: userStore.userId
        });
        proxy?.$modal?.msgSuccess('Announcement added');
      }
      dialogVisible.value = false;
      await getList();
    } catch (error: any) {
      proxy?.$modal?.msgError(error?.message || 'Operation failed');
    }
  });
};

const handleDelete = async (row?: any) => {
  const deleteIds = row?.id ? [row.id] : ids.value;
  await proxy?.$modal.confirm('Are you sure you want to delete the selected announcement(s)?');
  try {
    for (const id of deleteIds) {
      await delAnnouncement(id);
    }
    await getList();
    proxy?.$modal.msgSuccess('Delete successful');
  } catch (error: any) {
    proxy?.$modal.msgError(error?.message || 'Delete failed');
  }
};

onMounted(async () => {
  await loadUsers();
  await getList();
});
</script>

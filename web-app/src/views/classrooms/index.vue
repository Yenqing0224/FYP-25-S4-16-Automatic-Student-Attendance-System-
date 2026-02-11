<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="Search" prop="keyword">
              <el-input v-model="queryParams.keyword" placeholder="Search by classroom name..." clearable style="width: 320px" @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd()">Add Classroom</el-button>
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
        ref="classroomTableRef"
        v-loading="loading"
        :data="pagedList"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="Name" prop="name" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="Actions" width="180" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">Edit</el-button>
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        layout="total, prev, pager, next, jumper"
        @pagination="getList"
      />
    </el-card>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="520px" append-to-body>
      <el-form ref="classroomFormRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="Name" prop="name">
          <el-input v-model="form.name" placeholder="Enter classroom name" />
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

<script setup name="Classrooms" lang="ts">
import type { ComponentInternalInstance } from 'vue';
import type { FormInstance, TableInstance } from 'element-plus';
import { listClassrooms, addClassroom, updateClassroom, delClassroom } from '@/api/admin';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

interface ClassroomRow {
  id: number | string;
  name: string;
}

const classroomList = ref<ClassroomRow[]>([]);
const allClassrooms = ref<ClassroomRow[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const dialogTitle = ref('');
const dialogVisible = ref(false);

const queryFormRef = ref<FormInstance>();
const classroomFormRef = ref<FormInstance>();
const classroomTableRef = ref<TableInstance>();

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  keyword: ''
});

const isFiltering = computed(() => !!queryParams.value.keyword?.trim());

const filteredList = computed(() => {
  const keyword = queryParams.value.keyword?.trim().toLowerCase();
  const source = isFiltering.value ? allClassrooms.value : classroomList.value;
  if (!keyword) return source;
  return source.filter(item => (item.name || '').toLowerCase().includes(keyword));
});

const pagedList = computed(() => {
  if (!isFiltering.value) return filteredList.value;
  const start = (queryParams.value.pageNum - 1) * queryParams.value.pageSize;
  return filteredList.value.slice(start, start + queryParams.value.pageSize);
});

const form = ref<{ id?: number | string; name: string }>({
  name: ''
});

const rules = {
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }]
};

const normalizeClassroom = (item: any): ClassroomRow => ({
  id: item?.id,
  name: item?.name || ''
});

const fetchAllClassrooms = async () => {
  const results: ClassroomRow[] = [];
  let page = 1;
  const pageSize = queryParams.value.pageSize || 10;
  let totalCount: number | null = null;

  while (true) {
    const payload: any = await listClassrooms({ page });
    const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
    const count = payload?.data?.count ?? payload?.count;
    if (typeof count === 'number') totalCount = count;
    if (!Array.isArray(rows) || rows.length === 0) break;
    results.push(...rows.map(normalizeClassroom));
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
    const keyword = queryParams.value.keyword?.trim();
    if (keyword) {
      allClassrooms.value = await fetchAllClassrooms();
      classroomList.value = [];
      total.value = filteredList.value.length;
    } else {
      allClassrooms.value = [];
      const params = {
        page: queryParams.value.pageNum,
        page_size: queryParams.value.pageSize
      };
      const payload: any = await listClassrooms(params);
      const pagination = payload?.data?.pagination ?? payload?.pagination;
      const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
      classroomList.value = Array.isArray(rows) ? rows.map(normalizeClassroom) : [];
      total.value = pagination?.total_items ?? payload?.count ?? classroomList.value.length ?? 0;
    }
  } catch (error: any) {
    classroomList.value = [];
    allClassrooms.value = [];
    total.value = 0;
    proxy?.$modal?.msgError?.(error?.message || 'Failed to load classrooms');
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

const handleSelectionChange = (selection: ClassroomRow[]) => {
  ids.value = selection.map((item) => item.id);
  multiple.value = !selection.length;
  single.value = selection.length !== 1;
};

const handleAdd = () => {
  reset();
  dialogTitle.value = 'Add Classroom';
  dialogVisible.value = true;
};

const handleUpdate = (row?: ClassroomRow) => {
  reset();
  const id = row?.id || ids.value[0];
  const selected = row || classroomList.value.find((item) => item.id === id);
  if (!selected) {
    proxy?.$modal?.msgWarning?.('Please select one classroom');
    return;
  }
  form.value = {
    id: selected.id,
    name: selected.name
  };
  dialogTitle.value = 'Edit Classroom';
  dialogVisible.value = true;
};

const submitForm = () => {
  classroomFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    try {
      const payload = { name: form.value.name };
      if (form.value.id) {
        await updateClassroom(form.value.id, payload);
        proxy?.$modal?.msgSuccess?.('Classroom updated successfully');
      } else {
        await addClassroom(payload);
        proxy?.$modal?.msgSuccess?.('Classroom added successfully');
      }
      dialogVisible.value = false;
      await getList();
    } catch (error: any) {
      proxy?.$modal?.msgError?.(error?.message || 'Operation failed');
    }
  });
};

const handleDelete = async (row?: ClassroomRow) => {
  const classroomIds = row?.id || ids.value;
  await proxy?.$modal.confirm('Are you sure you want to delete classroom ID "' + classroomIds + '"?');
  try {
    if (row?.id) {
      await delClassroom(row.id);
    } else {
      for (const id of ids.value) {
        await delClassroom(id);
      }
    }
    await getList();
    proxy?.$modal?.msgSuccess?.('Delete successful');
  } catch (error: any) {
    proxy?.$modal?.msgError?.(error?.message || 'Delete failed');
  }
};

const reset = () => {
  form.value = { id: undefined, name: '' };
  classroomFormRef.value?.resetFields();
};

onMounted(() => {
  getList();
});
</script>

<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="Search" prop="keyword">
              <el-input v-model="queryParams.keyword" placeholder="Search by module name, code, lecturer..." clearable style="width: 300px" @keyup.enter="handleQuery" />
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

      <el-table class="attendify-table" ref="moduleTableRef" v-loading="loading" :data="pagedModuleList" border @selection-change="handleSelectionChange">
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
            <div v-for="(name, idx) in (scope.row.lecturers as string[])" :key="idx" class="lecturer-row">{{ idx + 1 }}. {{ name }}</div>
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
        <span class="results-summary">Showing {{ pagedModuleList.length }} of {{ total }} results</span>
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
        <el-form-item label="Credit Points" prop="credits">
          <el-input-number v-model="form.credits" :min="0" :max="10" placeholder="Enter credit points" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Semester" prop="semester">
          <el-select v-model="form.semester" placeholder="Select semester" style="width: 100%">
            <el-option v-for="sem in semesterOptions" :key="sem.id" :label="sem.name" :value="sem.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Lecturer" prop="lecturer">
          <el-select v-model="form.lecturer" placeholder="Select lecturer" style="width: 100%" filterable>
            <el-option v-for="lec in lecturerOptions" :key="lec.id" :label="lec.name" :value="lec.id" />
          </el-select>
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
import { listModules, addModule, updateModule, delModule, listAdminLecturers, listSemesters } from '@/api/admin';
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const router = useRouter();

const moduleList = ref<any[]>([]);
const allModuleList = ref<any[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref('');

// Dropdown options
const semesterOptions = ref<Array<{id: number, name: string}>>([]);
const lecturerOptions = ref<Array<{id: number, name: string}>>([]);

const queryFormRef = ref<ElFormInstance>();
const moduleFormRef = ref<ElFormInstance>();
const moduleTableRef = ref<ElTableInstance>();

// Query parameters
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  status: ''
});

// 前端关键字过滤（不区分大小写）
const isFiltering = computed(() => !!queryParams.value.keyword || !!queryParams.value.status);

const filteredModuleList = computed(() => {
  let result = isFiltering.value ? allModuleList.value : moduleList.value;
  
  // 关键字搜索（不区分大小写）
  if (queryParams.value.keyword) {
    const keyword = queryParams.value.keyword.toLowerCase();
    result = result.filter(module => {
      const lecturerNames = (module.lecturers || []).join(' ').toLowerCase();
      return (
        (module.moduleName && module.moduleName.toLowerCase().includes(keyword)) ||
        (module.moduleCode && module.moduleCode.toLowerCase().includes(keyword)) ||
        lecturerNames.includes(keyword)
      );
    });
  }
  
  // 状态过滤
  if (queryParams.value.status) {
    result = result.filter(module => {
      if (queryParams.value.status === '1') {
        return module.status === '1' || module.status === 'Active';
      } else {
        return module.status === '0' || module.status === 'Inactive';
      }
    });
  }
  
  return result;
});

const pagedModuleList = computed(() => {
  if (!isFiltering.value) return filteredModuleList.value;
  const start = (queryParams.value.pageNum - 1) * queryParams.value.pageSize;
  return filteredModuleList.value.slice(start, start + queryParams.value.pageSize);
});

// Form parameters
const form = ref<any>({});
const rules = {
  moduleCode: [{ required: true, message: 'Module code is required', trigger: 'blur' }],
  moduleName: [{ required: true, message: 'Module name is required', trigger: 'blur' }],
  credits: [{ required: true, message: 'Credit points is required', trigger: 'blur' }],
  semester: [{ required: true, message: 'Semester is required', trigger: 'change' }],
  lecturer: [{ required: true, message: 'Lecturer is required', trigger: 'change' }],
  status: [{ required: true, message: 'Status is required', trigger: 'change' }]
};

const open = ref(false);

const normalizeModule = (item: any) => {
  const lecturerOption = lecturerOptions.value.find(l => l.id === item.lecturer);
  return {
    id: item.id,
    moduleCode: item.code || item.module_code || '',
    moduleName: item.name || item.module_name || '',
    credits: item.credit || item.credit_points || item.credits || 0,
    semester: item.semester || '',
    lecturer: item.lecturer || '',
    studentsEnrolled: item.student_enrolled || item.students?.length || item.students_count || 0,
    avgAttendance: item.average_attendance || item.avg_attendance || 0,
    lecturers: lecturerOption ? [lecturerOption.name] : [],
    status: item.status === 'active' ? 'Active' : 'Inactive'
  };
};

const fetchAllModules = async () => {
  const results: any[] = [];
  let page = 1;
  const pageSize = queryParams.value.pageSize || 10;
  let totalCount: number | null = null;

  while (true) {
    const payload: any = await listModules({ page });
    const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
    const count = payload?.data?.count ?? payload?.count;
    if (typeof count === 'number') totalCount = count;
    if (!Array.isArray(rows) || rows.length === 0) break;
    results.push(...rows.map(normalizeModule));
    if (totalCount !== null && results.length >= totalCount) break;
    if (rows.length < pageSize) break;
    page += 1;
    if (page > 200) break;
  }

  return results;
};

/** Query module list */
const getList = async () => {
  loading.value = true;
  try {
    if (isFiltering.value) {
      allModuleList.value = await fetchAllModules();
      moduleList.value = [];
      total.value = filteredModuleList.value.length;
    } else {
      allModuleList.value = [];
      const params = {
        page: queryParams.value.pageNum,
        page_size: queryParams.value.pageSize
      };
      // 后端获取所有数据，前端进行过滤
      const payload: any = await listModules(params);
      const pagination = payload?.data?.pagination ?? payload?.pagination;
      const rows = payload?.data?.results ?? payload?.results ?? payload?.data ?? payload ?? [];
      
      moduleList.value = Array.isArray(rows) ? rows.map(normalizeModule) : [];
      total.value = pagination?.total_items ?? payload?.count ?? moduleList.value.length ?? 0;
    }
  } catch (error: any) {
    moduleList.value = [];
    allModuleList.value = [];
    total.value = 0;
    proxy?.$modal?.msgError?.(error?.message || 'Failed to load module list');
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
  const selected = row || moduleList.value.find((m) => m.id === id);
  form.value = {
    id: selected?.id || '',
    moduleCode: selected?.moduleCode || '',
    moduleName: selected?.moduleName || '',
    credits: selected?.credits || 0,
    semester: selected?.semester || '',
    lecturer: selected?.lecturer || '',
    status: selected?.status === 'Active' ? '1' : '0'
  };
  open.value = true;
  title.value = 'Edit Module';
};

/** Submit button */
const submitForm = () => {
  moduleFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      try {
        const moduleData = {
          code: form.value.moduleCode,
          name: form.value.moduleName,
          credit: form.value.credits,
          semester: form.value.semester,
          lecturer: form.value.lecturer,
          status: form.value.status === '1' ? 'active' : 'inactive'
        };
        
        if (title.value === 'Add Module') {
          await addModule(moduleData);
          proxy?.$modal.msgSuccess('Module added successfully');
        } else {
          await updateModule(form.value.id, moduleData);
          proxy?.$modal.msgSuccess('Module updated successfully');
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
  const moduleIds = row?.id || ids.value;
  await proxy?.$modal.confirm('Are you sure you want to delete module ID "' + moduleIds + '"?');
  try {
    if (row?.id) {
      await delModule(row.id);
    } else {
      for (const id of ids.value) {
        await delModule(id);
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
    moduleCode: '',
    moduleName: '',
    credits: 0,
    semester: '',
    lecturer: '',
    status: '1'
  };
  moduleFormRef.value?.resetFields();
};

onMounted(async () => {
  // 先加载下拉选项，然后再加载列表（因为 getList 需要 lecturerOptions 来显示讲师名称）
  await loadDropdownOptions();
  await getList();
});

/** Load semester and lecturer options */
const loadDropdownOptions = async () => {
  try {
    // Load semesters
    const semPayload: any = await listSemesters({});
    const semRows = semPayload?.data?.results ?? semPayload?.results ?? semPayload?.data ?? semPayload ?? [];
    semesterOptions.value = Array.isArray(semRows) ? semRows.map((item: any) => ({
      id: item.id,
      name: item.name || `Semester ${item.id}`
    })) : [];
    
    // Load lecturers
    const lecPayload: any = await listAdminLecturers({});
    const lecRows = lecPayload?.data?.results ?? lecPayload?.results ?? lecPayload?.data ?? lecPayload ?? [];
    lecturerOptions.value = Array.isArray(lecRows) ? lecRows.map((item: any) => {
      // 后端 Admin API 返回的是 user_details 嵌套对象
      const user = item?.user_details ?? {};
      const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
      return {
        id: item.user || user.id || item.id,
        name: fullName || user.username || `Lecturer ${item.id}`
      };
    }) : [];
  } catch (error) {
    console.error('Failed to load dropdown options:', error);
  }
};
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

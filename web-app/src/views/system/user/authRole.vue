<template>
  <div class="p-2">
    <div class="panel">
      <h4 class="panel-title">Basic Information</h4>
      <el-form :model="form" :inline="true">
        <el-row :gutter="10">
          <el-col :span="2.5">
            <el-form-item label="Display Name" prop="nickName">
              <el-input v-model="form.nickName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="2.5">
            <el-form-item label="Login Account" prop="userName">
              <el-input v-model="form.userName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="2.5">
            <el-form-item label="Settings">
              <span>-</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div class="panel">
      <h4 class="panel-title">Role Information</h4>
      <div>
        <el-table
          ref="tableRef"
          v-loading="loading"
          border
          :row-key="getRowKey"
          :data="roles.slice((pageNum - 1) * pageSize, pageNum * pageSize)"
          @row-click="clickRow"
          @selection-change="handleSelectionChange"
        >
          <el-table-column label="No." width="55" type="index" align="center">
            <template #default="scope">
              <span>{{ (pageNum - 1) * pageSize + scope.$index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column type="selection" :reserve-selection="true" :selectable="checkSelectable" width="55"></el-table-column>
          <el-table-column label="Role ID" align="center" prop="roleId" />
          <el-table-column label="Role Name" align="center" prop="roleName" />
          <el-table-column label="Permission Key" align="center" prop="roleKey" />
          <el-table-column label="Created At" align="center" prop="createTime" width="180">
            <template #default="scope">
              <span>{{ proxy.parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
        </el-table>
        <pagination v-show="total > 0" v-model:page="pageNum" v-model:limit="pageSize" :total="total" />
        <div style="text-align: center; margin-left: -120px; margin-top: 30px">
          <el-button type="primary" @click="submitForm()">Submit</el-button>
          <el-button @click="close()">Back</el-button>
        </div>
        <div></div>
      </div>
    </div>
  </div>
</template>

<script setup name="AuthRole" lang="ts">
import { RoleVO } from '@/api/system/role/types';
import { getAuthRole, updateAuthRole } from '@/api/system/user';
import { UserForm } from '@/api/system/user/types';
import { parseTime } from '@/utils/ruoyi';

const route = useRoute();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const loading = ref(true);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const roleIds = ref<Array<string | number>>([]);
const roles = ref<RoleVO[]>([]);
const form = ref<Partial<UserForm>>({
  nickName: undefined,
  userName: '',
  userId: undefined
});

const tableRef = ref<ElTableInstance>();

/** Click row to toggle selection */
const clickRow = (row: RoleVO) => {
  if (checkSelectable(row)) {
    row.flag = !row.flag;
    tableRef.value?.toggleRowSelection(row, row.flag);
  }
};
/** Handle checkbox selection change */
const handleSelectionChange = (selection: RoleVO[]) => {
  roleIds.value = selection.map((item) => item.roleId);
};
/** Save selected row key */
const getRowKey = (row: RoleVO): string => {
  return String(row.roleId);
};
/** Check if role is selectable (status) */
const checkSelectable = (row: RoleVO): boolean => {
  return row.status === '0';
};
/** Back button */
const close = () => {
  const obj: any = {
    fullPath: '',
    hash: '',
    matched: [],
    meta: undefined,
    name: undefined,
    params: undefined,
    query: undefined,
    redirectedFrom: undefined,
    path: '/system/user'
  };
  proxy?.$tab.closeOpenPage(obj);
};
/** Submit button */
const submitForm = async () => {
  const userId = form.value.userId;
  const rIds = roleIds.value.join(',');
  await updateAuthRole({ userId: userId as string, roleIds: rIds });
  proxy?.$modal.msgSuccess('Authorization updated successfully');
  close();
};

const getList = async () => {
  const userId = route.params && route.params.userId;
  if (userId) {
    loading.value = true;
    const res = await getAuthRole(userId as string);
    Object.assign(form.value, res.data.user);
    Object.assign(roles.value, res.data.roles);
    total.value = roles.value.length;
    await nextTick(() => {
      roles.value.forEach((row) => {
        if (row?.flag) {
          tableRef.value?.toggleRowSelection(row, true);
        }
      });
    });
    loading.value = false;
  }
};
onMounted(() => {
  getList();
});
</script>

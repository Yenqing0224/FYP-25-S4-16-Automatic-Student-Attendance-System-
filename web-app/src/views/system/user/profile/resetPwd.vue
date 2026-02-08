<template>
  <el-form ref="pwdRef" :model="user" :rules="rules" label-width="120px">
    <el-form-item label="Current Password" prop="oldPassword" label-width="160px">
      <el-input v-model="user.oldPassword" placeholder="Enter current password" type="password" show-password />
    </el-form-item>
    <el-form-item label="New Password" prop="newPassword" label-width="160px">
      <el-input v-model="user.newPassword" placeholder="Enter new password" type="password" show-password />
    </el-form-item>
    <el-form-item label="Confirm Password" prop="confirmPassword" label-width="160px">
      <el-input v-model="user.confirmPassword" placeholder="Confirm new password" type="password" show-password />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submit">Save</el-button>
      <el-button type="danger" @click="close">Close</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { updateUserPwd } from '@/api/system/user';
import type { ResetPwdForm } from '@/api/system/user/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const pwdRef = ref<ElFormInstance>();
const user = ref<ResetPwdForm>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const equalToPassword = (rule: any, value: string, callback: any) => {
  if (user.value.newPassword !== value) {
    callback(new Error('The two passwords do not match'));
  } else {
    callback();
  }
};
const rules = ref({
  oldPassword: [{ required: true, message: 'Current password is required', trigger: 'blur' }],
  newPassword: [
    { required: true, message: 'New password is required', trigger: 'blur' },
    {
      min: 6,
      max: 20,
      message: 'Length must be between 6 and 20 characters',
      trigger: 'blur'
    },
    { pattern: /^[^<>"'|\\]+$/, message: 'Password cannot contain: < > " \' \\ |', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: 'Confirm password is required', trigger: 'blur' },
    {
      required: true,
      validator: equalToPassword,
      trigger: 'blur'
    }
  ]
});

/** Submit button */
const submit = () => {
  pwdRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      await updateUserPwd(user.value.oldPassword, user.value.newPassword);
      proxy?.$modal.msgSuccess('Password updated successfully');
    }
  });
};
/** Close button */
const close = () => {
  proxy?.$tab.closePage();
};
</script>

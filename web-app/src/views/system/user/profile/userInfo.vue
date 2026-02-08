<template>
  <el-form ref="userRef" :model="userForm" :rules="rules" label-width="80px">
    <el-form-item label="Display Name" prop="nickName" label-width="160px">
      <el-input v-model="userForm.nickName" maxlength="30" label-width="160px"/>
    </el-form-item>
    <el-form-item label="Mobile Number" prop="phonenumber" label-width="160px">
      <el-input v-model="userForm.phonenumber" maxlength="11" label-width="160px"/>
    </el-form-item>
    <el-form-item label="Email" prop="email" label-width="160px">
      <el-input v-model="userForm.email" maxlength="50" label-width="160px"/>
    </el-form-item>
    <el-form-item label="Gender" label-width="160px">
      <el-radio-group v-model="userForm.sex">
        <el-radio value="0">Male</el-radio>
        <el-radio value="1">Female</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submit">Save</el-button>
      <el-button type="danger" @click="close">Close</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { updateUserProfile } from '@/api/system/user';
import { propTypes } from '@/utils/propTypes';
import { validEmail } from '@/utils/validate';

const props = defineProps({
  user: propTypes.any.isRequired
});
const userForm = computed(() => props.user);
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const userRef = ref<ElFormInstance>();
const rule: ElFormRules = {
  nickName: [{ required: true, message: 'Display name is required', trigger: 'blur' }],
  email: [
    { required: true, message: 'Email is required', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!value || validEmail(value)) {
          callback();
        } else {
          callback(new Error('Please enter a valid email address'));
        }
      },
      trigger: ['blur', 'change']
    }
  ],
  phonenumber: [
    {
      required: true,
      message: 'Mobile number is required',
      trigger: 'blur'
    },
    {
      pattern: /^1[3456789][0-9]\d{8}$/,
      message: 'Please enter a valid mobile number',
      trigger: 'blur'
    }
  ]
};
const rules = ref<ElFormRules>(rule);

/** Submit button */
const submit = () => {
  userRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      await updateUserProfile(props.user);
      proxy?.$modal.msgSuccess('Profile updated successfully');
    }
  });
};
/** Close button */
const close = () => {
  proxy?.$tab.closePage();
};
</script>

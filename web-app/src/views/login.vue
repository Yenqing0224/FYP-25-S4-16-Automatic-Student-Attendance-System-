<template>
  <div class="login">
    <div class="login-card">
      <div class="login-logo-circle">LOGO</div>
      <h3 class="login-title">Log In</h3>
      <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form" label-position="top">
        <el-form-item label="Email" prop="username">
          <el-input v-model="loginForm.username" type="text" size="large" placeholder="Enter your email" />
      </el-form-item>
        <el-form-item label="Password" prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          size="large"
            placeholder="Enter your password"
          @keyup.enter="handleLogin"
          />
      </el-form-item>
        <div class="login-reset-row">
          <a class="login-reset-link">Reset Password</a>
        </div>
        <el-button :loading="loading" size="large" class="login-submit-btn" type="primary" @click.prevent="handleLogin">
          <span v-if="!loading">Login</span>
          <span v-else>Logging in...</span>
        </el-button>
    </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/modules/user';
import type { LoginData } from '@/api/types';
import { to } from 'await-to-js';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const userStore = useUserStore();
const router = useRouter();
const loginForm = ref<LoginData>({
  username: '',
  password: '',
  rememberMe: false
} as LoginData);

const loginRules: ElFormRules = {
  username: [{ required: true, trigger: 'blur', message: 'Email is required' }],
  password: [{ required: true, trigger: 'blur', message: 'Password is required' }]
};

const loading = ref(false);
const redirect = ref('/');
const loginRef = ref<ElFormInstance>();

watch(
  () => router.currentRoute.value,
  (newRoute: any) => {
    redirect.value = newRoute.query && newRoute.query.redirect && decodeURIComponent(newRoute.query.redirect);
  },
  { immediate: true }
);

const handleLogin = () => {
  loginRef.value?.validate(async (valid: boolean, fields: any) => {
    if (valid) {
      loading.value = true;
      // 调用真实的登录API
      const [err] = await to(userStore.login(loginForm.value));
      if (!err) {
        const redirectUrl = redirect.value || '/';
        await router.push(redirectUrl);
        loading.value = false;
      } else {
        loading.value = false;
        // Mock模式下不需要重新获取验证码
        // if (captchaEnabled.value) {
        //   await getCode();
        // }
      }
    } else {
      console.log('error submit!', fields);
    }
  });
};

onMounted(() => {
  // 初始化登录表单
});
</script>

<style lang="scss" scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #f4f4f4;
}

.login-card {
  width: 420px;
  max-width: 100%;
  padding: 40px 48px 32px;
  border-radius: 18px;
  background-color: #ffffff;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.12);
  text-align: center;
}

.login-logo-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 16px;
  font-weight: 600;
  color: #4b5563;
  }

.login-title {
  margin-bottom: 28px;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.login-form {
  text-align: left;
}

.login-reset-row {
  display: flex;
  justify-content: flex-end;
  margin: 4px 0 20px;
}

.login-reset-link {
  font-size: 13px;
  color: #6b21a8;
    cursor: pointer;
}

.login-submit-btn {
  width: 100%;
  border-radius: 9999px;
  background-color: #6d28d9;
  border-color: #6d28d9;
}

.login-submit-btn:hover {
  background-color: #5b21b6;
  border-color: #5b21b6;
}
</style>

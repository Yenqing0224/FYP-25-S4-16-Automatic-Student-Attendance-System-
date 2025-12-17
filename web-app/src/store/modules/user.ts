import { getToken, removeToken, setToken } from '@/utils/auth';
import { LoginData } from '@/api/types';
import defAva from '@/assets/images/profile.jpg';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { login as loginApi, getInfo as getInfoApi } from '@/api/login';

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken());
  const name = ref('');
  const nickname = ref('');
  const userId = ref<string | number>('');
  const tenantId = ref<string>('');
  const avatar = ref('');
  const roles = ref<Array<string>>([]); // 用户角色编码集合 → 判断路由权限
  const permissions = ref<Array<string>>([]); // 用户权限编码集合 → 判断按钮权限

  /**
   * 登录 - 调用真实API
   */
  const login = async (userInfo: LoginData): Promise<void> => {
    const res = await loginApi(userInfo);
    // 后端返回格式: { message: "Login successful", token: "...", user: {...} }
    const data: any = res.data || res || {};

    // 1) 提取 token（优先 token，其次 access_token）
    const tokenValue = data.token || data.access_token;
    if (!tokenValue) {
      console.error('Login response missing token:', data);
      return Promise.reject(new Error('Login failed: Token not found in response'));
    }

    // 保存 token
    setToken(tokenValue);
    token.value = tokenValue;

    // 2) 提取并保存用户信息
    if (data.user) {
      const user = data.user;
      const profile = user.image_url || user.avatar || defAva;
      name.value = user.username || user.userName || '';
      nickname.value = user.first_name && user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.username || '';
      avatar.value = profile;
      userId.value = user.id || user.userId || '';
      tenantId.value = user.tenantId || '';
      roles.value = user.role_type ? [user.role_type] : ['ROLE_DEFAULT'];
      permissions.value = [];
    }

    return Promise.resolve();
  };

  // 获取用户信息 - 调用真实API；若登录已写入用户信息，可直接返回
  const getInfo = async (): Promise<void> => {
    if (roles.value.length > 0 && name.value) {
      return Promise.resolve();
    }
    const res = await getInfoApi();
    if (res.data) {
      const userInfo = res.data;
      const user = userInfo.user;
      const profile = user.avatar == '' || user.avatar == null ? defAva : user.avatar;

      if (userInfo.roles && userInfo.roles.length > 0) {
        roles.value = userInfo.roles;
        permissions.value = userInfo.permissions || [];
      } else {
        roles.value = ['ROLE_DEFAULT'];
      }
      name.value = user.userName;
      nickname.value = user.nickName;
      avatar.value = profile;
      userId.value = user.userId;
      tenantId.value = user.tenantId;
      return Promise.resolve();
    } else {
      return Promise.reject(new Error('Failed to get user info'));
    }
  };

  // 注销 - 使用Mock数据
  const logout = async (): Promise<void> => {
    // Mock logout - 不需要调用API
    token.value = '';
    roles.value = [];
    permissions.value = [];
    removeToken();
    return Promise.resolve();
  };

  const setAvatar = (value: string) => {
    avatar.value = value;
  };

  return {
    userId,
    tenantId,
    token,
    nickname,
    avatar,
    roles,
    permissions,
    login,
    getInfo,
    logout,
    setAvatar
  };
});

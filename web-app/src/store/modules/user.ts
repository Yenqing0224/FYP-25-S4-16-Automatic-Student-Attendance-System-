import { getToken, removeToken, setToken } from '@/utils/auth';
import { LoginData } from '@/api/types';
import defAva from '@/assets/images/profile.jpg';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { login as loginApi, logout as logoutApi } from '@/api/login';

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
    console.log('🔐 [User Store] Login function called');
    console.log('📋 [User Store] Username:', userInfo.username);
    
    try {
      console.log('📤 [User Store] Calling loginApi...');
      const res = await loginApi(userInfo);
      console.log('📥 [User Store] loginApi response:', res);
      
      // 后端返回格式: { message: "Login successful", token: "...", user: {...} }
      const data: any = res.data || res || {};

      // 1) 提取 token（优先 token，其次 access_token）
      const tokenValue = data.token || data.access_token;
      if (!tokenValue) {
        console.error('❌ [User Store] Login response missing token:', data);
        return Promise.reject(new Error('Login failed: Token not found in response'));
      }

      console.log('🔑 [User Store] Token received:', tokenValue.substring(0, 20) + '...');
      
      // 保存 token
      setToken(tokenValue);
      token.value = tokenValue;

      // 2) 提取并保存用户信息
      if (data.user) {
        const user = data.user;
        const profile = user.image_path || user.image_url || user.avatar || defAva;
        name.value = user.username || user.userName || '';
        nickname.value = user.first_name && user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.username || '';
        avatar.value = profile;
        userId.value = user.id || user.userId || '';
        tenantId.value = user.tenantId || '';
        roles.value = user.role_type ? [user.role_type] : ['ROLE_DEFAULT'];
        permissions.value = [];
        console.log('✅ [User Store] User info saved successfully');
      }

      console.log('✅ [User Store] Login completed successfully');
      return Promise.resolve();
    } catch (error: any) {
      console.error('❌ [User Store] Login error:', error);
      console.error('❌ [User Store] Error message:', error.message);
      if (error.response) {
        console.error('❌ [User Store] Error response:', error.response);
      }
      throw error;
    }
  };

  // 获取用户信息 - 直接使用登录时保存的信息，不再调用后端 API
  // 因为当前后端没有部署 /api/getInfo/ 接口
  const getInfo = async (): Promise<void> => {
    // 如果已有用户信息（登录时保存的），直接返回成功
    if (roles.value.length > 0 && name.value) {
      return Promise.resolve();
    }

    // 如果有 token，使用默认信息保持登录状态
    if (token.value) {
      if (roles.value.length === 0) {
        roles.value = ['ROLE_DEFAULT'];
      }
      if (!name.value) {
        name.value = 'User';
      }
      if (!avatar.value) {
        avatar.value = defAva;
      }
      return Promise.resolve();
    }

    return Promise.reject(new Error('No token available'));
  };

  // 注销 - 调用后端注销接口
  const logout = async (): Promise<void> => {
    try {
      await logoutApi();
    } catch (error) {
      console.warn('[User Store] Logout API failed, clearing local session anyway.', error);
    } finally {
      token.value = '';
      roles.value = [];
      permissions.value = [];
      removeToken();
    }
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

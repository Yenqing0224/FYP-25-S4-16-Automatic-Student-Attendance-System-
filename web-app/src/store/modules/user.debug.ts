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
   * 登录 - 调用真实API（带调试日志）
   */
  const login = async (userInfo: LoginData): Promise<void> => {
    console.log('🔐 [DEBUG] Login function called');
    console.log('📋 [DEBUG] User info:', { username: userInfo.username, hasPassword: !!userInfo.password });
    
    try {
      console.log('📤 [DEBUG] Calling loginApi...');
      console.log('🌐 [DEBUG] Environment:', {
        VITE_APP_BASE_URL: import.meta.env.VITE_APP_BASE_URL,
        VITE_APP_BASE_API: import.meta.env.VITE_APP_BASE_API,
        VITE_APP_CLIENT_ID: import.meta.env.VITE_APP_CLIENT_ID,
        MODE: import.meta.env.MODE,
        PROD: import.meta.env.PROD
      });
      
      const res = await loginApi(userInfo);
      console.log('📥 [DEBUG] loginApi response received:', res);
      
      // 后端返回格式: { message: "Login successful", token: "...", user: {...} }
      const data: any = res.data || res || {};
      console.log('📦 [DEBUG] Extracted data:', data);

      // 1) 提取 token（优先 token，其次 access_token）
      const tokenValue = data.token || data.access_token;
      console.log('🔑 [DEBUG] Token extracted:', tokenValue ? `${tokenValue.substring(0, 20)}...` : 'NO TOKEN');
      
      if (!tokenValue) {
        console.error('❌ [DEBUG] Login response missing token:', data);
        return Promise.reject(new Error('Login failed: Token not found in response'));
      }

      // 保存 token
      console.log('💾 [DEBUG] Saving token...');
      setToken(tokenValue);
      token.value = tokenValue;
      console.log('✅ [DEBUG] Token saved successfully');

      // 2) 提取并保存用户信息
      if (data.user) {
        console.log('👤 [DEBUG] Processing user data:', data.user);
        const user = data.user;
        const profile = user.image_path || user.image_url || user.avatar || defAva;
        name.value = user.username || user.userName || '';
        nickname.value = user.first_name && user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.username || '';
        avatar.value = profile;
        userId.value = user.id || user.userId || '';
        tenantId.value = user.tenantId || '';
        roles.value = user.role_type ? [user.role_type] : ['ROLE_DEFAULT'];
        permissions.value = [];
        console.log('✅ [DEBUG] User info saved:', {
          name: name.value,
          nickname: nickname.value,
          userId: userId.value,
          roles: roles.value
        });
      } else {
        console.warn('⚠️ [DEBUG] No user data in response');
      }

      console.log('✅ [DEBUG] Login completed successfully');
      return Promise.resolve();
    } catch (error: any) {
      console.error('❌ [DEBUG] Login error occurred:', error);
      console.error('❌ [DEBUG] Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      throw error;
    }
  };

  // 获取用户信息 - 调用真实API；若登录已写入用户信息，可直接返回
  // AURA: Modify - 添加 fallback 处理，当 API 失败时使用本地存储的信息
  const getInfo = async (): Promise<void> => {
    console.log('ℹ️ [DEBUG] getInfo called');
    
    // 如果已有用户信息（登录时保存的），直接返回成功
    if (roles.value.length > 0 && name.value) {
      console.log('✅ [DEBUG] Using cached user info');
      return Promise.resolve();
    }

    try {
      console.log('📤 [DEBUG] Fetching user info from API...');
      const res = await getInfoApi();
      console.log('📥 [DEBUG] getInfo response:', res);
      
      if (res.data) {
        const userInfo = res.data;
        const user = userInfo.user;
        const profileCandidate = user.image_path || user.image_url || user.avatar;
        const profile = profileCandidate == '' || profileCandidate == null ? defAva : profileCandidate;

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
        console.log('✅ [DEBUG] User info updated from API');
        return Promise.resolve();
      }
    } catch (error) {
      console.warn('⚠️ [DEBUG] getInfo API failed, using fallback:', error);
    }

    // Fallback: 如果有 token 但 API 失败，使用默认信息保持登录状态
    if (token.value) {
      console.log('🔄 [DEBUG] Using fallback user info');
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

    console.error('❌ [DEBUG] Failed to get user info and no token available');
    return Promise.reject(new Error('Failed to get user info and no token available'));
  };

  // 注销 - 使用Mock数据
  const logout = async (): Promise<void> => {
    console.log('🚪 [DEBUG] Logout called');
    // Mock logout - 不需要调用API
    token.value = '';
    roles.value = [];
    permissions.value = [];
    removeToken();
    console.log('✅ [DEBUG] Logout completed');
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

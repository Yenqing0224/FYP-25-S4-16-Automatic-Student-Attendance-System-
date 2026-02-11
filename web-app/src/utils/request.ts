import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useUserStore } from '@/store/modules/user';
import { getToken } from '@/utils/auth';
import { tansParams, blobValidate } from '@/utils/ruoyi';
import cache from '@/plugins/cache';
import { HttpStatus } from '@/enums/RespEnum';
import { errorCode } from '@/utils/errorCode';
import { LoadingInstance } from 'element-plus/es/components/loading/src/loading';
import FileSaver from 'file-saver';
import { encryptBase64, encryptWithAes, generateAesKey, decryptWithAes, decryptBase64 } from '@/utils/crypto';
import { encrypt, decrypt } from '@/utils/jsencrypt';
import { getLanguage } from '@/lang';
import router from '@/router';

const encryptHeader = 'encrypt-key';
let downloadLoadingInstance: LoadingInstance;
// 是否显示重新登录
export const isRelogin = { show: false };
export const globalHeaders = () => {
  return {
    Authorization: 'Bearer ' + getToken(),
    clientid: import.meta.env.VITE_APP_CLIENT_ID || 'e5cd7e4891bf95d1d19206ce24a7b32e'
  };
};

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8';
// 确保 clientid 有默认值，避免 undefined
axios.defaults.headers['clientid'] = import.meta.env.VITE_APP_CLIENT_ID || 'e5cd7e4891bf95d1d19206ce24a7b32e';
// 创建 axios 实例，带默认基础路径（当环境变量未配置时回退到 /api）
// 若提供 VITE_APP_BASE_URL（如 https://attendify-ekg6.onrender.com），则直连后端，跳过本地代理
const apiHost = (import.meta.env.VITE_APP_BASE_URL || '').replace(/\/+$/, '');
let baseApi = import.meta.env.VITE_APP_BASE_API;
if (!baseApi || baseApi.trim() === '') {
  baseApi = '/api';
}
if (!baseApi.startsWith('/')) {
  baseApi = '/' + baseApi;
}
const service = axios.create({
  baseURL: `${apiHost}${baseApi}`,
  timeout: 50000
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 对应国际化资源文件后缀
    config.headers['Content-Language'] = getLanguage();

    const isToken = config.headers?.isToken === false;
    // 是否需要防止数据重复提交
    const isRepeatSubmit = config.headers?.repeatSubmit === false;
    // 是否需要加密
    const isEncrypt = config.headers?.isEncrypt === 'true';
    
    // 删除这些内部配置项，避免被当作实际 HTTP 请求头发送
    delete config.headers.isToken;
    delete config.headers.repeatSubmit;
    delete config.headers.isEncrypt;

    if (getToken() && !isToken) {
      config.headers['Authorization'] = 'Token ' + getToken(); // 让每个请求携带自定义token 请根据实际情况自行修改
    }
    // get请求映射params参数
    if (config.method === 'get' && config.params) {
      let url = config.url + '?' + tansParams(config.params);
      url = url.slice(0, -1);
      config.params = {};
      config.url = url;
    }

    if (!isRepeatSubmit && (config.method === 'post' || config.method === 'put')) {
      const requestObj = {
        url: config.url,
        data: typeof config.data === 'object' ? JSON.stringify(config.data) : config.data,
        time: new Date().getTime()
      };
      const sessionObj = cache.session.getJSON('sessionObj');
      if (sessionObj === undefined || sessionObj === null || sessionObj === '') {
        cache.session.setJSON('sessionObj', requestObj);
      } else {
        const s_url = sessionObj.url; // 请求地址
        const s_data = sessionObj.data; // 请求数据
        const s_time = sessionObj.time; // 请求时间
        const interval = 500; // 间隔时间(ms)，小于此时间视为重复提交
        if (s_data === requestObj.data && requestObj.time - s_time < interval && s_url === requestObj.url) {
          const message = '数据正在处理，请勿重复提交';
          console.warn(`[${s_url}]: ` + message);
          return Promise.reject(new Error(message));
        } else {
          cache.session.setJSON('sessionObj', requestObj);
        }
      }
    }
    if (import.meta.env.VITE_APP_ENCRYPT === 'true') {
      // 当开启参数加密
      if (isEncrypt && (config.method === 'post' || config.method === 'put')) {
        // 生成一个 AES 密钥
        const aesKey = generateAesKey();
        config.headers[encryptHeader] = encrypt(encryptBase64(aesKey));
        config.data = typeof config.data === 'object' ? encryptWithAes(JSON.stringify(config.data), aesKey) : encryptWithAes(config.data, aesKey);
      }
    }
    // FormData数据去请求头Content-Type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (res: AxiosResponse) => {
    // 登录接口特殊处理 - 直接返回原始数据，避免被其他逻辑拦截
    if (res.config.url?.includes('/login/')) {
      console.log('✅ [Login] Response received, returning raw data');
      return Promise.resolve(res.data);
    }
    
    if (import.meta.env.VITE_APP_ENCRYPT === 'true') {
      // 加密后的 AES 秘钥
      const keyStr = res.headers[encryptHeader];
      // 加密
      if (keyStr != null && keyStr != '') {
        const data = res.data;
        // 请求体 AES 解密
        const base64Str = decrypt(keyStr);
        // base64 解码 得到请求头的 AES 秘钥
        const aesKey = decryptBase64(base64Str.toString());
        // aesKey 解码 data
        const decryptData = decryptWithAes(data, aesKey);
        // 将结果 (得到的是 JSON 字符串) 转为 JSON
        res.data = JSON.parse(decryptData);
      }
    }
    // 二进制数据则直接返回
    if (res.request.responseType === 'blob' || res.request.responseType === 'arraybuffer') {
      return res.data;
    }
    
    // HTTP 状态码 2xx 都视为成功
    if (res.status >= 200 && res.status < 300) {
      // 后端 Admin CRUD 格式: {status: "success", code: 200, data: {...}}
      if (res.data && res.data.status === 'success' && res.data.hasOwnProperty('data')) {
        return Promise.resolve(res.data.data);
      }
      // 其他成功格式，直接返回原始数据
      return Promise.resolve(res.data);
    }
    
    // 以下是错误处理（非 2xx 状态码）
    const code = res.data?.code || res.status || HttpStatus.SERVER_ERROR;
    const msg = errorCode[code] || res.data?.msg || res.data?.message || errorCode['default'];
    
    if (code === 401) {
      if (!isRelogin.show) {
        isRelogin.show = true;
        ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          isRelogin.show = false;
          useUserStore().logout().then(() => {
            router.replace({
              path: '/login',
              query: {
                redirect: encodeURIComponent(router.currentRoute.value.fullPath || '/')
              }
            })
          });
        }).catch(() => {
          isRelogin.show = false;
        });
      }
      return Promise.reject('无效的会话，或者会话已过期，请重新登录。');
    }
    
    ElNotification.error({ title: msg });
    return Promise.reject(new Error(msg));
  },
  (error: any) => {
    let errorMessage = error.message || 'Request failed';
    
    // 尝试从后端响应中提取详细错误信息
    if (error.response && error.response.data) {
      const data = error.response.data;
      if (data.message) {
        errorMessage = data.message;
      } else if (data.detail) {
        errorMessage = data.detail;
      } else if (data.email) {
        errorMessage = 'Email: ' + (Array.isArray(data.email) ? data.email[0] : data.email);
      } else if (data.username) {
        errorMessage = 'Username: ' + (Array.isArray(data.username) ? data.username[0] : data.username);
      } else if (data.student_id) {
        errorMessage = 'Student ID: ' + (Array.isArray(data.student_id) ? data.student_id[0] : data.student_id);
      } else if (typeof data === 'string') {
        errorMessage = data;
      } else if (data.non_field_errors) {
        errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
      }
    }
    
    // 创建一个包含详细信息的错误对象
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).response = error.response;
    (enhancedError as any).originalError = error;
    
    return Promise.reject(enhancedError);
  }
);
// 通用下载方法
export function download(url: string, params: any, fileName: string) {
  downloadLoadingInstance = ElLoading.service({ text: '正在下载数据，请稍候', background: 'rgba(0, 0, 0, 0.7)' });
  // prettier-ignore
  return service.post(url, params, {
      transformRequest: [
        (params: any) => {
          return tansParams(params);
        }
      ],
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      responseType: 'blob'
    }).then(async (resp: any) => {
      const isLogin = blobValidate(resp);
      if (isLogin) {
        const blob = new Blob([resp]);
        FileSaver.saveAs(blob, fileName);
      } else {
        const blob = new Blob([resp]);
        const resText = await blob.text();
        const rspObj = JSON.parse(resText);
        const errMsg = errorCode[rspObj.code] || rspObj.msg || errorCode['default'];
        ElMessage.error(errMsg);
      }
      downloadLoadingInstance.close();
    }).catch((r: any) => {
      console.error(r);
      ElMessage.error('下载文件出现错误，请联系管理员！');
      downloadLoadingInstance.close();
    });
}
// 导出 axios 实例
export default service;

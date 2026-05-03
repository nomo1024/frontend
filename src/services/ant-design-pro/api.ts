// @ts-ignore
/* eslint-disable */
import request from '@/plugins/globalRequest';

/** 获取当前的用户 GET /api/user/current */
export async function currentUser(options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.CurrentUser>>('/api/user/current', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 退出登录接口 POST /api/user/logout */
export async function outLogin(options?: { [key: string]: any }) {
  return request<API.BaseResponse<number>>('/api/user/logout', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 登录接口 POST /api/user/login */
export async function login(body: API.LoginParams, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.LoginResult>>('/api/user/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 注册接口 POST /api/user/register */
export async function register(body: API.RegisterParams, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.RegisterResult>>('/api/user/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 搜索用户 POST /api/user/search */
export async function searchUsers(body?: API.UserQueryRequest, options?: { [key: string]: any }) {
  const cleanBody: any = {};
  if (body) {
    Object.keys(body).forEach(key => {
      const val = (body as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        cleanBody[key] = val;
      }
    });
  }
  return request<API.BaseResponse<API.CurrentUser[]>>('/api/user/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: cleanBody,
    ...(options || {}),
  });
}

/** 更新用户 POST /api/user/update */
export async function updateUser(
  body: API.CurrentUser,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<number>>('/api/user/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除用户 */
export async function deleteUser(id: number) {
  return request<API.BaseResponse<boolean>>('/api/user/delete', {
    method: 'POST',
    data: id,
  });
}

/** 传感器相关接口 */
/** 开始写入传感器数据 */
export async function startSensor(source?: number) {
  return request<any>('/api/sensor/start', {
    method: 'GET',
    params: source ? { source } : {},
  });
}

/** 停止写入传感器数据 */
export async function stopSensor(source?: number) {
  return request<any>('/api/sensor/stop', {
    method: 'GET',
    params: source ? { source } : {},
  });
}

/** 查看传感器状态 */
export async function getSensorStatus(source?: number) {
  return request<any>('/api/sensor/status', {
    method: 'GET',
    params: source ? { source } : {},
  });
}

/** 读取传感器数据 */
export async function readSensorData(source?: number, limit: number = 100) {
  return request<any>('/api/sensor/read', {
    method: 'GET',
    params: { ...(source ? { source } : {}), limit },
  });
}

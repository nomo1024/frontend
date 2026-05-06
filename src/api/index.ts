import request from '@/utils/request'
import type {
  BaseResponse,
  CurrentUser,
  LoginParams,
  LoginResult,
  RegisterParams,
  RegisterResult,
  UserQueryRequest,
} from '@/types'

export function currentUser(): Promise<BaseResponse<CurrentUser>> {
  return request.get('/api/user/current')
}

export function outLogin(): Promise<BaseResponse<number>> {
  return request.post('/api/user/logout')
}

export function login(body: LoginParams): Promise<BaseResponse<LoginResult>> {
  return request.post('/api/user/login', body)
}

export function register(body: RegisterParams): Promise<BaseResponse<RegisterResult>> {
  return request.post('/api/user/register', body)
}

export function searchUsers(body?: UserQueryRequest): Promise<BaseResponse<CurrentUser[]>> {
  const cleanBody: Record<string, any> = {}
  if (body) {
    Object.keys(body).forEach((key) => {
      const val = (body as any)[key]
      if (val !== undefined && val !== null && val !== '') {
        cleanBody[key] = val
      }
    })
  }
  return request.post('/api/user/search', cleanBody)
}

export function updateUser(body: Partial<CurrentUser>): Promise<BaseResponse<number>> {
  return request.post('/api/user/update', body)
}

export function deleteUser(id: number): Promise<BaseResponse<boolean>> {
  return request.post('/api/user/delete', id)
}

export function startSensor(source?: number) {
  return request.get('/api/sensor/start', {
    params: source ? { source } : {},
  })
}

export function stopSensor(source?: number) {
  return request.get('/api/sensor/stop', {
    params: source ? { source } : {},
  })
}

export function getSensorStatus(source?: number) {
  return request.get('/api/sensor/status', {
    params: source ? { source } : {},
  })
}

export function readSensorData(source?: number, limit = 100) {
  return request.get('/api/sensor/read', {
    params: { ...(source ? { source } : {}), limit },
  })
}

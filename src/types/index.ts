export interface CurrentUser {
  id: number
  userAccount: string
  userPassword?: string
  phone: string
  email: string
  userStatus: number
  userRole: number
  createTime: Date | string
}

export interface LoginParams {
  userAccount?: string
  userPassword?: string
  autoLogin?: boolean
  type?: string
}

export interface RegisterParams {
  userAccount?: string
  userPassword?: string
  checkPassword?: string
  type?: string
}

export interface UserQueryRequest {
  id?: number
  userAccount?: string
  phone?: string
  email?: string
  userRole?: number
  userStatus?: number | string
  createTimeFrom?: Date | string
  createTimeTo?: Date | string
}

export interface BaseResponse<T> {
  code: number
  data: T
  message: string
  description: string
  length?: any
}

export interface LoginResult {
  status?: string
  type?: string
  currentAuthority?: string
  userRole?: number
}

export interface RegisterResult {
  id?: number
}

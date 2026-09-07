const STORAGE_KEY = 'tritalk.password'
export const AUTH_EVENT = 'tritalk:auth-required'

export function getPassword(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function setPassword(password: string) {
  localStorage.setItem(STORAGE_KEY, password)
}

/** 저장된 비밀번호를 지우고 앱에 재인증을 요구한다 (401 수신 시). */
export function invalidatePassword() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

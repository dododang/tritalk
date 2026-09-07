import { useEffect, useState, type ReactNode } from 'react'
import { AUTH_EVENT, getPassword, setPassword } from '../lib/auth'

/** 공유 비밀번호가 저장돼 있지 않으면 입력 화면을 먼저 보여준다. */
export default function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => getPassword() !== null)
  const [input, setInput] = useState('')

  useEffect(() => {
    const onAuthRequired = () => setUnlocked(false)
    window.addEventListener(AUTH_EVENT, onAuthRequired)
    return () => window.removeEventListener(AUTH_EVENT, onAuthRequired)
  }, [])

  if (unlocked) return children

  function handleSubmit() {
    const value = input.trim()
    if (!value) return
    setPassword(value)
    setInput('')
    setUnlocked(true)
  }

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-[#0a0a0f] p-6 text-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold">TriTalk</h1>
        <p className="mt-2 text-sm text-gray-500">비밀번호를 입력하세요</p>
      </div>
      <form
        className="flex w-full max-w-xs flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
          className="rounded-xl bg-white/5 px-4 py-3 text-center text-base outline-none focus:ring-2 focus:ring-violet-600"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          입장
        </button>
      </form>
    </div>
  )
}

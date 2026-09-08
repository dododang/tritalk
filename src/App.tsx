import { useCallback, useEffect, useState } from 'react'
import PasswordGate from './components/PasswordGate'
import ConversationPage from './pages/ConversationPage'
import LibraryPage from './pages/LibraryPage'
import TranslatePage from './pages/TranslatePage'

type Page = 'home' | 'translate' | 'conversation' | 'library'

const PAGES: Page[] = ['home', 'translate', 'conversation', 'library']

const MENUS: { id: Exclude<Page, 'home'>; label: string; icon: string; desc: string }[] = [
  { id: 'conversation', label: '대화', icon: '🎙', desc: '실시간 음성 통역' },
  { id: 'translate', label: '번역', icon: '文A', desc: '텍스트 번역' },
  { id: 'library', label: '라이브러리', icon: '☰', desc: '대화 기록 보기' },
]

function getPageFromHash(): Page {
  const h = location.hash.replace('#', '')
  return PAGES.includes(h as Page) ? (h as Page) : 'home'
}

function App() {
  const [page, setPage] = useState<Page>(getPageFromHash)

  // 메뉴 진입 시 히스토리에 push → iOS 스와이프 뒤로가기 동작
  const navigate = useCallback((p: Page) => {
    if (p === 'home') {
      history.back()
    } else {
      history.pushState(null, '', `#${p}`)
      setPage(p)
    }
  }, [])

  // 브라우저 뒤로가기 / iOS 스와이프 감지
  useEffect(() => {
    const onPop = () => setPage(getPageFromHash())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return (
    <PasswordGate>
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#0f1626] text-slate-100">
      {/* 상단 바 */}
      <header className="shrink-0 border-b border-white/10 bg-[#131d33] pt-[env(safe-area-inset-top)]">
        <div className="flex h-12 items-center px-4">
          <span className="text-lg font-bold text-sky-400">TriTalk</span>
        </div>
      </header>

      {/* 뒤로가기 */}
      {page !== 'home' && (
        <div className="shrink-0 bg-[#0f1626] px-3 py-2">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-base text-slate-400 active:bg-white/10 active:text-slate-200"
          >
            <span className="text-xl leading-none">&larr;</span>
            홈
          </button>
        </div>
      )}

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-none">
        {page === 'home' && (
          <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center gap-4 p-6">
            {MENUS.map(({ id, label, icon, desc }) => (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                className="flex w-full items-center gap-4 rounded-2xl bg-white/5 p-5 text-left transition-colors active:bg-white/10"
              >
                <span className="text-3xl">{icon}</span>
                <div>
                  <p className="text-base font-semibold text-slate-100">{label}</p>
                  <p className="text-sm text-slate-500">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {page === 'translate' && <TranslatePage />}
        {page === 'conversation' && <ConversationPage />}
        {page === 'library' && <LibraryPage />}
      </main>
    </div>
    </PasswordGate>
  )
}

export default App

import { useState } from 'react'
import PasswordGate from './components/PasswordGate'
import ConversationPage from './pages/ConversationPage'
import LibraryPage from './pages/LibraryPage'
import TranslatePage from './pages/TranslatePage'

type Tab = 'translate' | 'conversation' | 'library'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'translate', label: '번역', icon: '文A' },
  { id: 'conversation', label: '대화', icon: '🎙' },
  { id: 'library', label: '라이브러리', icon: '☰' },
]

function App() {
  const [tab, setTab] = useState<Tab>('conversation')

  return (
    <PasswordGate>
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#0f1626] text-slate-100">
      {/* 상단 바 */}
      <header className="shrink-0 border-b border-white/10 bg-[#131d33] pt-[env(safe-area-inset-top)]">
        <div className="flex h-12 items-center px-4">
          <span className="text-lg font-bold text-sky-400">TriTalk</span>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-none">
        {tab === 'translate' && <TranslatePage />}
        {tab === 'conversation' && <ConversationPage />}
        {tab === 'library' && <LibraryPage />}
      </main>

      {/* 하단 바 */}
      <nav className="shrink-0 border-t border-white/10 bg-[#131d33] pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors ${
                tab === id ? 'text-sky-400' : 'text-slate-500'
              }`}
            >
              <span className="text-lg leading-none">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
    </PasswordGate>
  )
}

export default App

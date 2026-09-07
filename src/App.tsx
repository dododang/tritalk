import { useState } from 'react'
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
    <div className="flex h-dvh flex-col bg-[#0a0a0f] text-gray-100">
      <main className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'translate' && <TranslatePage />}
        {tab === 'conversation' && <ConversationPage />}
        {tab === 'library' && <LibraryPage />}
      </main>

      <nav className="border-t border-white/10 bg-[#111118] pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors ${
                tab === id ? 'text-violet-400' : 'text-gray-500'
              }`}
            >
              <span className="text-lg leading-none">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default App

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import UtteranceBubble from '../components/UtteranceBubble'
import db, { type SessionRecord } from '../lib/db'

function formatStart(ts: number): string {
  return new Date(ts).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(s: SessionRecord): string {
  if (s.endedAt === null) return '진행 중'
  const min = Math.round((s.endedAt - s.startedAt) / 60000)
  return min < 1 ? '1분 미만' : `${min}분`
}

interface SessionSummary {
  session: SessionRecord
  count: number
  preview: string
}

/** 세션 목록 (최신순) */
function SessionList({ onSelect }: { onSelect: (s: SessionRecord) => void }) {
  const summaries = useLiveQuery(async (): Promise<SessionSummary[]> => {
    const sessions = await db.sessions.orderBy('startedAt').reverse().toArray()
    const result = await Promise.all(
      sessions.map(async (session) => {
        const count = await db.utterances.where('sessionId').equals(session.id).count()
        const first = await db.utterances.where('sessionId').equals(session.id).first()
        return { session, count, preview: first?.text ?? '' }
      }),
    )
    return result.filter((r) => r.count > 0)
  })

  if (!summaries) return null // 로딩 중 (IndexedDB라 순간임)

  if (summaries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-8">
        <p className="text-center text-sm text-gray-600">
          아직 대화 기록이 없습니다.
          <br />
          대화 탭에서 통역하면 자동으로 저장됩니다.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <h1 className="px-1 pb-1 text-lg font-semibold text-gray-100">대화 기록</h1>
      {summaries.map(({ session, count, preview }) => (
        <button
          key={session.id}
          type="button"
          onClick={() => onSelect(session)}
          className="rounded-2xl bg-white/5 p-4 text-left transition-colors active:bg-white/10"
        >
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-violet-400">{formatStart(session.startedAt)}</p>
            <p className="shrink-0 text-xs text-gray-500">
              {formatDuration(session)} · {count}개
            </p>
          </div>
          <p className="mt-1 truncate text-sm text-gray-300">{preview}</p>
        </button>
      ))}
    </div>
  )
}

/** 세션 상세 — 대화 탭과 동일한 버블로 열람 */
function SessionDetail({ session, onBack }: { session: SessionRecord; onBack: () => void }) {
  const utterances = useLiveQuery(
    () => db.utterances.where('sessionId').equals(session.id).sortBy('createdAt'),
    [session.id],
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/10 px-2 py-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg px-3 py-1.5 text-xl leading-none text-gray-400 active:bg-white/10"
          aria-label="뒤로"
        >
          ‹
        </button>
        <div>
          <p className="text-sm font-medium text-gray-100">{formatStart(session.startedAt)}</p>
          <p className="text-xs text-gray-500">
            {formatDuration(session)} · {utterances?.length ?? 0}개 발화
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {(utterances ?? []).map((u) => (
            <UtteranceBubble
              key={u.id}
              item={{ seq: u.id, status: 'done', lang: u.lang, text: u.text, translations: u.translations }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LibraryPage() {
  const [selected, setSelected] = useState<SessionRecord | null>(null)

  return (
    <div className="mx-auto h-full max-w-lg">
      {selected ? (
        <SessionDetail session={selected} onBack={() => setSelected(null)} />
      ) : (
        <SessionList onSelect={setSelected} />
      )}
    </div>
  )
}

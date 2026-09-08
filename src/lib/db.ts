import Dexie, { type EntityTable } from 'dexie'
import type { Lang } from './api'

/** 통역 세션 — 마이크 시작~정지 한 번이 세션 하나 */
export interface SessionRecord {
  id: number
  startedAt: number
  /** 진행 중이면 null */
  endedAt: number | null
}

/** 세션에 속한 발화 하나 (원문 + 번역 2개) */
export interface UtteranceRecord {
  id: number
  sessionId: number
  createdAt: number
  lang: Lang
  text: string
  translations: Partial<Record<Lang, string>>
}

const db = new Dexie('tritalk') as Dexie & {
  sessions: EntityTable<SessionRecord, 'id'>
  utterances: EntityTable<UtteranceRecord, 'id'>
}

db.version(1).stores({
  sessions: '++id, startedAt',
  utterances: '++id, sessionId, createdAt',
})

export default db

/** 종료됐는데 발화가 하나도 없는 빈 세션 정리 (앱 진입 시 호출) */
export async function pruneEmptySessions(): Promise<void> {
  const sessions = await db.sessions.toArray()
  for (const s of sessions) {
    if (s.endedAt === null) continue
    const count = await db.utterances.where('sessionId').equals(s.id).count()
    if (count === 0) await db.sessions.delete(s.id)
  }
}

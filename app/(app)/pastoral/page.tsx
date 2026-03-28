'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

// ─── 타입 ──────────────────────────────────────────────────
interface PastoralNote {
  id:           number;
  member_id:    number;
  member_name:  string;
  author_name?: string;
  category:     NoteCategory;
  content:      string;
  is_private:   boolean;
  visited_at?:  string;
  created_at:   string;
}
type NoteCategory = 'visit' | 'counsel' | 'prayer' | 'general';

function extractList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && 'items' in res && Array.isArray((res as any).items))
    return (res as any).items as T[];
  return [];
}

// ─── 카테고리 설정 ─────────────────────────────────────────
const CAT_CONFIG: Record<NoteCategory, { label: string; color: string; bg: string; border: string; icon: string }> = {
  visit:   { label: '심방',   color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: '🏠' },
  counsel: { label: '상담',   color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '💬' },
  prayer:  { label: '기도',   color: '#d97706', bg: '#fffbeb', border: '#fcd34d', icon: '🙏' },
  general: { label: '일반',   color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icon: '📝' },
};

// 최근 30일
const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

export default function PastoralPage() {
  const router = useRouter();
  const [notes,   setNotes]   = useState<PastoralNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat,     setCat]     = useState<'all' | NoteCategory>('all');
  const [search,  setSearch]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<unknown>('/api/v1/pastoral-notes?days=30&limit=100');
      const all = extractList<PastoralNote>(res);
      // 최근 30일 필터 (백엔드가 지원 안 할 경우 프론트에서 필터)
      const filtered = all.filter(n => !n.created_at || n.created_at >= THIRTY_DAYS_AGO);
      setNotes(filtered.length > 0 ? filtered : all.slice(0, 50));
    } catch { setNotes([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const catCounts = (['visit', 'counsel', 'prayer', 'general'] as NoteCategory[]).reduce((acc, c) => {
    acc[c] = notes.filter(n => n.category === c).length;
    return acc;
  }, {} as Record<string, number>);

  const displayed = notes
    .filter(n => cat === 'all' || n.category === cat)
    .filter(n => !search.trim() || n.member_name?.includes(search) || n.content?.includes(search));

  // 카테고리별 통계 카드
  const stats = [
    { key: 'visit',   ...CAT_CONFIG.visit,   count: catCounts.visit   ?? 0 },
    { key: 'counsel', ...CAT_CONFIG.counsel,  count: catCounts.counsel ?? 0 },
    { key: 'prayer',  ...CAT_CONFIG.prayer,   count: catCounts.prayer  ?? 0 },
    { key: 'general', ...CAT_CONFIG.general,  count: catCounts.general ?? 0 },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes slideIn { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:none} }
        .note-card:hover { background:#f8faff !important; border-color:#f0d88a !important; transform:translateY(-1px); box-shadow:0 4px 16px rgba(201,168,76,0.1) !important; }
      `}</style>

      <div style={{ padding: '36px 40px', maxWidth: '900px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#111827', letterSpacing: '-0.04em' }}>목양 현황</h1>
            <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#9ca3af' }}>최근 30일간의 심방·상담·기도 기록</p>
          </div>
        </div>

        {/* 통계 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
          {stats.map(s => (
            <div key={s.key} onClick={() => setCat(cat === s.key as NoteCategory ? 'all' : s.key as NoteCategory)}
              style={{ background: cat === s.key ? s.bg : '#fff', border: `1.5px solid ${cat === s.key ? s.border : '#f1f5f9'}`, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>{s.icon}</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.count}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 검색 + 탭 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            style={{ padding: '9px 13px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '13px', color: '#111827', outline: 'none', fontFamily: 'inherit', width: '220px' }}
            placeholder="교인명 또는 내용 검색"
            value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{ display: 'flex', gap: '5px' }}>
            {[{ key: 'all', label: '전체', icon: '📋' }, ...stats].map(t => {
              const sel = cat === t.key;
              const cfg = t.key !== 'all' ? CAT_CONFIG[t.key as NoteCategory] : null;
              return (
                <button key={t.key} onClick={() => setCat(t.key as 'all' | NoteCategory)}
                  style={{ padding: '6px 13px', borderRadius: '18px', border: `1.5px solid ${sel ? (cfg?.border ?? '#f0d88a') : '#e5e7eb'}`, background: sel ? (cfg?.bg ?? '#fdf8e8') : '#fff', color: sel ? (cfg?.color ?? '#c9a84c') : '#6b7280', fontSize: '12px', fontWeight: sel ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.14s' }}>
                  {(t as any).icon} {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 노트 목록 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '14px' }}>불러오는 중...</div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: '#f9fafb', borderRadius: '16px', border: '1.5px dashed #e5e7eb' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>📋</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>최근 30일 기록이 없습니다</div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>교인 상세 페이지에서 목양 노트를 작성해보세요</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeIn 0.2s ease' }}>
            {displayed.map(note => {
              const cfg = CAT_CONFIG[note.category] ?? CAT_CONFIG.general;
              return (
                <div key={note.id} className="note-card"
                  onClick={() => router.push(`/members/${note.member_id}`)}
                  style={{ background: '#fff', borderRadius: '12px', padding: '16px 18px', border: '1.5px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    {/* 카테고리 아이콘 */}
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{note.member_name}</span>
                        <span style={{ padding: '2px 8px', borderRadius: '10px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: '11px', fontWeight: 700 }}>{cfg.label}</span>
                        {note.is_private && (
                          <span style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            비공개
                          </span>
                        )}
                        <span style={{ fontSize: '11px', color: '#d1d5db', marginLeft: 'auto' }}>
                          {note.visited_at ?? new Date(note.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {note.is_private ? '🔒 비공개 노트입니다' : note.content}
                      </div>
                      {note.author_name && (
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '5px' }}>작성: {note.author_name}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

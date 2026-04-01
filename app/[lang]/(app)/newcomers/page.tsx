'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLangRouter } from '@/lib/i18n';
import { apiClient } from '@/lib/api';

// ─── 타입 ──────────────────────────────────────────────────
interface Newcomer {
  id:           number;
  name:         string;
  phone?:       string;
  email?:       string;
  visit_date?:  string;
  visit_route?: string;
  assignee_name?: string;
  status:       NewcomerStatus;
  memo?:        string;
}
interface Member { id: number; full_name?: string; name?: string; }

type NewcomerStatus = 'visited' | 'pending' | 'registered' | 'dropped';

// API 배열 추출 헬퍼
function extractList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && 'items' in res && Array.isArray((res as any).items))
    return (res as any).items as T[];
  return [];
}

// ─── 상태 설정 ─────────────────────────────────────────────
const STATUS_CONFIG: Record<NewcomerStatus, { label: string; color: string; bg: string; border: string; icon: string }> = {
  visited:    { label: '방문',     color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '👋' },
  pending:    { label: '등록대기', color: '#d97706', bg: '#fffbeb', border: '#fcd34d', icon: '⏳' },
  registered: { label: '등록완료', color: '#16a34a', bg: '#f0fdf4', border: '#86efac', icon: '✅' },
  dropped:    { label: '이탈',     color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', icon: '❌' },
};
const STATUS_TABS: Array<{ key: 'all' | NewcomerStatus; label: string }> = [
  { key: 'all',        label: '전체' },
  { key: 'visited',    label: '방문' },
  { key: 'pending',    label: '등록대기' },
  { key: 'registered', label: '등록완료' },
  { key: 'dropped',    label: '이탈' },
];
const VISIT_ROUTES = ['지인 소개', '인터넷 검색', '전도', '가족', '직접 방문', '기타'];

// ─── 공통 스타일 ────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: '9px',
  border: '1.5px solid #e5e7eb', fontSize: '14px', color: '#1a1a1a',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
};
const labelSt: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '5px', display: 'block',
};

// ─── 상태 뱃지 ─────────────────────────────────────────────
function StatusBadge({ status }: { status: NewcomerStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span style={{ padding: '3px 10px', borderRadius: '20px', background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: '11px', fontWeight: 700 }}>
      {c.icon} {c.label}
    </span>
  );
}

// ─── 등록 모달 ─────────────────────────────────────────────
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    visit_date: new Date().toISOString().slice(0, 10),
    visit_route: '', memo: '',
  });
  const [assigneeId,      setAssigneeId]      = useState<number | null>(null);
  const [assigneeName,    setAssigneeName]    = useState('');
  const [memberSearch,    setMemberSearch]    = useState('');
  const [memberResults,   setMemberResults]   = useState<Member[]>([]);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState('');

  useEffect(() => {
    if (!memberSearch.trim()) { setMemberResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await apiClient<unknown>(`/api/v1/members?search=${encodeURIComponent(memberSearch)}&limit=8`);
        setMemberResults(extractList<Member>(res));
      } catch { setMemberResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [memberSearch]);

  const submit = async () => {
    if (!form.name.trim()) { setError('이름을 입력해주세요.'); return; }
    setSaving(true); setError('');
    try {
      await apiClient('/api/v1/newcomers', {
        method: 'POST',
        body: JSON.stringify({ ...form, assignee_id: assigneeId }),
      });
      onCreated(); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '등록에 실패했습니다.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '520px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.03em' }}>새가족 등록</h2>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#9ca3af' }}>새로 방문한 분을 등록합니다</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f3f4f6', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {error && <div style={{ padding: '10px 14px', borderRadius: '9px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelSt}>이름 <span style={{ color: '#ef4444' }}>*</span></label>
            <input style={inputSt} placeholder="새가족 이름" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus />
          </div>

          <div className="r-grid-2" style={{ gap: '12px' }}>
            <div>
              <label style={labelSt}>전화번호</label>
              <input style={inputSt} placeholder="010-0000-0000" value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label style={labelSt}>이메일</label>
              <input style={inputSt} type="email" placeholder="example@email.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>

          <div className="r-grid-2" style={{ gap: '12px' }}>
            <div>
              <label style={labelSt}>방문일</label>
              <input style={inputSt} type="date" value={form.visit_date}
                onChange={e => setForm(p => ({ ...p, visit_date: e.target.value }))} />
            </div>
            <div>
              <label style={labelSt}>방문 경로</label>
              <select style={inputSt} value={form.visit_route}
                onChange={e => setForm(p => ({ ...p, visit_route: e.target.value }))}>
                <option value="">선택</option>
                {VISIT_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <label style={labelSt}>담당자</label>
            <input style={inputSt} placeholder="교인 이름 검색..."
              value={assigneeName || memberSearch}
              onChange={e => { setMemberSearch(e.target.value); setAssigneeName(''); setAssigneeId(null); }} />
            {memberResults.length > 0 && !assigneeId && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '9px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginTop: '2px', overflow: 'hidden' }}>
                {memberResults.map(m => {
                  const nm = (m as any).full_name || (m as any).name || '';
                  return (
                    <div key={m.id} onClick={() => { setAssigneeId(m.id); setAssigneeName(nm); setMemberSearch(''); setMemberResults([]); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f8faff'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#fff'}>
                      {nm}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label style={labelSt}>메모</label>
            <textarea style={{ ...inputSt, resize: 'vertical', minHeight: '72px' }}
              placeholder="특이사항, 요청사항 등..."
              value={form.memo} onChange={e => setForm(p => ({ ...p, memo: e.target.value }))} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
          <button onClick={submit} disabled={saving}
            style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: saving ? '#f0d88a' : 'linear-gradient(135deg,#c9a84c,#c9a84c)', color: saving ? '#d4b85c' : '#fff', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 4px 12px rgba(201,168,76,0.3)' }}>
            {saving ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 새가족 카드 ───────────────────────────────────────────
function NewcomerCard({ nc, onClick }: { nc: Newcomer; onClick: () => void }) {
  return (
    <div onClick={onClick}
      style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1.5px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.18s' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 8px 24px rgba(201,168,76,0.12)'; el.style.borderColor = '#f0d88a'; el.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; el.style.borderColor = '#f1f5f9'; el.style.transform = 'none'; }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#fdf8e8,#f0d88a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: '#c9a84c', flexShrink: 0 }}>
            {nc.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.02em' }}>{nc.name}</div>
            {nc.phone && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>{nc.phone}</div>}
          </div>
        </div>
        <StatusBadge status={nc.status} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {nc.visit_date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            방문일: <strong style={{ color: '#374151' }}>{nc.visit_date}</strong>
          </div>
        )}
        {nc.visit_route && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3h7l2 5-3 3 5 5 3-3 5 2v7"/></svg>
            경로: <strong style={{ color: '#374151' }}>{nc.visit_route}</strong>
          </div>
        )}
        {nc.assignee_name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            담당: <strong style={{ color: '#374151' }}>{nc.assignee_name}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 메인 페이지 ────────────────────────────────────────────
export default function NewcomersPage() {
  const router = useLangRouter();
  const [newcomers,    setNewcomers]    = useState<Newcomer[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState<'all' | NewcomerStatus>('all');
  const [search,       setSearch]       = useState('');
  const [showCreate,   setShowCreate]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setNewcomers(extractList<Newcomer>(await apiClient<unknown>('/api/v1/newcomers'))); }
    catch { setNewcomers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = STATUS_TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'all' ? newcomers.length : newcomers.filter(n => n.status === t.key).length;
    return acc;
  }, {} as Record<string, number>);

  const displayed = newcomers
    .filter(n => tab === 'all' || n.status === tab)
    .filter(n => !search.trim() || n.name.includes(search.trim()));

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .nc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; }
        @media(max-width:640px){ .nc-grid{ grid-template-columns:1fr; } }
      `}</style>

      <div className="page-content" style={{ maxWidth: '1000px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.04em' }}>새가족 관리</h1>
            <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#9ca3af' }}>방문 새가족을 관리하고 교인으로 연결합니다</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '11px', border: 'none', background: 'linear-gradient(135deg,#c9a84c,#c9a84c)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(201,168,76,0.35)', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            새가족 등록
          </button>
        </div>

        {/* 검색 */}
        <div style={{ marginBottom: '16px' }}>
          <input style={{ ...inputSt, maxWidth: '280px' }} placeholder="이름 검색..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {STATUS_TABS.map(t => {
            const sel = tab === t.key;
            const cfg = t.key !== 'all' ? STATUS_CONFIG[t.key as NewcomerStatus] : null;
            return (
              <button key={t.key} onClick={() => setTab(t.key as 'all' | NewcomerStatus)}
                style={{ padding: '7px 16px', borderRadius: '20px', border: `1.5px solid ${sel ? (cfg?.border ?? '#c9a84c') : '#e5e7eb'}`, background: sel ? (cfg?.bg ?? '#fdf8e8') : '#fff', color: sel ? (cfg?.color ?? '#c9a84c') : '#6b7280', fontSize: '13px', fontWeight: sel ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                {t.label}
                <span style={{ marginLeft: '5px', padding: '1px 6px', borderRadius: '10px', background: sel ? 'rgba(255,255,255,0.5)' : '#f3f4f6', fontSize: '11px', fontWeight: 700 }}>
                  {counts[t.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* 목록 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', fontSize: '14px' }}>불러오는 중...</div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: '#f9fafb', borderRadius: '16px', border: '1.5px dashed #e5e7eb' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👋</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              {search ? '검색 결과가 없습니다' : '등록된 새가족이 없습니다'}
            </div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>새가족 등록 버튼으로 추가해보세요</div>
            {!search && (
              <button onClick={() => setShowCreate(true)}
                style={{ padding: '9px 20px', borderRadius: '10px', border: 'none', background: '#c9a84c', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                + 새가족 등록
              </button>
            )}
          </div>
        ) : (
          <div className="nc-grid" style={{ animation: 'fadeIn 0.2s ease' }}>
            {displayed.map(nc => (
              <NewcomerCard key={nc.id} nc={nc} onClick={() => router.push(`/newcomers/${nc.id}`)} />
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </>
  );
}

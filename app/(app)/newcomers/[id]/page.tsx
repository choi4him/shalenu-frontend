'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

// ─── 타입 ──────────────────────────────────────────────────
interface Newcomer {
  id:            number;
  name:          string;
  phone?:        string;
  email?:        string;
  visit_date?:   string;
  visit_route?:  string;
  assignee_id?:  number;
  assignee_name?: string;
  status:        NewcomerStatus;
  memo?:         string;
}
interface HistoryItem {
  id:         number;
  status:     NewcomerStatus;
  note?:      string;
  created_at: string;
  created_by_name?: string;
}
interface Member { id: number; full_name?: string; name?: string; }

type NewcomerStatus = 'visited' | 'pending' | 'registered' | 'dropped';

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

// 상태 진행 순서 (다음 상태)
const NEXT_STATUS: Partial<Record<NewcomerStatus, NewcomerStatus>> = {
  visited:  'pending',
  pending:  'registered',
};

const VISIT_ROUTES = ['지인 소개', '인터넷 검색', '전도', '가족', '직접 방문', '기타'];

// ─── 스타일 ────────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: '9px',
  border: '1.5px solid #e5e7eb', fontSize: '14px', color: '#1a1a1a',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
};
const labelSt: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '4px', display: 'block',
};

// ─── 상태 뱃지 ─────────────────────────────────────────────
function StatusBadge({ status }: { status: NewcomerStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span style={{ padding: '4px 12px', borderRadius: '20px', background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: '12px', fontWeight: 700 }}>
      {c.icon} {c.label}
    </span>
  );
}

// ─── 메인 페이지 ────────────────────────────────────────────
export default function NewcomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [nc,           setNc]           = useState<Newcomer | null>(null);
  const [history,      setHistory]      = useState<HistoryItem[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [editing,      setEditing]      = useState(false);
  const [editForm,     setEditForm]     = useState<Partial<Newcomer>>({});
  const [saving,       setSaving]       = useState(false);
  const [alert,        setAlert]        = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // 담당자 검색
  const [memberSearch,  setMemberSearch]  = useState('');
  const [memberResults, setMemberResults] = useState<Member[]>([]);

  const load = useCallback(async () => {
    try {
      const [ncRes, histRes] = await Promise.allSettled([
        apiClient<Newcomer>(`/api/v1/newcomers/${id}`),
        apiClient<unknown>(`/api/v1/newcomers/${id}/history`),
      ]);
      if (ncRes.status === 'fulfilled') {
        setNc(ncRes.value);
        setEditForm(ncRes.value);
      }
      if (histRes.status === 'fulfilled') {
        setHistory(extractList<HistoryItem>(histRes.value));
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // 담당자 검색
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

  const showAlert = (type: 'ok' | 'err', msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  // 기본 정보 저장
  const saveEdit = async () => {
    setSaving(true);
    try {
      await apiClient(`/api/v1/newcomers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      await load();
      setEditing(false);
      showAlert('ok', '저장되었습니다.');
    } catch (e) {
      showAlert('err', e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally { setSaving(false); }
  };

  // 상태 변경
  const changeStatus = async (newStatus: NewcomerStatus) => {
    if (newStatus === 'registered') {
      if (!confirm('교인으로 등록하시겠습니까?\n등록완료 처리 후 교인 목록에 자동으로 추가됩니다.')) return;
    }
    setStatusLoading(true);
    try {
      await apiClient(`/api/v1/newcomers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await load();
      showAlert('ok', `상태가 "${STATUS_CONFIG[newStatus].label}"(으)로 변경되었습니다.`);
    } catch (e) {
      showAlert('err', e instanceof Error ? e.message : '상태 변경에 실패했습니다.');
    } finally { setStatusLoading(false); }
  };

  const markDropped = async () => {
    if (!confirm('이탈 처리하시겠습니까?')) return;
    await changeStatus('dropped');
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중...</div>;
  if (!nc) return <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>새가족 정보를 찾을 수 없습니다.</div>;

  const nextStatus = NEXT_STATUS[nc.status];

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes slideIn { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:none} }
        .inp-edit:focus { border-color:#c9a84c !important; box-shadow:0 0 0 3px rgba(201,168,76,0.1); }
      `}</style>

      <div className="page-content" style={{ maxWidth: '760px', animation: 'fadeIn 0.2s ease' }}>
        {/* 뒤로가기 */}
        <button onClick={() => router.push('/newcomers')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', padding: '0 0 20px', fontWeight: 500 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          새가족 목록으로
        </button>

        {/* 알림 */}
        {alert && (
          <div style={{ padding: '10px 16px', borderRadius: '10px', background: alert.type === 'ok' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${alert.type === 'ok' ? '#86efac' : '#fca5a5'}`, color: alert.type === 'ok' ? '#16a34a' : '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: '16px', animation: 'slideIn 0.2s ease' }}>
            {alert.type === 'ok' ? '✓' : '✕'} {alert.msg}
          </div>
        )}

        {/* 기본 정보 카드 */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg,#fdf8e8,#f0d88a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: '#c9a84c', flexShrink: 0 }}>
                {nc.name.charAt(0)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.03em' }}>{nc.name}</h1>
                  <StatusBadge status={nc.status} />
                </div>
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                  방문일: {nc.visit_date ?? '미기록'} · {nc.visit_route ?? '경로 미기록'}
                </div>
              </div>
            </div>
            {!editing ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => { setEditing(true); setEditForm(nc); setMemberSearch(''); }}
                  style={{ padding: '8px 16px', borderRadius: '9px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✏️ 편집
                </button>
                {nextStatus && (
                  <button onClick={() => changeStatus(nextStatus)} disabled={statusLoading}
                    style={{ padding: '8px 16px', borderRadius: '9px', border: 'none', background: `linear-gradient(135deg,${STATUS_CONFIG[nextStatus].color},${STATUS_CONFIG[nextStatus].color}cc)`, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: statusLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: `0 3px 10px ${STATUS_CONFIG[nextStatus].color}44` }}>
                    {statusLoading ? '처리 중...' : `→ ${STATUS_CONFIG[nextStatus].label}`}
                  </button>
                )}
                {nc.status !== 'dropped' && nc.status !== 'registered' && (
                  <button onClick={markDropped} disabled={statusLoading}
                    style={{ padding: '8px 14px', borderRadius: '9px', border: '1.5px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    이탈 처리
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setEditing(false)}
                  style={{ padding: '8px 16px', borderRadius: '9px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  취소
                </button>
                <button onClick={saveEdit} disabled={saving}
                  style={{ padding: '8px 16px', borderRadius: '9px', border: 'none', background: saving ? '#f0d88a' : 'linear-gradient(135deg,#c9a84c,#c9a84c)', color: saving ? '#d4b85c' : '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            )}
          </div>

          {/* 상태 진행 바 */}
          {nc.status !== 'dropped' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '20px', background: '#f9fafb', borderRadius: '10px', padding: '12px 16px' }}>
              {(['visited', 'pending', 'registered'] as NewcomerStatus[]).map((s, i) => {
                const c = STATUS_CONFIG[s];
                const done = ['visited', 'pending', 'registered'].indexOf(nc.status) >= i;
                const current = nc.status === s;
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: done ? c.color : '#e5e7eb', color: done ? '#fff' : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, border: current ? `3px solid ${c.color}` : 'none', boxShadow: current ? `0 0 0 3px ${c.bg}` : 'none', transition: 'all 0.2s' }}>
                        {done ? (current ? c.icon : '✓') : (i + 1)}
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: current ? 700 : 500, color: done ? c.color : '#9ca3af', whiteSpace: 'nowrap' }}>{c.label}</span>
                    </div>
                    {i < 2 && (
                      <div style={{ flex: 1, height: '2px', background: done && nc.status !== s ? c.color : '#e5e7eb', margin: '0 4px', marginBottom: '14px', transition: 'background 0.3s' }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 정보 편집 */}
          {editing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelSt}>이름</label>
                <input className="inp-edit" style={inputSt} value={editForm.name ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={labelSt}>전화번호</label>
                <input className="inp-edit" style={inputSt} value={editForm.phone ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label style={labelSt}>이메일</label>
                <input className="inp-edit" style={inputSt} type="email" value={editForm.email ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label style={labelSt}>방문일</label>
                <input className="inp-edit" style={inputSt} type="date" value={editForm.visit_date ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, visit_date: e.target.value }))} />
              </div>
              <div>
                <label style={labelSt}>방문 경로</label>
                <select className="inp-edit" style={inputSt} value={editForm.visit_route ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, visit_route: e.target.value }))}>
                  <option value="">선택</option>
                  {VISIT_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1', position: 'relative' }}>
                <label style={labelSt}>담당자</label>
                <input className="inp-edit" style={inputSt} placeholder="교인 이름 검색..."
                  value={editForm.assignee_name || memberSearch}
                  onChange={e => { setMemberSearch(e.target.value); setEditForm(p => ({ ...p, assignee_name: '', assignee_id: undefined })); }} />
                {memberResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '9px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginTop: '2px', overflow: 'hidden' }}>
                    {memberResults.map(m => {
                      const nm = (m as any).full_name || (m as any).name || '';
                      return (
                        <div key={m.id} onClick={() => { setEditForm(p => ({ ...p, assignee_id: m.id, assignee_name: nm })); setMemberSearch(''); setMemberResults([]); }}
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
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelSt}>메모</label>
                <textarea className="inp-edit" style={{ ...inputSt, resize: 'vertical', minHeight: '80px' }}
                  value={editForm.memo ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, memo: e.target.value }))} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: '전화번호', value: nc.phone },
                { label: '이메일',   value: nc.email },
                { label: '방문일',   value: nc.visit_date },
                { label: '방문 경로', value: nc.visit_route },
                { label: '담당자',   value: nc.assignee_name },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '12px 14px', borderRadius: '10px', background: '#f9fafb', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '3px' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: value ? '#111827' : '#d1d5db' }}>{value ?? '—'}</div>
                </div>
              ))}
              {nc.memo && (
                <div style={{ gridColumn: '1/-1', padding: '12px 14px', borderRadius: '10px', background: '#f9fafb', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '3px' }}>메모</div>
                  <div style={{ fontSize: '14px', color: '#374151', whiteSpace: 'pre-wrap' }}>{nc.memo}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 이력 타임라인 */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '4px', height: '18px', background: 'linear-gradient(#c9a84c,#c9a84c)', borderRadius: '99px' }} />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>상태 변경 이력</span>
          </div>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '13px' }}>
              이력이 없습니다
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* 타임라인 선 */}
              <div style={{ position: 'absolute', left: '15px', top: '8px', bottom: '8px', width: '2px', background: '#f1f5f9' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {history.map((h, i) => {
                  const c = STATUS_CONFIG[h.status];
                  return (
                    <div key={h.id} style={{ display: 'flex', gap: '14px', paddingBottom: i < history.length - 1 ? '16px' : '0', position: 'relative' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: c.bg, border: `2px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, zIndex: 1 }}>
                        {c.icon}
                      </div>
                      <div style={{ flex: 1, background: '#f9fafb', borderRadius: '10px', padding: '10px 14px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: h.note ? '5px' : '0' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: c.color }}>{c.label}</span>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                            {h.created_at ? new Date(h.created_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                            {h.created_by_name ? ` · ${h.created_by_name}` : ''}
                          </span>
                        </div>
                        {h.note && <div style={{ fontSize: '12px', color: '#6b7280' }}>{h.note}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

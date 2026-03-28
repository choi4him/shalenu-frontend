'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

// ─── 타입 ──────────────────────────────────────────────────
interface Worship { id: number; name: string; }
interface Group   { id: number; name: string; type: string; }
interface Member  { id: number; full_name?: string; name?: string; phone?: string; }
interface GroupMember { id: number; member_id: number; full_name?: string; name?: string; role: string; }

// API 응답에서 배열 추출 (배열 직접 or { items: [] } 페이지네이션 형태 모두 처리)
function extractList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && 'items' in res && Array.isArray((res as any).items)) {
    return (res as any).items as T[];
  }
  return [];
}
// 교인 이름 추출 (name 또는 full_name 필드 대응)
function getMemberName(m: Member | GroupMember): string {
  return (m as any).full_name || (m as any).name || '(이름 없음)';
}

type AttStatus = 'present' | 'absent' | 'late' | 'online';

const STATUS_CONFIG: Record<AttStatus, { label: string; color: string; bg: string; border: string }> = {
  present: { label: '출석', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  absent:  { label: '결석', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  late:    { label: '지각', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  online:  { label: '온라인', color: '#c9a84c', bg: '#fdf8e8', border: '#e8d48b' },
};

const STATUS_ORDER: AttStatus[] = ['present', 'absent', 'late', 'online'];

// ─── 날짜 유틸 ─────────────────────────────────────────────
function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}
function fmtDate(s: string) {
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

// ─── 출석 행 컴포넌트 ─────────────────────────────────────
function AttRow({ name, memberId, status, onChange }: {
  name: string; memberId: number;
  status: AttStatus; onChange: (id: number, s: AttStatus) => void;
}) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', borderRadius:'11px', background:'#fff', border:'1px solid #f1f5f9', marginBottom:'6px', transition:'all 0.12s' }}>
      {/* 아바타 */}
      <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:'linear-gradient(135deg,#fdf8e8,#f0d88a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:800, color:'#c9a84c', flexShrink:0 }}>
        {name.charAt(0)}
      </div>
      <span style={{ flex:1, fontSize:'14px', fontWeight:600, color:'#111827' }}>{name}</span>
      {/* 상태 버튼 그룹 */}
      <div style={{ display:'flex', gap:'5px' }}>
        {STATUS_ORDER.map(s => {
          const c = STATUS_CONFIG[s];
          const sel = status === s;
          return (
            <button key={s} onClick={() => onChange(memberId, s)}
              style={{ padding:'5px 11px', borderRadius:'20px', border:`1.5px solid ${sel ? c.border : '#e5e7eb'}`, background:sel ? c.bg : '#fff', color:sel ? c.color : '#9ca3af', fontSize:'12px', fontWeight:sel ? 700 : 500, cursor:'pointer', fontFamily:'inherit', transition:'all 0.13s' }}>
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── 예배 출석 탭 ─────────────────────────────────────────
function WorshipTab({ date }: { date: string }) {
  const [worships,   setWorships]   = useState<Worship[]>([]);
  const [worshipId,  setWorshipId]  = useState<number | ''>('');
  const [members,    setMembers]    = useState<Member[]>([]);
  const [statusMap,  setStatusMap]  = useState<Record<number, AttStatus>>({});
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [quickAll,   setQuickAll]   = useState<AttStatus | ''>('');

  // 예배 목록
  useEffect(() => {
    apiClient<unknown>('/api/v1/worship').then(res => {
      const list = extractList<Worship>(res);
      setWorships(list);
      if (list.length) setWorshipId(list[0].id);
    }).catch(() => {});
  }, []);

  // 교인 목록
  useEffect(() => {
    setLoading(true);
    apiClient<unknown>('/api/v1/members?limit=500&size=500')
      .then(res => {
        const list = extractList<Member>(res);
        setMembers(list);
        const init: Record<number, AttStatus> = {};
        list.forEach(m => { init[m.id] = 'present'; });
        setStatusMap(init);
      })
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleStatus = (id: number, s: AttStatus) => {
    setStatusMap(p => ({ ...p, [id]: s }));
    setSaved(false);
  };

  const applyQuickAll = (s: AttStatus) => {
    const next: Record<number, AttStatus> = {};
    members.forEach(m => { next[m.id] = s; });
    setStatusMap(next);
    setQuickAll(s);
    setSaved(false);
  };

  const save = async () => {
    if (!worshipId) { setError('예배를 선택해주세요.'); return; }
    setSaving(true); setError('');
    const records = members.map(m => ({ member_id: m.id, status: statusMap[m.id] ?? 'present', worship_id: worshipId, date }));
    try {
      await apiClient('/api/v1/attendance/batch', { method: 'POST', body: JSON.stringify({ records }) });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally { setSaving(false); }
  };

  const filtered = search.trim() ? members.filter(m => getMemberName(m).includes(search.trim())) : members;
  const counts = STATUS_ORDER.reduce((acc, s) => { acc[s] = Object.values(statusMap).filter(v => v === s).length; return acc; }, {} as Record<AttStatus, number>);

  return (
    <div>
      {/* 예배 선택 + 일괄 적용 */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'14px', flexWrap:'wrap', alignItems:'center' }}>
        <select value={worshipId} onChange={e => setWorshipId(Number(e.target.value))}
          style={{ padding:'9px 13px', borderRadius:'9px', border:'1.5px solid #e5e7eb', fontSize:'13px', color:'#111827', fontFamily:'inherit', outline:'none', background:'#fff', minWidth:'160px' }}>
          <option value="">예배 선택</option>
          {worships.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <div style={{ flex:1, minWidth:'160px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="교인 이름 검색..." style={{ width:'100%', padding:'9px 13px', borderRadius:'9px', border:'1.5px solid #e5e7eb', fontSize:'13px', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>
        {/* 일괄 빠른 적용 */}
        <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
          <span style={{ fontSize:'12px', color:'#9ca3af', marginRight:'2px' }}>일괄:</span>
          {STATUS_ORDER.map(s => {
            const c = STATUS_CONFIG[s];
            return (
              <button key={s} onClick={() => applyQuickAll(s)}
                style={{ padding:'5px 10px', borderRadius:'18px', border:`1.5px solid ${quickAll===s?c.border:'#e5e7eb'}`, background:quickAll===s?c.bg:'#fff', color:quickAll===s?c.color:'#6b7280', fontSize:'11px', fontWeight:quickAll===s?700:500, cursor:'pointer', fontFamily:'inherit' }}>
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 요약 카드 */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'14px', flexWrap:'wrap' }}>
        {STATUS_ORDER.map(s => {
          const c = STATUS_CONFIG[s];
          const total = members.length;
          const cnt = counts[s];
          return (
            <div key={s} style={{ flex:'1 1 80px', minWidth:'80px', padding:'10px 14px', borderRadius:'10px', background:c.bg, border:`1px solid ${c.border}` }}>
              <div style={{ fontSize:'11px', color:c.color, fontWeight:700, marginBottom:'3px' }}>{c.label}</div>
              <div style={{ fontSize:'20px', fontWeight:800, color:c.color }}>{cnt}</div>
              <div style={{ fontSize:'10px', color:`${c.color}88` }}>{total ? Math.round(cnt/total*100) : 0}%</div>
            </div>
          );
        })}
      </div>

      {/* 교인 목록 */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#9ca3af' }}>불러오는 중...</div>
      ) : (
        <div style={{ maxHeight:'calc(100vh - 420px)', overflowY:'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'30px', color:'#9ca3af' }}>교인이 없습니다</div>
          ) : filtered.map(m => (
            <AttRow key={m.id} name={getMemberName(m)} memberId={m.id}
              status={statusMap[m.id] ?? 'present'} onChange={handleStatus} />
          ))}
        </div>
      )}

      {/* 에러 + 저장 */}
      {error && <div style={{ padding:'9px 13px', borderRadius:'9px', background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'13px', marginTop:'10px' }}>{error}</div>}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'14px' }}>
        {saved && <span style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'13px', color:'#16a34a' }}>✓ 저장되었습니다</span>}
        <button onClick={save} disabled={saving}
          style={{ padding:'10px 24px', borderRadius:'10px', border:'none', background:saving?'#f0d88a':'linear-gradient(135deg,#c9a84c,#c9a84c)', color:saving?'#d4b85c':'#fff', fontSize:'14px', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:saving?'none':'0 4px 12px rgba(201,168,76,0.3)' }}>
          {saving ? '저장 중...' : '일괄 저장'}
        </button>
      </div>
    </div>
  );
}

// ─── 구역 출석 탭 ─────────────────────────────────────────
function GroupTab({ date }: { date: string }) {
  const [groups,    setGroups]    = useState<Group[]>([]);
  const [groupId,   setGroupId]   = useState<number | ''>('');
  const [members,   setMembers]   = useState<GroupMember[]>([]);
  const [statusMap, setStatusMap] = useState<Record<number, AttStatus>>({});
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState('');
  const [quickAll,  setQuickAll]  = useState<AttStatus | ''>('');

  useEffect(() => {
    apiClient<unknown>('/api/v1/groups').then(res => {
      const list = extractList<Group>(res);
      setGroups(list);
    }).catch(() => {});
  }, []);

  const loadGroupMembers = useCallback(async (gid: number) => {
    setLoading(true);
    try {
      const res = await apiClient<unknown>(`/api/v1/groups/${gid}/members`);
      const list = extractList<GroupMember>(res);
      setMembers(list);
      const init: Record<number, AttStatus> = {};
      list.forEach(m => { init[m.member_id] = 'present'; });
      setStatusMap(init);
    } catch {
      setMembers([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (groupId) loadGroupMembers(Number(groupId));
    else { setMembers([]); setStatusMap({}); }
  }, [groupId, loadGroupMembers]);

  const handleStatus = (id: number, s: AttStatus) => {
    setStatusMap(p => ({ ...p, [id]: s }));
    setSaved(false);
  };

  const applyQuickAll = (s: AttStatus) => {
    const next: Record<number, AttStatus> = {};
    members.forEach(m => { next[m.member_id] = s; });
    setStatusMap(next);
    setQuickAll(s);
    setSaved(false);
  };

  const save = async () => {
    if (!groupId) { setError('구역을 선택해주세요.'); return; }
    setSaving(true); setError('');
    const records = members.map(m => ({ member_id: m.member_id, status: statusMap[m.member_id] ?? 'present', group_id: groupId, date }));
    try {
      await apiClient('/api/v1/attendance/batch', { method: 'POST', body: JSON.stringify({ records }) });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally { setSaving(false); }
  };

  const counts = STATUS_ORDER.reduce((acc, s) => { acc[s] = Object.values(statusMap).filter(v => v === s).length; return acc; }, {} as Record<AttStatus, number>);

  return (
    <div>
      <div style={{ display:'flex', gap:'10px', marginBottom:'14px', flexWrap:'wrap', alignItems:'center' }}>
        <select value={groupId} onChange={e => { setGroupId(Number(e.target.value)); setSaved(false); }}
          style={{ padding:'9px 13px', borderRadius:'9px', border:'1.5px solid #e5e7eb', fontSize:'13px', color:'#111827', fontFamily:'inherit', outline:'none', background:'#fff', minWidth:'160px' }}>
          <option value="">구역 선택</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.type})</option>)}
        </select>
        {members.length > 0 && (
          <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
            <span style={{ fontSize:'12px', color:'#9ca3af', marginRight:'2px' }}>일괄:</span>
            {STATUS_ORDER.map(s => {
              const c = STATUS_CONFIG[s];
              return (
                <button key={s} onClick={() => applyQuickAll(s)}
                  style={{ padding:'5px 10px', borderRadius:'18px', border:`1.5px solid ${quickAll===s?c.border:'#e5e7eb'}`, background:quickAll===s?c.bg:'#fff', color:quickAll===s?c.color:'#6b7280', fontSize:'11px', fontWeight:quickAll===s?700:500, cursor:'pointer', fontFamily:'inherit' }}>
                  {c.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {groupId && members.length > 0 && (
        <div style={{ display:'flex', gap:'8px', marginBottom:'14px', flexWrap:'wrap' }}>
          {STATUS_ORDER.map(s => {
            const c = STATUS_CONFIG[s];
            const total = members.length;
            const cnt = counts[s];
            return (
              <div key={s} style={{ flex:'1 1 80px', minWidth:'80px', padding:'10px 14px', borderRadius:'10px', background:c.bg, border:`1px solid ${c.border}` }}>
                <div style={{ fontSize:'11px', color:c.color, fontWeight:700, marginBottom:'3px' }}>{c.label}</div>
                <div style={{ fontSize:'20px', fontWeight:800, color:c.color }}>{cnt}</div>
                <div style={{ fontSize:'10px', color:`${c.color}88` }}>{total ? Math.round(cnt/total*100) : 0}%</div>
              </div>
            );
          })}
        </div>
      )}

      {!groupId ? (
        <div style={{ textAlign:'center', padding:'48px', background:'#f9fafb', borderRadius:'14px', border:'1.5px dashed #e5e7eb' }}>
          <div style={{ fontSize:'36px', marginBottom:'10px' }}>🏘️</div>
          <div style={{ fontSize:'14px', color:'#6b7280' }}>구역을 선택하면 구역원 목록이 표시됩니다</div>
        </div>
      ) : loading ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#9ca3af' }}>불러오는 중...</div>
      ) : members.length === 0 ? (
        <div style={{ textAlign:'center', padding:'30px', color:'#9ca3af' }}>구역원이 없습니다</div>
      ) : (
        <div style={{ maxHeight:'calc(100vh - 440px)', overflowY:'auto' }}>
          {members.map(m => (
            <AttRow key={m.id} name={getMemberName(m)} memberId={m.member_id}
              status={statusMap[m.member_id] ?? 'present'} onChange={handleStatus} />
          ))}
        </div>
      )}

      {error && <div style={{ padding:'9px 13px', borderRadius:'9px', background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'13px', marginTop:'10px' }}>{error}</div>}
      {groupId && members.length > 0 && (
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'14px' }}>
          {saved && <span style={{ display:'flex', alignItems:'center', fontSize:'13px', color:'#16a34a' }}>✓ 저장되었습니다</span>}
          <button onClick={save} disabled={saving}
            style={{ padding:'10px 24px', borderRadius:'10px', border:'none', background:saving?'#f0d88a':'linear-gradient(135deg,#c9a84c,#c9a84c)', color:saving?'#d4b85c':'#fff', fontSize:'14px', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:saving?'none':'0 4px 12px rgba(201,168,76,0.3)' }}>
            {saving ? '저장 중...' : '일괄 저장'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────
export default function AttendancePage() {
  const router = useRouter();
  const [tab,  setTab]  = useState<'worship' | 'group'>('worship');
  const [date, setDate] = useState(toDateStr(new Date()));

  const changeDate = (delta: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setDate(toDateStr(d));
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
      `}</style>
      <div style={{ padding:'36px 40px', maxWidth:'880px', animation:'fadeIn 0.2s ease' }}>
        {/* 헤더 */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h1 style={{ margin:0, fontSize:'26px', fontWeight:800, color:'#111827', letterSpacing:'-0.04em' }}>출석 관리</h1>
            <p style={{ margin:'5px 0 0', fontSize:'13px', color:'#9ca3af' }}>예배 및 구역별 출석을 기록합니다</p>
          </div>
          <button onClick={() => router.push('/attendance/stats')}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 16px', borderRadius:'10px', border:'1.5px solid #c9a84c', background:'#fdf8e8', color:'#c9a84c', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            출석 통계 보기
          </button>
        </div>

        {/* 날짜 선택기 */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'8px 14px', borderRadius:'12px', background:'#fff', border:'1.5px solid #e5e7eb', marginBottom:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <button onClick={() => changeDate(-1)}
            style={{ border:'none', background:'none', cursor:'pointer', padding:'4px 6px', borderRadius:'6px', color:'#6b7280', display:'flex', alignItems:'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ border:'none', fontSize:'14px', fontWeight:700, color:'#111827', fontFamily:'inherit', outline:'none', cursor:'text', background:'transparent' }} />
          <span style={{ fontSize:'12px', color:'#9ca3af' }}>{fmtDate(date)}</span>
          <button onClick={() => changeDate(1)}
            style={{ border:'none', background:'none', cursor:'pointer', padding:'4px 6px', borderRadius:'6px', color:'#6b7280', display:'flex', alignItems:'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button onClick={() => setDate(toDateStr(new Date()))}
            style={{ padding:'4px 10px', borderRadius:'7px', border:'1px solid #e5e7eb', background:'#f3f4f6', color:'#374151', fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            오늘
          </button>
        </div>

        {/* 탭 */}
        <div style={{ display:'flex', gap:'0', marginBottom:'18px', borderRadius:'12px', background:'#f3f4f6', padding:'4px', width:'fit-content' }}>
          {(['worship', 'group'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:'8px 22px', borderRadius:'9px', border:'none', background:tab===t?'#fff':'transparent', color:tab===t?'#111827':'#6b7280', fontSize:'13px', fontWeight:tab===t?700:500, cursor:'pointer', fontFamily:'inherit', boxShadow:tab===t?'0 2px 8px rgba(0,0,0,0.08)':'none', transition:'all 0.15s' }}>
              {t === 'worship' ? '⛪ 예배 출석' : '🏘️ 구역 출석'}
            </button>
          ))}
        </div>

        {/* 본문 */}
        <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', border:'1px solid #f1f5f9', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          {tab === 'worship' ? <WorshipTab date={date} /> : <GroupTab date={date} />}
        </div>
      </div>
    </>
  );
}

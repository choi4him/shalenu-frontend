'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useTranslation, useLangRouter } from '@/lib/i18n';

// ─── 타입 ──────────────────────────────────────────────────
interface Group {
  id:           number;
  name:         string;
  type:         string;
  leader_name?: string;
  member_count: number;
  meeting_day?: string;
  meeting_time?: string;
  description?: string;
}

interface Member { id: number; full_name: string; }
interface LookupItem { id: number; name: string; code?: string; is_active: boolean; }

// ─── 상수 ──────────────────────────────────────────────────
const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const DEFAULT_TYPES = ['구역', '목장', '셀', '부서', '순', '팀'];

// 유형별 색상 팔레트 (6가지 + fallback)
const PALETTE = [
  { bg: '#fdf8e8', text: '#c9a84c', border: '#f0d88a' },
  { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  { bg: '#faf5ff', text: '#9333ea', border: '#e9d5ff' },
  { bg: '#ecfdf5', text: '#0d9488', border: '#99f6e4' },
  { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
];
const TYPE_ICONS: Record<string, string> = {
  구역: '🏘️', 목장: '🌿', 셀: '✨', 부서: '🏢', 순: '🌀', 팀: '⚡',
};

function getTypeStyle(type: string, index: number) {
  return PALETTE[index % PALETTE.length];
}
function getTypeIcon(type: string) {
  return TYPE_ICONS[type] ?? '📌';
}

// ─── 공통 스타일 ────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: '9px',
  border: '1.5px solid #e5e7eb', fontSize: '14px', color: '#1a1a1a',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  background: '#fff', transition: 'border-color 0.2s',
};
const labelSt: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: '#374151',
  marginBottom: '5px', display: 'block',
};

// ─── 새 유형 추가 인라인 모달 ──────────────────────────────
function AddTypeModal({ onClose, onAdded }: { onClose: () => void; onAdded: (name: string) => void }) {
  const { t } = useTranslation();
  const [name,  setName]  = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError(t.groups.typeNameRequired); return; }
    setSaving(true); setError('');
    try {
      await apiClient('/api/v1/lookup', {
        method: 'POST',
        body: JSON.stringify({ category: 'group_type', name: trimmed, is_active: true }),
      });
      onAdded(trimmed);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.groups.registerFailed);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.35)', backdropFilter:'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff', borderRadius:'16px', padding:'24px', width:'340px', maxWidth:'95vw', boxShadow:'0 16px 48px rgba(0,0,0,0.18)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <h2 style={{ margin:0, fontSize:'16px', fontWeight:800, color:'#1a1a1a' }}>{t.groups.addTypeTitle}</h2>
          <button onClick={onClose} style={{ border:'none', background:'#f3f4f6', borderRadius:'8px', padding:'7px', cursor:'pointer', display:'flex' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {error && <div style={{ padding:'8px 12px', borderRadius:'8px', background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'13px', marginBottom:'12px' }}>{error}</div>}
        <input style={inputSt} placeholder={t.groups.addTypePlaceholder} value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }} autoFocus />
        <div style={{ display:'flex', gap:'8px', marginTop:'14px' }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px', borderRadius:'9px', border:'1.5px solid #e5e7eb', background:'#fff', color:'#6b7280', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{t.common.cancel}</button>
          <button onClick={submit} disabled={saving}
            style={{ flex:2, padding:'10px', borderRadius:'9px', border:'none', background:saving?'#f0d88a':'linear-gradient(135deg,#c9a84c,#c9a84c)', color:saving?'#d4b85c':'#fff', fontSize:'13px', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit' }}>
            {saving ? t.groups.registering : t.groups.addSubmit}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 등록 모달 ─────────────────────────────────────────────
function CreateModal({ types, typeStyles, onClose, onCreated }: {
  types: string[]; typeStyles: Record<string, ReturnType<typeof getTypeStyle>>;
  onClose: () => void; onCreated: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', type: types[0] ?? '', meeting_day: '', meeting_time: '' });
  const [leaderId,      setLeaderId]      = useState<number | null>(null);
  const [leaderName,    setLeaderName]    = useState('');
  const [memberSearch,  setMemberSearch]  = useState('');
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [showAddType,   setShowAddType]   = useState(false);
  const [localTypes,    setLocalTypes]    = useState(types);

  const searchMembers = useCallback(async (q: string) => {
    if (!q.trim()) { setMemberResults([]); return; }
    try {
      const res = await apiClient<Member[]>(`/api/v1/members?search=${encodeURIComponent(q)}&limit=8`);
      setMemberResults(Array.isArray(res) ? res : []);
    } catch { setMemberResults([]); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchMembers(memberSearch), 300);
    return () => clearTimeout(timer);
  }, [memberSearch, searchMembers]);

  // 첫 번째 타입으로 기본값 설정
  useEffect(() => {
    if (localTypes.length > 0 && !localTypes.includes(form.type)) {
      setForm(p => ({ ...p, type: localTypes[0] }));
    }
  }, [localTypes, form.type]);

  const submit = async () => {
    if (!form.name.trim()) { setError(t.groups.nameRequired); return; }
    setSaving(true); setError('');
    try {
      await apiClient('/api/v1/groups', {
        method: 'POST',
        body: JSON.stringify({ ...form, leader_id: leaderId }),
      });
      onCreated(); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.groups.registerFailed);
    } finally { setSaving(false); }
  };

  return (
    <>
      <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.4)', backdropFilter:'blur(3px)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div style={{ background:'#fff', borderRadius:'20px', padding:'32px', width:'500px', maxWidth:'95vw', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'90vh', overflowY:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
            <div>
              <h2 style={{ margin:0, fontSize:'18px', fontWeight:800, color:'#1a1a1a', letterSpacing:'-0.03em' }}>{t.groups.createTitle}</h2>
              <p style={{ margin:'3px 0 0', fontSize:'13px', color:'#9ca3af' }}>{t.groups.createSubtitle}</p>
            </div>
            <button onClick={onClose} style={{ border:'none', background:'#f3f4f6', borderRadius:'8px', padding:'8px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {error && (
            <div style={{ padding:'10px 14px', borderRadius:'9px', background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'13px', marginBottom:'14px' }}>{error}</div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <label style={labelSt}>{t.groups.groupName} <span style={{ color:'#ef4444' }}>*</span></label>
              <input style={inputSt} placeholder="예) 1구역, 청년목장" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>

            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
                <label style={{ ...labelSt, marginBottom:0 }}>{t.groups.type}</label>
                <button onClick={() => setShowAddType(true)}
                  style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', borderRadius:'7px', border:'1px solid #e5e7eb', background:'#f9fafb', color:'#6b7280', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  {t.groups.addType}
                </button>
              </div>
              <div style={{ display:'flex', gap:'7px', flexWrap:'wrap' }}>
                {localTypes.map((tp, i) => {
                  const c = typeStyles[tp] ?? getTypeStyle(tp, i);
                  const sel = form.type === tp;
                  return (
                    <button key={tp} onClick={() => setForm(p => ({ ...p, type: tp }))}
                      style={{
                        padding: sel ? '7px 16px' : '7px 14px',
                        borderRadius: '20px',
                        border: sel ? `2px solid ${c.text}` : '1.5px solid #e5e7eb',
                        background: sel ? c.text : '#f9fafb',
                        color: sel ? '#fff' : '#6b7280',
                        fontSize: '13px',
                        fontWeight: sel ? 800 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        fontFamily: 'inherit',
                        boxShadow: sel ? `0 4px 12px ${c.text}44` : 'none',
                        transform: sel ? 'scale(1.05)' : 'scale(1)',
                      }}>
                      {getTypeIcon(tp)} {tp}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={labelSt}>{t.groups.leader}</label>
              <input style={inputSt} placeholder={`${t.groups.leader}...`} value={leaderName || memberSearch}
                onChange={e => { setMemberSearch(e.target.value); setLeaderName(''); setLeaderId(null); }} />
              {memberResults.length > 0 && !leaderId && (
                <div style={{ marginTop:'4px', border:'1px solid #e5e7eb', borderRadius:'9px', overflow:'hidden', boxShadow:'0 4px 12px rgba(0,0,0,0.08)' }}>
                  {memberResults.map(m => (
                    <div key={m.id} onClick={() => { setLeaderId(m.id); setLeaderName(m.full_name); setMemberSearch(''); setMemberResults([]); }}
                      style={{ padding:'10px 14px', cursor:'pointer', fontSize:'13px', borderBottom:'1px solid #f1f5f9', transition:'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f8faff'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#fff'}>
                      {m.full_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="r-grid-2" style={{ gap:'12px' }}>
              <div>
                <label style={labelSt}>{t.groups.meetingDay}</label>
                <select style={inputSt} value={form.meeting_day}
                  onChange={e => setForm(p => ({ ...p, meeting_day: e.target.value }))}>
                  <option value="">{t.groups.selectDay}</option>
                  {t.groups.days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>{t.groups.meetingTime}</label>
                <input style={inputSt} type="time" value={form.meeting_time}
                  onChange={e => setForm(p => ({ ...p, meeting_time: e.target.value }))} />
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:'8px', marginTop:'24px' }}>
            <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:'10px', border:'1.5px solid #e5e7eb', background:'#fff', color:'#6b7280', fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{t.common.cancel}</button>
            <button onClick={submit} disabled={saving}
              style={{ flex:2, padding:'11px', borderRadius:'10px', border:'none', background:saving?'#f0d88a':'linear-gradient(135deg,#c9a84c,#c9a84c)', color:saving?'#d4b85c':'#fff', fontSize:'14px', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', boxShadow:saving?'none':'0 4px 12px rgba(201,168,76,0.3)', transition:'all 0.2s' }}>
              {saving ? t.groups.registering : t.groups.registerSubmit}
            </button>
          </div>
        </div>
      </div>
      {showAddType && (
        <AddTypeModal onClose={() => setShowAddType(false)} onAdded={name => {
          setLocalTypes(p => [...p, name]);
          setForm(p => ({ ...p, type: name }));
        }} />
      )}
    </>
  );
}

// ─── 소그룹 카드 ───────────────────────────────────────────
function GroupCard({ group, typeIndex, onClick }: { group: Group; typeIndex: number; onClick: () => void }) {
  const { t } = useTranslation();
  const c = getTypeStyle(group.type, typeIndex);
  return (
    <div onClick={onClick}
      style={{ background:'#fff', borderRadius:'16px', padding:'20px', border:'1.5px solid #f1f5f9', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', cursor:'pointer', transition:'all 0.18s', position:'relative', overflow:'hidden' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow='0 8px 24px rgba(201,168,76,0.13)'; el.style.borderColor='#f0d88a'; el.style.transform='translateY(-2px)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow='0 1px 4px rgba(0,0,0,0.05)'; el.style.borderColor='#f1f5f9'; el.style.transform='none'; }}>
      <div style={{ position:'absolute', top:0, right:0, width:'80px', height:'80px', background:`radial-gradient(circle at 80% 0%, ${c.bg} 0%, transparent 70%)`, borderRadius:'0 16px 0 0' }}/>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
        <span style={{ fontSize:'22px' }}>{getTypeIcon(group.type)}</span>
        <span style={{ padding:'3px 10px', borderRadius:'20px', background:c.bg, color:c.text, border:`1px solid ${c.border}`, fontSize:'11px', fontWeight:700 }}>
          {group.type}
        </span>
      </div>

      <div style={{ fontSize:'17px', fontWeight:800, color:'#1a1a1a', marginBottom:'10px', letterSpacing:'-0.02em' }}>{group.name}</div>

      <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'#6b7280' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>{t.groups.leader}: <strong style={{ color:'#374151' }}>{group.leader_name ?? t.groups.unassigned}</strong></span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'#6b7280' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>{t.groups.groupMembers} <strong style={{ color:'#374151' }}>{group.member_count}</strong>{t.common.people}</span>
        </div>
        {group.meeting_day && (
          <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'#6b7280' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>{group.meeting_day} {group.meeting_time ?? ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 메인 페이지 ────────────────────────────────────────────
export default function GroupsPage() {
  const { t } = useTranslation();
  const router = useLangRouter();
  const [groups,      setGroups]      = useState<Group[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('__all__');
  const [showCreate,  setShowCreate]  = useState(false);
  const [groupTypes,  setGroupTypes]  = useState<string[]>([]);
  const [typeStyles,  setTypeStyles]  = useState<Record<string, ReturnType<typeof getTypeStyle>>>({});

  // 소그룹 유형 동적 로딩
  const loadTypes = useCallback(async () => {
    try {
      const res = await apiClient<LookupItem[]>('/api/v1/lookup/group_type');
      const list = Array.isArray(res) ? res.filter(i => i.is_active).map(i => i.name) : DEFAULT_TYPES;
      const types = list.length > 0 ? list : DEFAULT_TYPES;
      setGroupTypes(types);
      const styles: Record<string, ReturnType<typeof getTypeStyle>> = {};
      types.forEach((tp, i) => { styles[tp] = getTypeStyle(tp, i); });
      setTypeStyles(styles);
    } catch {
      setGroupTypes(DEFAULT_TYPES);
      const styles: Record<string, ReturnType<typeof getTypeStyle>> = {};
      DEFAULT_TYPES.forEach((tp, i) => { styles[tp] = getTypeStyle(tp, i); });
      setTypeStyles(styles);
    }
  }, []);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try { setGroups(await apiClient<Group[]>('/api/v1/groups')); }
    catch { setGroups([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadTypes();
    loadGroups();
  }, [loadTypes, loadGroups]);

  const displayed = filter === '__all__' ? groups : groups.filter(g => g.type === filter);

  // 표시되는 그룹의 유형별 인덱스
  const allTypes = [...new Set(groups.map(g => g.type))];
  const typeIndexMap = Object.fromEntries(allTypes.map((tp, i) => [tp, groupTypes.indexOf(tp) !== -1 ? groupTypes.indexOf(tp) : i]));

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .group-card-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; }
        @media(max-width:640px){ .group-card-grid{ grid-template-columns:1fr; } }
      `}</style>

      <div style={{ padding:'36px 40px', maxWidth:'1000px' }}>
        {/* 헤더 */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'28px', gap:'16px', flexWrap:'wrap' }}>
          <div>
            <h1 style={{ margin:0, fontSize:'26px', fontWeight:800, color:'#1a1a1a', letterSpacing:'-0.04em' }}>{t.groups.title}</h1>
            <p style={{ margin:'5px 0 0', fontSize:'13px', color:'#9ca3af' }}>{t.groups.subtitle}</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 20px', borderRadius:'11px', border:'none', background:'linear-gradient(135deg,#c9a84c,#c9a84c)', color:'#fff', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(201,168,76,0.35)', transition:'all 0.2s', flexShrink:0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {t.groups.register}
          </button>
        </div>

        {/* 유형 필터 탭 */}
        <div style={{ display:'flex', gap:'6px', marginBottom:'24px', flexWrap:'wrap' }}>
          {/* 전체 버튼 */}
          {(() => {
            const sel = filter === '__all__';
            return (
              <button onClick={() => setFilter('__all__')}
                style={{ padding:'7px 16px', borderRadius:'20px', border:`1.5px solid ${sel ? '#c9a84c' : '#e5e7eb'}`, background:sel ? '#fdf8e8' : '#fff', color:sel ? '#c9a84c' : '#6b7280', fontSize:'13px', fontWeight:sel?700:500, cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit' }}>
                {t.groups.all}
                <span style={{ marginLeft:'5px', padding:'1px 6px', borderRadius:'10px', background:sel?'rgba(255,255,255,0.5)':'#f3f4f6', fontSize:'11px', fontWeight:700 }}>
                  {groups.length}
                </span>
              </button>
            );
          })()}
          {/* 동적 유형 탭 */}
          {groupTypes.map((tp, i) => {
            const c = typeStyles[tp] ?? getTypeStyle(tp, i);
            const cnt = groups.filter(g => g.type === tp).length;
            if (cnt === 0) return null;
            const sel = filter === tp;
            return (
              <button key={tp} onClick={() => setFilter(tp)}
                style={{ padding:'7px 16px', borderRadius:'20px', border:`1.5px solid ${sel ? c.border : '#e5e7eb'}`, background:sel ? c.bg : '#fff', color:sel ? c.text : '#6b7280', fontSize:'13px', fontWeight:sel?700:500, cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit' }}>
                <span style={{ marginRight:'4px' }}>{getTypeIcon(tp)}</span>{tp}
                <span style={{ marginLeft:'5px', padding:'1px 6px', borderRadius:'10px', background:sel?'rgba(255,255,255,0.5)':'#f3f4f6', fontSize:'11px', fontWeight:700 }}>{cnt}</span>
              </button>
            );
          })}
        </div>

        {/* 카드 그리드 */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px', color:'#9ca3af', fontSize:'14px' }}>{t.common.loading}</div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px', background:'#f9fafb', borderRadius:'16px', border:'1.5px dashed #e5e7eb' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>🏘️</div>
            <div style={{ fontSize:'15px', fontWeight:600, color:'#374151', marginBottom:'6px' }}>{t.groups.noGroups}</div>
            <div style={{ fontSize:'13px', color:'#9ca3af', marginBottom:'16px' }}>{t.groups.noGroupsHint}</div>
            <button onClick={() => setShowCreate(true)}
              style={{ padding:'9px 20px', borderRadius:'10px', border:'none', background:'#c9a84c', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              {t.groups.registerGroup}
            </button>
          </div>
        ) : (
          <div className="group-card-grid" style={{ animation:'fadeIn 0.2s ease' }}>
            {displayed.map(g => (
              <GroupCard key={g.id} group={g} typeIndex={typeIndexMap[g.type] ?? 0}
                onClick={() => router.push(`/groups/${g.id}`)} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal types={groupTypes.length > 0 ? groupTypes : DEFAULT_TYPES}
          typeStyles={typeStyles} onClose={() => setShowCreate(false)} onCreated={loadGroups} />
      )}
    </>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

// ─── 타입 ──────────────────────────────────────────────────
interface Group {
  id:           number;
  name:         string;
  type:         string;  // 소그룹 유형
  leader_id?:   number;
  leader_name?: string;
  meeting_day?: string;
  meeting_time?: string;
  description?: string;
  member_count: number;
}

interface GroupMember {
  id:          number;
  member_id:   number;
  full_name:   string;
  role:        string;  // 리더 | 부리더 | 조원
  joined_at?:  string;
}

interface Member { id: number; full_name: string; }

// ─── 상수/스타일 ────────────────────────────────────────────
const DAYS = ['월','화','수','목','금','토','일'];

const PALETTE = [
  { bg:'#fdf8e8', text:'#c9a84c', border:'#f0d88a' },
  { bg:'#f0fdf4', text:'#16a34a', border:'#bbf7d0' },
  { bg:'#fff7ed', text:'#ea580c', border:'#fed7aa' },
  { bg:'#faf5ff', text:'#9333ea', border:'#e9d5ff' },
  { bg:'#ecfdf5', text:'#0d9488', border:'#99f6e4' },
  { bg:'#eff6ff', text:'#2563eb', border:'#bfdbfe' },
];
const TYPE_ICONS: Record<string, string> = { 구역:'🏘️', 목장:'🌿', 셀:'✨', 부서:'🏢', 순:'🌀', 팀:'⚡' };
function getTypeStyle(index: number) { return PALETTE[index % PALETTE.length]; }
function getTypeIcon(type: string) { return TYPE_ICONS[type] ?? '📌'; }

const ROLE_COLOR: Record<string, { bg:string; text:string }> = {
  리더:  { bg:'#fdf8e8', text:'#c9a84c' },
  부리더: { bg:'#f0fdf4', text:'#16a34a' },
  조원:  { bg:'#f9fafb', text:'#6b7280' },
};

const inputSt: React.CSSProperties = {
  width:'100%', padding:'9px 12px', borderRadius:'8px',
  border:'1.5px solid #e5e7eb', fontSize:'13px', color:'#111827',
  outline:'none', fontFamily:'inherit', boxSizing:'border-box',
  background:'#fff', transition:'border-color 0.2s',
};

interface LookupItem { id: number; name: string; is_active: boolean; }

// ─── 소그룹원 추가 모달 ──────────────────────────────────────
function AddMemberModal({ groupId, onClose, onAdded }: { groupId: string; onClose: () => void; onAdded: () => void }) {
  const [search,   setSearch]   = useState('');
  const [results,  setResults]  = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);
  const [role,     setRole]     = useState('조원');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    try {
      const res = await apiClient<Member[]>(`/api/v1/members?search=${encodeURIComponent(q)}&limit=8`);
      setResults(Array.isArray(res) ? res : []);
    } catch { setResults([]); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(t);
  }, [search, doSearch]);

  const submit = async () => {
    if (!selected) { setError('교인을 선택해주세요.'); return; }
    setSaving(true); setError('');
    try {
      await apiClient(`/api/v1/groups/${groupId}/members`, {
        method: 'POST',
        body: JSON.stringify({ member_id: selected.id, role }),
      });
      onAdded(); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '추가에 실패했습니다.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.4)',backdropFilter:'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#fff',borderRadius:'18px',padding:'28px',width:'420px',maxWidth:'95vw',boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px' }}>
          <h2 style={{ margin:0,fontSize:'17px',fontWeight:800,color:'#111827' }}>소그룹원 추가</h2>
          <button onClick={onClose} style={{ border:'none',background:'#f3f4f6',borderRadius:'8px',padding:'7px',cursor:'pointer',display:'flex' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {error && <div style={{ padding:'9px 13px',borderRadius:'8px',background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:'13px',marginBottom:'12px' }}>{error}</div>}

        <div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
          <div>
            <label style={{ fontSize:'12px',fontWeight:600,color:'#374151',marginBottom:'4px',display:'block' }}>교인 검색</label>
            {selected ? (
              <div style={{ display:'flex',alignItems:'center',gap:'8px',padding:'9px 12px',borderRadius:'8px',background:'#fdf8e8',border:'1.5px solid #e8d48b' }}>
                <span style={{ flex:1,fontSize:'13px',fontWeight:600,color:'#c9a84c' }}>{selected.full_name}</span>
                <button onClick={() => { setSelected(null); setSearch(''); }}
                  style={{ border:'none',background:'none',cursor:'pointer',color:'#d4b85c',fontSize:'18px',lineHeight:1,padding:0 }}>×</button>
              </div>
            ) : (
              <div style={{ position:'relative' }}>
                <input style={inputSt} placeholder="이름으로 검색..." value={search}
                  onChange={e => setSearch(e.target.value)} />
                {results.length > 0 && (
                  <div style={{ position:'absolute',top:'100%',left:0,right:0,marginTop:'4px',border:'1px solid #e5e7eb',borderRadius:'9px',background:'#fff',boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:10,overflow:'hidden' }}>
                    {results.map(m => (
                      <div key={m.id} onClick={() => { setSelected(m); setResults([]); setSearch(''); }}
                        style={{ padding:'9px 13px',cursor:'pointer',fontSize:'13px',borderBottom:'1px solid #f1f5f9',transition:'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background='#f8faff'}
                        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background='#fff'}>
                        {m.full_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize:'12px',fontWeight:600,color:'#374151',marginBottom:'4px',display:'block' }}>역할</label>
            <div style={{ display:'flex',gap:'8px' }}>
              {['리더','부리더','조원'].map(r => {
                const rc = ROLE_COLOR[r];
                return (
                  <button key={r} onClick={() => setRole(r)}
                    style={{ flex:1,padding:'8px',borderRadius:'9px',border:`1.5px solid ${role===r ? rc.bg : '#e5e7eb'}`,background:role===r ? rc.bg : '#fff',color:role===r ? rc.text : '#6b7280',fontSize:'13px',fontWeight:role===r?700:500,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s' }}>
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display:'flex',gap:'8px',marginTop:'20px' }}>
          <button onClick={onClose} style={{ flex:1,padding:'10px',borderRadius:'9px',border:'1.5px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit' }}>취소</button>
          <button onClick={submit} disabled={saving}
            style={{ flex:2,padding:'10px',borderRadius:'9px',border:'none',background:saving?'#f0d88a':'linear-gradient(135deg,#c9a84c,#c9a84c)',color:saving?'#d4b85c':'#fff',fontSize:'13px',fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:'inherit',transition:'all 0.2s' }}>
            {saving ? '추가 중...' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ────────────────────────────────────────────
export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [group,      setGroup]      = useState<Group | null>(null);
  const [members,    setMembers]    = useState<GroupMember[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [editing,    setEditing]    = useState(false);
  const [editForm,   setEditForm]   = useState<Partial<Group>>({});
  const [saving,     setSaving]     = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);
  const [alert,      setAlert]      = useState<{ type:'ok'|'err'; msg:string } | null>(null);
  const [groupTypes, setGroupTypes] = useState<string[]>([]);

  const loadGroup = useCallback(async () => {
    try { setGroup(await apiClient<Group>(`/api/v1/groups/${id}`)); }
    catch { router.push('/groups'); }
  }, [id, router]);

  const loadMembers = useCallback(async () => {
    try { setMembers(await apiClient<GroupMember[]>(`/api/v1/groups/${id}/members`)); }
    catch { setMembers([]); }
  }, [id]);

  useEffect(() => {
    Promise.all([loadGroup(), loadMembers()]).finally(() => setLoading(false));
    // 소그룹 유형 동적 로딩
    apiClient<LookupItem[]>('/api/v1/lookup/group_type')
      .then(res => {
        const list = Array.isArray(res) ? res.filter(i => i.is_active).map(i => i.name) : [];
        setGroupTypes(list.length > 0 ? list : ['구역','목장','셀','부서','순','팀']);
      })
      .catch(() => setGroupTypes(['구역','목장','셀','부서','순','팀']));
  }, [loadGroup, loadMembers]);

  const startEdit = () => {
    if (!group) return;
    setEditForm({ name: group.name, type: group.type, meeting_day: group.meeting_day, meeting_time: group.meeting_time, description: group.description });
    setEditing(true);
    setAlert(null);
  };

  const cancelEdit = () => { setEditing(false); setAlert(null); };

  const saveEdit = async () => {
    setSaving(true); setAlert(null);
    try {
      await apiClient(`/api/v1/groups/${id}`, { method:'PUT', body: JSON.stringify(editForm) });
      setAlert({ type:'ok', msg:'저장되었습니다.' });
      setEditing(false);
      loadGroup();
    } catch (e) {
      setAlert({ type:'err', msg: e instanceof Error ? e.message : '저장에 실패했습니다.' });
    } finally { setSaving(false); }
  };

  const removeMember = async (gmId: number, name: string) => {
    if (!confirm(`${name}을(를) 소그룹원에서 삭제하시겠습니까?`)) return;
    try {
      await apiClient(`/api/v1/groups/${id}/members/${gmId}`, { method:'DELETE' });
      loadMembers();
    } catch {}
  };

  const changeRole = async (gm: GroupMember, newRole: string) => {
    try {
      await apiClient(`/api/v1/groups/${id}/members/${gm.id}`, { method:'PUT', body: JSON.stringify({ role: newRole }) });
      loadMembers();
    } catch {}
  };

  if (loading) return <div style={{ padding:'60px',textAlign:'center',color:'#9ca3af' }}>불러오는 중...</div>;
  if (!group) return null;

  const typeIdx = groupTypes.indexOf(group.type);
  const tc = typeIdx !== -1 ? getTypeStyle(typeIdx) : { bg:'#f8fafc', text:'#6b7280', border:'#e5e7eb' };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .inp-edit:focus { border-color:#c9a84c !important; box-shadow:0 0 0 3px rgba(201,168,76,0.12) !important; }
      `}</style>

      <div style={{ padding:'36px 40px', maxWidth:'760px', animation:'fadeIn 0.2s ease' }}>
        {/* 뒤로 + 헤더 */}
        <button onClick={() => router.push('/groups')}
          style={{ display:'flex',alignItems:'center',gap:'6px',border:'none',background:'none',color:'#6b7280',fontSize:'13px',cursor:'pointer',fontFamily:'inherit',padding:'0 0 16px',fontWeight:500 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          소그룹 목록으로
        </button>

        {/* 알림 */}
        {alert && (
          <div style={{ display:'flex',alignItems:'center',gap:'8px',padding:'10px 14px',borderRadius:'10px',fontSize:'13px',marginBottom:'16px',background:alert.type==='ok'?'#f0fdf4':'#fef2f2',border:`1px solid ${alert.type==='ok'?'#bbf7d0':'#fecaca'}`,color:alert.type==='ok'?'#15803d':'#dc2626' }}>
            {alert.type==='ok'?'✓':''} {alert.msg}
          </div>
        )}

        {/* ── 기본 정보 카드 ─────────────────────────── */}
        <div style={{ background:'#fff',borderRadius:'16px',padding:'24px',border:'1px solid #f1f5f9',boxShadow:'0 1px 4px rgba(0,0,0,0.05)',marginBottom:'16px' }}>
          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'20px',gap:'12px',flexWrap:'wrap' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'12px' }}>
              <div style={{ fontSize:'32px' }}>{getTypeIcon(group.type)}</div>
              <div>
                <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px' }}>
                  <h1 style={{ margin:0,fontSize:'20px',fontWeight:800,color:'#111827',letterSpacing:'-0.03em' }}>{group.name}</h1>
                  <span style={{ padding:'2px 9px',borderRadius:'20px',background:tc.bg,color:tc.text,border:`1px solid ${tc.border}`,fontSize:'11px',fontWeight:700 }}>{group.type}</span>
                </div>
                <div style={{ fontSize:'12px',color:'#9ca3af' }}>소그룹원 {group.member_count}명</div>
              </div>
            </div>
            {!editing ? (
              <button onClick={startEdit}
                style={{ display:'flex',alignItems:'center',gap:'5px',padding:'8px 14px',borderRadius:'9px',border:'1.5px solid #c9a84c',background:'#fdf8e8',color:'#c9a84c',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                편집
              </button>
            ) : (
              <div style={{ display:'flex',gap:'8px' }}>
                <button onClick={cancelEdit}
                  style={{ padding:'8px 14px',borderRadius:'9px',border:'1.5px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit' }}>취소</button>
                <button onClick={saveEdit} disabled={saving}
                  style={{ padding:'8px 16px',borderRadius:'9px',border:'none',background:saving?'#f0d88a':'linear-gradient(135deg,#c9a84c,#c9a84c)',color:saving?'#d4b85c':'#fff',fontSize:'13px',fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:'inherit',transition:'all 0.2s' }}>
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px' }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:'12px',fontWeight:600,color:'#374151',marginBottom:'4px',display:'block' }}>소그룹명</label>
                <input className="inp-edit" style={inputSt} value={editForm.name ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:'12px',fontWeight:600,color:'#374151',marginBottom:'4px',display:'block' }}>유형</label>
                <div style={{ display:'flex',gap:'8px',flexWrap:'wrap' }}>
                  {groupTypes.map((t, i) => {
                    const c = getTypeStyle(i);
                    return (
                      <button key={t} onClick={() => setEditForm(p => ({ ...p, type: t }))}
                        style={{ padding:'6px 14px',borderRadius:'18px',border:`1.5px solid ${editForm.type===t?c.border:'#e5e7eb'}`,background:editForm.type===t?c.bg:'#f9fafb',color:editForm.type===t?c.text:'#6b7280',fontSize:'12px',fontWeight:editForm.type===t?700:500,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s' }}>
                        {getTypeIcon(t)} {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={{ fontSize:'12px',fontWeight:600,color:'#374151',marginBottom:'4px',display:'block' }}>모임 요일</label>
                <select className="inp-edit" style={inputSt} value={editForm.meeting_day ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, meeting_day: e.target.value }))}>
                  <option value="">요일 선택</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}요일</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'12px',fontWeight:600,color:'#374151',marginBottom:'4px',display:'block' }}>모임 시간</label>
                <input className="inp-edit" style={inputSt} type="time" value={editForm.meeting_time ?? ''}
                  onChange={e => setEditForm(p => ({ ...p, meeting_time: e.target.value }))} />
              </div>
            </div>
          ) : (
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px' }}>
              {[
                { label:'리더',      value: group.leader_name ?? '미지정' },
                { label:'유형',      value: group.type },
                { label:'모임 요일', value: group.meeting_day ? `${group.meeting_day}요일` : '미정' },
                { label:'모임 시간', value: group.meeting_time ?? '미정' },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding:'12px',borderRadius:'10px',background:'#f8fafc',border:'1px solid #f1f5f9' }}>
                  <div style={{ fontSize:'11px',color:'#9ca3af',fontWeight:600,marginBottom:'3px',textTransform:'uppercase',letterSpacing:'0.05em' }}>{label}</div>
                  <div style={{ fontSize:'14px',fontWeight:600,color:'#111827' }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 소그룹원 목록 ─────────────────────────── */}
        <div style={{ background:'#fff',borderRadius:'16px',padding:'24px',border:'1px solid #f1f5f9',boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
              <div style={{ width:'4px',height:'18px',background:'linear-gradient(#c9a84c,#c9a84c)',borderRadius:'99px' }}/>
              <span style={{ fontSize:'15px',fontWeight:700,color:'#111827' }}>소그룹원 목록</span>
              <span style={{ fontSize:'12px',color:'#9ca3af',fontWeight:500 }}>{members.length}명</span>
            </div>
            <button onClick={() => setShowAdd(true)}
              style={{ display:'flex',alignItems:'center',gap:'5px',padding:'7px 13px',borderRadius:'9px',border:'none',background:'linear-gradient(135deg,#c9a84c,#c9a84c)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 3px 10px rgba(201,168,76,0.3)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              소그룹원 추가
            </button>
          </div>

          {members.length === 0 ? (
            <div style={{ textAlign:'center',padding:'30px',color:'#9ca3af',fontSize:'13px' }}>등록된 소그룹원이 없습니다</div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:'6px' }}>
              {members.map(gm => {
                const rc = ROLE_COLOR[gm.role] ?? { bg:'#f9fafb', text:'#6b7280' };
                return (
                  <div key={gm.id} style={{ display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'10px',background:'#f8fafc',border:'1px solid #f1f5f9',transition:'all 0.12s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background='#f0f4ff'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background='#f8fafc'}>
                    {/* 아바타 */}
                    <div style={{ width:'32px',height:'32px',borderRadius:'50%',background:'linear-gradient(135deg,#fdf8e8,#f0d88a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:800,color:'#c9a84c',flexShrink:0 }}>
                      {gm.full_name.charAt(0)}
                    </div>

                    <span style={{ flex:1,fontSize:'14px',fontWeight:600,color:'#111827' }}>{gm.full_name}</span>

                    {/* 역할 변경 */}
                    <select value={gm.role} onChange={e => changeRole(gm, e.target.value)}
                      style={{ padding:'4px 8px',borderRadius:'7px',border:`1px solid ${rc.bg}`,background:rc.bg,color:rc.text,fontSize:'11px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',outline:'none' }}>
                      {['리더','부리더','조원'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>

                    {gm.joined_at && (
                      <span style={{ fontSize:'11px',color:'#9ca3af',whiteSpace:'nowrap' }}>
                        {new Date(gm.joined_at).toLocaleDateString('ko-KR')}
                      </span>
                    )}

                    <button onClick={() => removeMember(gm.id, gm.full_name)}
                      style={{ padding:'4px 9px',borderRadius:'7px',border:'1px solid #fecaca',background:'#fff',color:'#ef4444',fontSize:'11px',cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',flexShrink:0 }}>삭제</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddMemberModal groupId={id} onClose={() => setShowAdd(false)} onAdded={loadMembers} />}
    </>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import Script from 'next/script';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── 타입 ────────────────────────────────────────────────
interface Church {
  id:           number;
  name:         string;
  address?:     string;
  phone?:       string;
  denomination?: string;
  founded_at?:  string;
}

interface LookupItem {
  id:         number;
  type:       string;
  label:      string;
  sort_order: number;
  is_active:  boolean;
}

interface UserItem {
  id:         number;
  full_name:  string;
  email:      string;
  role:       string;
  is_active:  boolean;
}

// ─── 공통 UI ─────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  width:'100%', padding:'10px 13px', borderRadius:'9px',
  border:'1.5px solid #e5e7eb', fontSize:'14px', color:'#1a1a1a',
  outline:'none', fontFamily:'inherit', boxSizing:'border-box', background:'#fff',
  transition:'border-color 0.2s',
};
const labelSt: React.CSSProperties = { fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'5px', display:'block' };
const sectionTitle = (t: string) => (
  <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px' }}>
    <div style={{ width:'4px',height:'18px',background:'linear-gradient(#c9a84c,#c9a84c)',borderRadius:'99px' }}/>
    <span style={{ fontSize:'15px',fontWeight:700,color:'#1a1a1a' }}>{t}</span>
  </div>
);
const card = { background:'#fff', borderRadius:'16px', padding:'24px', border:'1px solid #f1f5f9', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', marginBottom:'16px' } as React.CSSProperties;

function Alert({ type, msg }: { type:'ok'|'err', msg:string }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:'9px',padding:'11px 14px',borderRadius:'10px',fontSize:'13px',marginBottom:'14px',
      background:type==='ok'?'#f0fdf4':'#fef2f2', border:`1px solid ${type==='ok'?'#bbf7d0':'#fecaca'}`, color:type==='ok'?'#15803d':'#dc2626' }}>
      {type==='ok'
        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
      {msg}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 탭 1: 교회 정보
// ═══════════════════════════════════════════════════════
function ChurchTab() {
  const [data,    setData]    = useState<Church | null>(null);
  const [form,    setForm]    = useState<Partial<Church>>({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [alert,   setAlert]   = useState<{type:'ok'|'err', msg:string}|null>(null);

  useEffect(() => {
    apiClient<Church>('/api/v1/churches/me').then(d => {
      setData(d); setForm(d);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openPostcode = () => {
    if (typeof window === 'undefined' || !window.daum?.Postcode) return;
    new window.daum.Postcode({
      oncomplete: (d: { roadAddress: string; jibunAddress?: string }) => {
        setForm(p => ({ ...p, address: d.roadAddress || d.jibunAddress || '' }));
      },
    }).open();
  };

  const save = async () => {
    setSaving(true); setAlert(null);
    try {
      await apiClient('/api/v1/churches/me', { method:'PUT', body: JSON.stringify(form) });
      setAlert({ type:'ok', msg:'저장되었습니다.' });
    } catch (e) {
      setAlert({ type:'err', msg: e instanceof Error ? e.message : '저장에 실패했습니다.' });
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ color:'#9ca3af',fontSize:'14px',padding:'20px 0' }}>불러오는 중...</div>;

  const f = (key: keyof Church) => ({
    value: (form[key] as string) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
  });

  return (
    <div>
      {alert && <Alert type={alert.type} msg={alert.msg} />}
      <div style={card}>
        {sectionTitle('기본 정보')}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px' }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={labelSt}>교회 이름 <span style={{ color:'#ef4444' }}>*</span></label>
            <input className="inp" style={inputSt} placeholder="교회 이름" {...f('name')} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={labelSt}>주소</label>
            <div style={{ display:'flex',gap:'8px' }}>
              <input className="inp" style={{ ...inputSt, flex:1 }} placeholder="주소" {...f('address')} />
              <button type="button" onClick={openPostcode}
                style={{ padding:'0 14px',borderRadius:'9px',border:'1.5px solid #c9a84c',background:'#fdf8e8',color:'#c9a84c',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',transition:'all 0.15s' }}>
                주소 검색
              </button>
            </div>
          </div>
          <div>
            <label style={labelSt}>전화번호</label>
            <input className="inp" style={inputSt} placeholder="02-000-0000" type="tel" {...f('phone')} />
          </div>
          <div>
            <label style={labelSt}>설립일</label>
            <input className="inp" style={inputSt} type="date" {...f('founded_at')} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={labelSt}>교단</label>
            <select className="inp" style={inputSt} {...f('denomination')}>
              <option value="">교단 선택</option>
              {['예장합동','예장통합','기감','기장','기성','순복음','침례교','루터교','성공회','기타'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop:'20px',textAlign:'right' }}>
          <button onClick={save} disabled={saving}
            style={{ padding:'10px 24px',borderRadius:'10px',border:'none',background:saving?'#f0d88a':'linear-gradient(135deg,#c9a84c,#c9a84c)',color:saving?'#d4b85c':'#fff',fontSize:'14px',fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:'inherit',transition:'all 0.2s',boxShadow:saving?'none':'0 4px 12px rgba(201,168,76,0.3)' }}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 탭 2: 코드 관리
// ═══════════════════════════════════════════════════════
const CODE_CATEGORIES = [
  { type:'offering_type',          label:'헌금 종류' },
  { type:'worship_type',           label:'예배 종류' },
  { type:'transaction_category',   label:'거래 분류' },
  { type:'budget_category',        label:'예산 분류' },
];

// ─── 드래그 핸들 아이콘 ────────────────────────────────────
function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9"  cy="6"  r="1.5"/><circle cx="15" cy="6"  r="1.5"/>
      <circle cx="9"  cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
      <circle cx="9"  cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
    </svg>
  );
}

// ─── 정렬 가능한 행 ──────────────────────────────────────
function SortableItem({
  item, editId, editLabel, setEditLabel,
  onToggle, onDelete, onStartEdit, onSaveEdit, onCancelEdit,
}: {
  item: LookupItem;
  editId: number | null;
  editLabel: string;
  setEditLabel: (v: string) => void;
  onToggle:    () => void;
  onDelete:    () => void;
  onStartEdit: () => void;
  onSaveEdit:  () => void;
  onCancelEdit:() => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const rowStyle: React.CSSProperties = {
    display:'flex', alignItems:'center', gap:'8px',
    padding:'8px 10px', borderRadius:'8px',
    background: isDragging ? '#fdf8e8' : item.is_active ? '#f8fafc' : '#fff5f5',
    border: `1.5px solid ${isDragging ? '#e8d48b' : item.is_active ? '#e5e7eb' : '#fecaca'}`,
    boxShadow: isDragging ? '0 8px 24px rgba(201,168,76,0.18)' : '0 1px 2px rgba(0,0,0,0.03)',
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'all 0.15s',
    zIndex: isDragging ? 999 : undefined,
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={rowStyle}>
      {/* 드래그 핸들 */}
      <div
        {...listeners} {...attributes}
        style={{ display:'flex',alignItems:'center',flexShrink:0,padding:'2px 3px',color:'#d1d5db',cursor:'grab',borderRadius:'4px',transition:'color 0.15s',touchAction:'none' }}
        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.color='#c9a84c'}
        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.color='#d1d5db'}
      >
        <GripIcon />
      </div>

      {/* 이름 / 편집 인풋 */}
      {editId === item.id ? (
        <input autoFocus value={editLabel} onChange={e => setEditLabel(e.target.value)}
          onKeyDown={e => { if(e.key==='Enter') onSaveEdit(); if(e.key==='Escape') onCancelEdit(); }}
          style={{ ...inputSt, flex:1, padding:'5px 9px', fontSize:'13px' }} />
      ) : (
        <span style={{ flex:1, fontSize:'13px', fontWeight:500, color:item.is_active?'#111827':'#9ca3af' }}>
          {item.label}
        </span>
      )}

      {/* 활성 토글 */}
      <button onClick={onToggle}
        style={{ padding:'3px 10px',borderRadius:'20px',border:`1px solid ${item.is_active?'#10b981':'#e5e7eb'}`,background:item.is_active?'#ecfdf5':'#f9fafb',color:item.is_active?'#059669':'#9ca3af',fontSize:'11px',fontWeight:600,cursor:'pointer',transition:'all 0.15s',fontFamily:'inherit' }}>
        {item.is_active ? '활성' : '비활성'}
      </button>

      {/* 편집/저장 */}
      {editId === item.id ? (
        <>
          <button onClick={onSaveEdit}
            style={{ padding:'4px 10px',borderRadius:'7px',border:'none',background:'#c9a84c',color:'#fff',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit' }}>저장</button>
          <button onClick={onCancelEdit}
            style={{ padding:'4px 10px',borderRadius:'7px',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'12px',cursor:'pointer',fontFamily:'inherit' }}>취소</button>
        </>
      ) : (
        <button onClick={onStartEdit}
          style={{ padding:'4px 8px',borderRadius:'7px',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'12px',cursor:'pointer',fontFamily:'inherit' }}>수정</button>
      )}

      {/* 삭제 */}
      <button onClick={onDelete}
        style={{ padding:'4px 8px',borderRadius:'7px',border:'1px solid #fecaca',background:'#fff',color:'#ef4444',fontSize:'12px',cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s' }}>삭제</button>
    </div>
  );
}

function CodeSection({
  cat, isAdding, onStartAdding, onStopAdding, newLabel, setNewLabel,
}: {
  cat: { type:string; label:string };
  isAdding: boolean;
  onStartAdding: () => void;
  onStopAdding: () => void;
  newLabel: string;
  setNewLabel: (v: string) => void;
}) {
  const [items,     setItems]     = useState<LookupItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [editId,    setEditId]    = useState<number|null>(null);
  const [editLabel, setEditLabel] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient<LookupItem[]>(`/api/v1/lookup/${cat.type}`);
      setItems(Array.isArray(data) ? data.sort((a, b) => a.sort_order - b.sort_order) : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [cat.type]);

  useEffect(() => { load(); }, [load]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex(i => i.id === active.id);
    const newIdx = items.findIndex(i => i.id === over.id);
    const reordered = arrayMove(items, oldIdx, newIdx);
    setItems(reordered);
    try {
      await Promise.all(
        reordered.map((item, idx) =>
          apiClient(`/api/v1/lookup/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify({ ...item, sort_order: idx + 1 }),
          })
        )
      );
    } catch { load(); }
  };

  const addItem = async () => {
    if (!newLabel.trim()) return;
    try {
      await apiClient('/api/v1/lookup', { method:'POST', body: JSON.stringify({ type: cat.type, label: newLabel.trim(), sort_order: items.length + 1 }) });
      setNewLabel(''); onStopAdding(); load();
    } catch {}
  };

  const toggle = async (item: LookupItem) => {
    try {
      await apiClient(`/api/v1/lookup/${item.id}`, { method:'PUT', body: JSON.stringify({ ...item, is_active: !item.is_active }) });
      load();
    } catch {}
  };

  const deleteItem = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try { await apiClient(`/api/v1/lookup/${id}`, { method:'DELETE' }); load(); } catch {}
  };

  const saveEdit = async (item: LookupItem) => {
    if (!editLabel.trim()) return;
    try {
      await apiClient(`/api/v1/lookup/${item.id}`, { method:'PUT', body: JSON.stringify({ ...item, label: editLabel.trim() }) });
      setEditId(null); load();
    } catch {}
  };

  return (
    <div style={{ ...card, marginBottom:'12px' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px' }}>
        <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
          <div style={{ width:'4px',height:'16px',background:'linear-gradient(#c9a84c,#c9a84c)',borderRadius:'99px' }}/>
          <span style={{ fontSize:'14px',fontWeight:700,color:'#1a1a1a' }}>{cat.label}</span>
          <span style={{ fontSize:'12px',color:'#9ca3af',fontWeight:500 }}>{items.length}개</span>
        </div>
        <button onClick={() => { onStartAdding(); setNewLabel(''); }}
          style={{ display:'flex',alignItems:'center',gap:'5px',padding:'6px 12px',borderRadius:'8px',border:'1.5px solid #c9a84c',background:'#fdf8e8',color:'#c9a84c',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          항목 추가
        </button>
      </div>

      {loading ? (
        <div style={{ color:'#9ca3af',fontSize:'13px' }}>불러오는 중...</div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:'4px' }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {items.map(item => (
                <SortableItem
                  key={item.id}
                  item={item}
                  editId={editId}
                  editLabel={editLabel}
                  setEditLabel={setEditLabel}
                  onToggle={() => toggle(item)}
                  onDelete={() => deleteItem(item.id)}
                  onStartEdit={() => { setEditId(item.id); setEditLabel(item.label); }}
                  onSaveEdit={() => saveEdit(item)}
                  onCancelEdit={() => setEditId(null)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {items.length === 0 && !isAdding && (
            <div style={{ textAlign:'center',padding:'20px',color:'#9ca3af',fontSize:'13px' }}>등록된 항목이 없습니다</div>
          )}

          {isAdding && (
            <div style={{ display:'flex',gap:'8px',padding:'8px',borderRadius:'8px',background:'#fdf8e8',border:'1.5px dashed #e8d48b',marginTop:'4px' }}>
              <input autoFocus value={newLabel} onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter') addItem(); if(e.key==='Escape') onStopAdding(); }}
                placeholder="새 항목 이름 입력 후 Enter"
                style={{ ...inputSt,flex:1,padding:'7px 11px',fontSize:'13px',border:'1px solid #f0d88a' }} />
              <button onClick={addItem}
                style={{ padding:'7px 14px',borderRadius:'8px',border:'none',background:'#c9a84c',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit' }}>추가</button>
              <button onClick={onStopAdding}
                style={{ padding:'7px 11px',borderRadius:'8px',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'13px',cursor:'pointer',fontFamily:'inherit' }}>취소</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function CodeTab() {
  const [addingType, setAddingType] = useState<string | null>(null);
  const [newLabel,   setNewLabel]   = useState('');

  const stopAdding = () => { setAddingType(null); setNewLabel(''); };

  return (
    <div>
      {CODE_CATEGORIES.map(cat => (
        <CodeSection
          key={cat.type}
          cat={cat}
          isAdding={addingType === cat.type}
          onStartAdding={() => { setAddingType(cat.type); setNewLabel(''); }}
          onStopAdding={stopAdding}
          newLabel={newLabel}
          setNewLabel={setNewLabel}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 탭 3: 사용자 관리
// ═══════════════════════════════════════════════════════
const ROLE_LABELS: Record<string, string> = {
  senior_pastor:   '담임목사',
  associate_pastor:'부목사',
  admin_staff:     '사무 담당자',
  admin:           '관리자',
  staff:           '직원',
  viewer:          '열람자',
};
const ROLE_COLORS: Record<string, string> = {
  senior_pastor:'#c9a84c', associate_pastor:'#7c3aed', admin_staff:'#0891b2',
  admin:'#c9a84c', staff:'#0891b2', viewer:'#9ca3af',
};

function UsersTab() {
  const [users,   setUsers]   = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting,setInviting]= useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole,  setInviteRole]  = useState('staff');
  const [alert,   setAlert]   = useState<{type:'ok'|'err',msg:string}|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setUsers(await apiClient<UserItem[]>('/api/v1/users')); }
    catch { setUsers([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeRole = async (user: UserItem, role: string) => {
    try { await apiClient(`/api/v1/users/${user.id}`, { method:'PUT', body: JSON.stringify({ ...user, role }) }); load(); }
    catch { setAlert({ type:'err', msg:'역할 변경에 실패했습니다.' }); }
  };

  const toggleActive = async (user: UserItem) => {
    try { await apiClient(`/api/v1/users/${user.id}`, { method:'PUT', body: JSON.stringify({ ...user, is_active: !user.is_active }) }); load(); }
    catch {}
  };

  const invite = async () => {
    if (!inviteEmail.trim()) return;
    setAlert(null);
    try {
      await apiClient('/api/v1/users/invite', { method:'POST', body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }) });
      setAlert({ type:'ok', msg:`${inviteEmail} 으로 초대 메일을 발송했습니다.` });
      setInviting(false); setInviteEmail(''); load();
    } catch (e) {
      setAlert({ type:'err', msg: e instanceof Error ? e.message : '초대에 실패했습니다.' });
    }
  };

  return (
    <div>
      {alert && <Alert type={alert.type} msg={alert.msg} />}
      <div style={card}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px' }}>
          {sectionTitle('사용자 목록')}
          <button onClick={() => setInviting(v => !v)}
            style={{ display:'flex',alignItems:'center',gap:'5px',padding:'8px 14px',borderRadius:'9px',border:'none',background:'linear-gradient(135deg,#c9a84c,#c9a84c)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 3px 10px rgba(201,168,76,0.3)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            사용자 초대
          </button>
        </div>

        {/* 초대 폼 */}
        {inviting && (
          <div style={{ display:'flex',gap:'8px',padding:'14px',borderRadius:'10px',background:'#fdf8e8',border:'1.5px dashed #e8d48b',marginBottom:'14px',flexWrap:'wrap' }}>
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              placeholder="초대할 이메일 주소"
              style={{ ...inputSt, flex:'2 1 200px', padding:'8px 12px',fontSize:'13px',border:'1px solid #f0d88a' }} />
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
              style={{ ...inputSt, flex:'1 1 120px', padding:'8px 12px',fontSize:'13px',border:'1px solid #f0d88a' }}>
              <option value="admin_staff">사무 담당자</option>
              <option value="associate_pastor">부목사</option>
              <option value="viewer">열람자</option>
            </select>
            <button onClick={invite}
              style={{ padding:'8px 16px',borderRadius:'9px',border:'none',background:'#c9a84c',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',flexShrink:0 }}>초대 발송</button>
            <button onClick={() => { setInviting(false); setInviteEmail(''); }}
              style={{ padding:'8px 12px',borderRadius:'9px',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'13px',cursor:'pointer',fontFamily:'inherit',flexShrink:0 }}>취소</button>
          </div>
        )}

        {loading ? <div style={{ color:'#9ca3af',fontSize:'13px' }}>불러오는 중...</div> : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'13px' }}>
              <thead>
                <tr style={{ background:'#f8fafc',borderBottom:'1.5px solid #e5e7eb' }}>
                  {['이름','이메일','역할','상태',''].map(h => (
                    <th key={h} style={{ padding:'9px 13px',textAlign:'left',fontWeight:700,color:'#6b7280',whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom:'1px solid #f1f5f9',transition:'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background='#f8faff'}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background='transparent'}>
                    <td style={{ padding:'11px 13px',fontWeight:600,color:'#1a1a1a',whiteSpace:'nowrap' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
                        <div style={{ width:'28px',height:'28px',borderRadius:'50%',background:'linear-gradient(135deg,#fdf8e8,#f0d88a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:800,color:'#c9a84c',flexShrink:0 }}>
                          {u.full_name.charAt(0)}
                        </div>
                        {u.full_name}
                      </div>
                    </td>
                    <td style={{ padding:'11px 13px',color:'#6b7280' }}>{u.email}</td>
                    <td style={{ padding:'11px 13px' }}>
                      <select value={u.role} onChange={e => changeRole(u, e.target.value)}
                        style={{ padding:'5px 9px',borderRadius:'7px',border:'1.5px solid #e5e7eb',fontSize:'12px',color:ROLE_COLORS[u.role]??'#374151',fontWeight:600,cursor:'pointer',fontFamily:'inherit',background:'#fff',outline:'none' }}>
                        {Object.entries(ROLE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td style={{ padding:'11px 13px' }}>
                      <button onClick={() => toggleActive(u)}
                        style={{ padding:'4px 12px',borderRadius:'20px',border:`1px solid ${u.is_active?'#10b981':'#e5e7eb'}`,background:u.is_active?'#ecfdf5':'#f9fafb',color:u.is_active?'#059669':'#9ca3af',fontSize:'11px',fontWeight:600,cursor:'pointer',transition:'all 0.15s',fontFamily:'inherit' }}>
                        {u.is_active ? '활성' : '비활성'}
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div style={{ textAlign:'center',padding:'30px',color:'#9ca3af',fontSize:'13px' }}>등록된 사용자가 없습니다</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 탭 4: 요금제
// ═══════════════════════════════════════════════════════
const PLANS = [
  { key:'free',      label:'무료',    price:0,    members:30,  color:'#6b7280' },
  { key:'growth',    label:'성장',    price:49,   members:100, color:'#10b981' },
  { key:'community', label:'공동체',  price:99,   members:500, color:'#c9a84c' },
  { key:'enterprise',label:'대형',   price:199,  members:null, color:'#f59e0b' },
];
const FEATURES = [
  { label:'교인 관리',       free:true,  growth:true,  community:true,  enterprise:true  },
  { label:'헌금 관리',       free:true,  growth:true,  community:true,  enterprise:true  },
  { label:'재정 관리',       free:true,  growth:true,  community:true,  enterprise:true  },
  { label:'예산 편성',       free:false, growth:true,  community:true,  enterprise:true  },
  { label:'재정 보고서',     free:false, growth:true,  community:true,  enterprise:true  },
  { label:'교인 한도',       free:'30명',  growth:'100명', community:'500명', enterprise:'무제한' },
  { label:'사용자 수',       free:'1명',   growth:'2명',   community:'5명',   enterprise:'무제한' },
  { label:'데이터 보관',     free:'1년', growth:'3년', community:'무제한', enterprise:'무제한' },
  { label:'AI 목회 도우미',  free:false, growth:false, community:true,   enterprise:true  },
  { label:'API 접근',        free:false, growth:false, community:false,  enterprise:true  },
  { label:'전담 고객 지원',  free:false, growth:false, community:false,  enterprise:true  },
];

function PlanTab() {
  // 실제 연동 시 API에서 받아오는 값. 임시로 free 사용
  const currentPlan = 'free';
  const currentMembers = 24;

  const currentPlanData = PLANS.find(p => p.key === currentPlan)!;

  const check = (v: boolean | string) => {
    if (v === true)  return <span style={{ color:'#10b981',fontSize:'16px' }}>✓</span>;
    if (v === false) return <span style={{ color:'#d1d5db',fontSize:'16px' }}>—</span>;
    return <span style={{ fontSize:'12px',fontWeight:600,color:'#374151' }}>{v}</span>;
  };

  return (
    <div>
      {/* 현재 요금제 카드 */}
      <div style={{ ...card, background:'linear-gradient(135deg,#2a1f10,#3d2e18)', border:'none', marginBottom:'16px' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'16px' }}>
          <div>
            <div style={{ fontSize:'12px',color:'rgba(165,180,252,0.8)',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'6px' }}>현재 요금제</div>
            <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
              <span style={{ fontSize:'26px',fontWeight:900,color:'#fff',letterSpacing:'-0.04em' }}>{currentPlanData.label}</span>
              <span style={{ padding:'3px 10px',borderRadius:'20px',background:'rgba(255,255,255,0.12)',color:'#f0d88a',fontSize:'12px',fontWeight:600 }}>
                {currentPlanData.price === 0 ? 'Free' : currentPlanData.price === null ? '문의' : `$${currentPlanData.price}/월`}
              </span>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'12px',color:'rgba(165,180,252,0.8)',marginBottom:'4px' }}>교인 현황</div>
            <div style={{ fontSize:'22px',fontWeight:800,color:'#fff' }}>
              {currentMembers}
              <span style={{ fontSize:'14px',color:'rgba(255,255,255,0.5)',fontWeight:500 }}>
                /{currentPlanData.members !== null ? `${currentPlanData.members.toLocaleString('ko-KR')}` : '무제한'}명
              </span>
            </div>
            {/* 사용량 바 */}
            {currentPlanData.members && (
              <div style={{ width:'160px',height:'6px',borderRadius:'99px',background:'rgba(255,255,255,0.15)',marginTop:'6px',marginLeft:'auto' }}>
                <div style={{ height:'100%',width:`${Math.min(100,(currentMembers/currentPlanData.members)*100)}%`,borderRadius:'99px',background:'linear-gradient(90deg,#e8d48b,#d4b85c)',transition:'width 0.4s' }}/>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 요금제 비교 표 */}
      <div style={card}>
        {sectionTitle('요금제 비교')}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'13px' }}>
            <thead>
              <tr>
                <th style={{ padding:'10px 14px',textAlign:'left',fontWeight:700,color:'#6b7280',borderBottom:'1.5px solid #e5e7eb',minWidth:'120px' }}>기능</th>
                {PLANS.map(p => (
                  <th key={p.key} style={{ padding:'10px 14px',textAlign:'center',borderBottom:'1.5px solid #e5e7eb',minWidth:'90px' }}>
                    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:'3px' }}>
                      <span style={{ fontWeight:700,color: p.key===currentPlan ? p.color : '#374151' }}>
                        {p.label}
                        {p.key===currentPlan && <span style={{ marginLeft:'4px',fontSize:'10px',color:'#fff',background:p.color,padding:'1px 5px',borderRadius:'4px' }}>현재</span>}
                        {p.key==='community' && p.key!==currentPlan && <span style={{ marginLeft:'4px',fontSize:'10px',color:'#fff',background:'#c9a84c',padding:'1px 5px',borderRadius:'4px' }}>가장 인기</span>}
                      </span>
                      <span style={{ fontSize:'11px',color:'#9ca3af',fontWeight:400 }}>
                        {p.price === null ? '문의' : p.price === 0 ? 'Free' : `$${p.price}/월`}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, i) => (
                <tr key={f.label} style={{ background: i%2===0?'#fff':'#fafbff', borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'10px 14px',color:'#374151',fontWeight:500 }}>{f.label}</td>
                  <td style={{ padding:'10px 14px',textAlign:'center' }}>{check(f.free)}</td>
                  <td style={{ padding:'10px 14px',textAlign:'center' }}>{check(f.growth)}</td>
                  <td style={{ padding:'10px 14px',textAlign:'center' }}>{check(f.community)}</td>
                  <td style={{ padding:'10px 14px',textAlign:'center' }}>{check(f.enterprise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 업그레이드 버튼 */}
        <div style={{ marginTop:'20px',padding:'18px',borderRadius:'12px',background:'linear-gradient(135deg,#f5f7ff,#fdf8e8)',textAlign:'center' }}>
          <p style={{ margin:'0 0 10px',fontSize:'14px',color:'#374151',fontWeight:500 }}>
            더 많은 기능이 필요하신가요?
          </p>
          <a href="mailto:support@j-sheepfold.com"
            style={{ display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 24px',borderRadius:'10px',background:'linear-gradient(135deg,#c9a84c,#c9a84c)',color:'#fff',fontSize:'14px',fontWeight:700,textDecoration:'none',boxShadow:'0 4px 12px rgba(201,168,76,0.3)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            업그레이드 문의
          </a>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 메인: 설정 페이지
// ═══════════════════════════════════════════════════════
const TABS = [
  { key:'church', label:'교회 정보',   icon:'🏛️' },
  { key:'codes',  label:'코드 관리',   icon:'🏷️' },
  { key:'users',  label:'사용자 관리', icon:'👥' },
  { key:'plan',   label:'요금제',      icon:'💳' },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<string>('church');

  return (
    <>
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .inp:focus { border-color:#c9a84c !important; box-shadow:0 0 0 3px rgba(201,168,76,0.12) !important; }
        select.inp { cursor:pointer; }
        .tab-btn { display:flex;align-items:center;gap:7px;padding:9px 16px;border-radius:10px;border:none;background:transparent;font-size:14px;font-weight:500;color:#6b7280;cursor:pointer;white-space:nowrap;transition:all 0.15s;font-family:inherit; }
        .tab-btn:hover { background:#f1f5f9;color:#374151; }
        .tab-btn.active { background:linear-gradient(135deg,#c9a84c,#c9a84c);color:#fff;font-weight:700;box-shadow:0 3px 10px rgba(201,168,76,0.3); }
      `}</style>

      <div style={{ padding:'36px 40px', maxWidth:'820px' }}>
        {/* 헤더 */}
        <div style={{ marginBottom:'28px' }}>
          <h1 style={{ fontSize:'26px',fontWeight:800,color:'#1a1a1a',letterSpacing:'-0.04em',margin:'0 0 5px' }}>설정</h1>
          <p style={{ margin:0,fontSize:'13px',color:'#9ca3af',fontWeight:500 }}>교회 정보 및 시스템 설정을 관리합니다</p>
        </div>

        {/* 탭 바 */}
        <div style={{ display:'flex',gap:'4px',padding:'5px',background:'#f8fafc',borderRadius:'13px',border:'1px solid #e5e7eb',marginBottom:'24px',flexWrap:'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} className={`tab-btn${tab===t.key?' active':''}`} onClick={() => setTab(t.key)}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div style={{ animation:'fadeIn 0.2s ease' }} key={tab}>
          {tab==='church' && <ChurchTab />}
          {tab==='codes'  && <CodeTab />}
          {tab==='users'  && <UsersTab />}
          {tab==='plan'   && <PlanTab />}
        </div>
      </div>
    </>
  );
}

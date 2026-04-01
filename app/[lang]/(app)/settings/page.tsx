'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
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
  currency?:    string;
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
const sectionTitle = (title: string) => (
  <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px' }}>
    <div style={{ width:'4px',height:'18px',background:'linear-gradient(#c9a84c,#c9a84c)',borderRadius:'99px' }}/>
    <span style={{ fontSize:'15px',fontWeight:700,color:'#1a1a1a' }}>{title}</span>
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
  const { t, lang } = useTranslation();
  const [data,    setData]    = useState<Church | null>(null);
  const [form,    setForm]    = useState<Partial<Church>>({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [alert,   setAlert]   = useState<{type:'ok'|'err', msg:string}|null>(null);

  useEffect(() => {
    apiClient<Church>('/api/v1/churches/me').then(d => {
      setData(d); setForm(d);
      if (d.currency) localStorage.setItem('currency', d.currency);
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
      setAlert({ type:'ok', msg: t.common.saved });
    } catch (e) {
      setAlert({ type:'err', msg: e instanceof Error ? e.message : t.common.saveError });
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ color:'#9ca3af',fontSize:'14px',padding:'20px 0' }}>{t.common.loading}</div>;

  const f = (key: keyof Church) => ({
    value: (form[key] as string) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
  });

  return (
    <div>
      {alert && <Alert type={alert.type} msg={alert.msg} />}
      <div style={card}>
        {sectionTitle(t.settings.churchBasicInfo)}
        <div className="r-grid-2" style={{ gap:'14px' }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={labelSt}>{t.settings.churchName} <span style={{ color:'#ef4444' }}>*</span></label>
            <input className="inp" style={inputSt} placeholder={t.settings.churchName} {...f('name')} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={labelSt}>{t.members.address}</label>
            <div style={{ display:'flex',gap:'8px' }}>
              <input className="inp" style={{ ...inputSt, flex:1 }} placeholder={t.members.address} {...f('address')} />
              <button type="button" onClick={openPostcode}
                style={{ padding:'0 14px',borderRadius:'9px',border:'1.5px solid #c9a84c',background:'#fdf8e8',color:'#c9a84c',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',transition:'all 0.15s' }}>
                {t.settings.addressSearch}
              </button>
            </div>
          </div>
          <div>
            <label style={labelSt}>{t.settings.phone}</label>
            <input className="inp" style={inputSt} placeholder="02-000-0000" type="tel" {...f('phone')} />
          </div>
          <div>
            <label style={labelSt}>{t.settings.foundedDate}</label>
            <input className="inp" style={inputSt} type="date" {...f('founded_at')} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={labelSt}>{t.settings.denomination}</label>
            <select className="inp" style={inputSt} {...f('denomination')}>
              <option value="">{t.settings.denominationSelect}</option>
              {t.settings.denominations.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={labelSt}>{lang === 'ko' ? '통화 설정' : 'Currency'}</label>
            <select className="inp" style={inputSt}
              value={form.currency ?? 'KRW'}
              onChange={e => {
                setForm(p => ({ ...p, currency: e.target.value }));
                localStorage.setItem('currency', e.target.value);
              }}
            >
              <option value="KRW">KRW — ₩ Korean Won</option>
              <option value="USD">USD — $ US Dollar</option>
              <option value="JPY">JPY — ¥ Japanese Yen</option>
              <option value="CNY">CNY — ¥ Chinese Yuan</option>
              <option value="EUR">EUR — € Euro</option>
              <option value="GBP">GBP — £ British Pound</option>
              <option value="CAD">CAD — $ Canadian Dollar</option>
              <option value="AUD">AUD — $ Australian Dollar</option>
              <option value="SGD">SGD — $ Singapore Dollar</option>
              <option value="PHP">PHP — ₱ Philippine Peso</option>
              <option value="VND">VND — ₫ Vietnamese Dong</option>
              <option value="THB">THB — ฿ Thai Baht</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop:'20px',textAlign:'right' }}>
          <button onClick={save} disabled={saving}
            style={{ padding:'10px 24px',borderRadius:'10px',border:'none',background:saving?'#f0d88a':'linear-gradient(135deg,#c9a84c,#c9a84c)',color:saving?'#d4b85c':'#fff',fontSize:'14px',fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:'inherit',transition:'all 0.2s',boxShadow:saving?'none':'0 4px 12px rgba(201,168,76,0.3)' }}>
            {saving ? t.common.saving : t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 탭 2: 코드 관리
// ═══════════════════════════════════════════════════════
const CODE_CATEGORY_TYPES = ['offering_type', 'worship_type', 'transaction_category', 'budget_category'] as const;

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
  const { t } = useTranslation();
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
        <span style={{ flex:1, fontSize:'13px', fontWeight:500, color:item.is_active?'#111827':'#9ca3af', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {item.label}
        </span>
      )}

      {/* 활성 토글 */}
      <button onClick={onToggle}
        style={{ padding:'3px 10px',borderRadius:'20px',border:`1px solid ${item.is_active?'#10b981':'#e5e7eb'}`,background:item.is_active?'#ecfdf5':'#f9fafb',color:item.is_active?'#059669':'#9ca3af',fontSize:'11px',fontWeight:600,cursor:'pointer',transition:'all 0.15s',fontFamily:'inherit' }}>
        {item.is_active ? t.common.active : t.common.inactive}
      </button>

      {/* 편집/저장 */}
      {editId === item.id ? (
        <>
          <button onClick={onSaveEdit}
            style={{ padding:'4px 10px',borderRadius:'7px',border:'none',background:'#c9a84c',color:'#fff',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit' }}>{t.common.save}</button>
          <button onClick={onCancelEdit}
            style={{ padding:'4px 10px',borderRadius:'7px',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'12px',cursor:'pointer',fontFamily:'inherit' }}>{t.common.cancel}</button>
        </>
      ) : (
        <button onClick={onStartEdit}
          style={{ padding:'4px 8px',borderRadius:'7px',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'12px',cursor:'pointer',fontFamily:'inherit' }}>{t.common.edit}</button>
      )}

      {/* 삭제 */}
      <button onClick={onDelete}
        style={{ padding:'4px 8px',borderRadius:'7px',border:'1px solid #fecaca',background:'#fff',color:'#ef4444',fontSize:'12px',cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s' }}>{t.common.delete}</button>
    </div>
  );
}

function CodeSection({
  cat, isAdding, onStartAdding, onStopAdding, newLabel, setNewLabel,
}: {
  cat: { type:string; label:string; };
  isAdding: boolean;
  onStartAdding: () => void;
  onStopAdding: () => void;
  newLabel: string;
  setNewLabel: (v: string) => void;
}) {
  const { t } = useTranslation();
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
    if (!confirm(t.common.deleteConfirm)) return;
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
          <span style={{ fontSize:'12px',color:'#9ca3af',fontWeight:500 }}>{items.length}{t.common.items}</span>
        </div>
        <button onClick={() => { onStartAdding(); setNewLabel(''); }}
          style={{ display:'flex',alignItems:'center',gap:'5px',padding:'6px 12px',borderRadius:'8px',border:'1.5px solid #c9a84c',background:'#fdf8e8',color:'#c9a84c',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {t.settings.addItem}
        </button>
      </div>

      {loading ? (
        <div style={{ color:'#9ca3af',fontSize:'13px' }}>{t.common.loading}</div>
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
            <div style={{ textAlign:'center',padding:'20px',color:'#9ca3af',fontSize:'13px' }}>{t.settings.noRegisteredItems}</div>
          )}

          {isAdding && (
            <div style={{ display:'flex',gap:'8px',padding:'8px',borderRadius:'8px',background:'#fdf8e8',border:'1.5px dashed #e8d48b',marginTop:'4px' }}>
              <input autoFocus value={newLabel} onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter') addItem(); if(e.key==='Escape') onStopAdding(); }}
                placeholder={t.settings.newItemPlaceholder}
                style={{ ...inputSt,flex:1,padding:'7px 11px',fontSize:'13px',border:'1px solid #f0d88a' }} />
              <button onClick={addItem}
                style={{ padding:'7px 14px',borderRadius:'8px',border:'none',background:'#c9a84c',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit' }}>{t.common.add}</button>
              <button onClick={onStopAdding}
                style={{ padding:'7px 11px',borderRadius:'8px',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'13px',cursor:'pointer',fontFamily:'inherit' }}>{t.common.cancel}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function CodeTab() {
  const { t } = useTranslation();
  const [addingType, setAddingType] = useState<string | null>(null);
  const [newLabel,   setNewLabel]   = useState('');

  const stopAdding = () => { setAddingType(null); setNewLabel(''); };

  const categories = t.settings.codeCategories;

  return (
    <div>
      {categories.map(cat => (
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
// ROLE_LABELS are now provided by t.settings.roleLabels
const ROLE_COLORS: Record<string, string> = {
  senior_pastor:'#c9a84c', associate_pastor:'#7c3aed', admin_staff:'#0891b2',
  admin:'#c9a84c', staff:'#0891b2', viewer:'#9ca3af',
};

function UsersTab() {
  const { t } = useTranslation();
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
    catch { setAlert({ type:'err', msg: t.settings.roleChangeFailed }); }
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
      setAlert({ type:'ok', msg: t.settings.inviteSentMsg.replace('{email}', inviteEmail) });
      setInviting(false); setInviteEmail(''); load();
    } catch (e) {
      setAlert({ type:'err', msg: e instanceof Error ? e.message : t.settings.inviteFailed });
    }
  };

  return (
    <div>
      {alert && <Alert type={alert.type} msg={alert.msg} />}
      <div style={card}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px' }}>
          {sectionTitle(t.settings.userList)}
          <button onClick={() => setInviting(v => !v)}
            style={{ display:'flex',alignItems:'center',gap:'5px',padding:'8px 14px',borderRadius:'9px',border:'none',background:'linear-gradient(135deg,#c9a84c,#c9a84c)',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 3px 10px rgba(201,168,76,0.3)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {t.settings.inviteUser}
          </button>
        </div>

        {/* 초대 폼 */}
        {inviting && (
          <div style={{ display:'flex',gap:'8px',padding:'14px',borderRadius:'10px',background:'#fdf8e8',border:'1.5px dashed #e8d48b',marginBottom:'14px',flexWrap:'wrap' }}>
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              placeholder={t.settings.inviteEmailPlaceholder}
              style={{ ...inputSt, flex:'2 1 200px', padding:'8px 12px',fontSize:'13px',border:'1px solid #f0d88a' }} />
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
              style={{ ...inputSt, flex:'1 1 120px', padding:'8px 12px',fontSize:'13px',border:'1px solid #f0d88a' }}>
              <option value="admin_staff">{t.settings.roleLabels.admin_staff}</option>
              <option value="associate_pastor">{t.settings.roleLabels.associate_pastor}</option>
              <option value="viewer">{t.settings.roleLabels.viewer}</option>
            </select>
            <button onClick={invite}
              style={{ padding:'8px 16px',borderRadius:'9px',border:'none',background:'#c9a84c',color:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',flexShrink:0 }}>{t.settings.sendInvite}</button>
            <button onClick={() => { setInviting(false); setInviteEmail(''); }}
              style={{ padding:'8px 12px',borderRadius:'9px',border:'1px solid #e5e7eb',background:'#fff',color:'#6b7280',fontSize:'13px',cursor:'pointer',fontFamily:'inherit',flexShrink:0 }}>{t.common.cancel}</button>
          </div>
        )}

        {loading ? <div style={{ color:'#9ca3af',fontSize:'13px' }}>{t.common.loading}</div> : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'13px' }}>
              <thead>
                <tr style={{ background:'#f8fafc',borderBottom:'1.5px solid #e5e7eb' }}>
                  {t.settings.headers.map(h => (
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
                    <td style={{ padding:'11px 13px',color:'#6b7280',maxWidth:'160px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{u.email}</td>
                    <td style={{ padding:'11px 13px' }}>
                      <select value={u.role} onChange={e => changeRole(u, e.target.value)}
                        style={{ padding:'5px 9px',borderRadius:'7px',border:'1.5px solid #e5e7eb',fontSize:'12px',color:ROLE_COLORS[u.role]??'#374151',fontWeight:600,cursor:'pointer',fontFamily:'inherit',background:'#fff',outline:'none',maxWidth:'130px' }}>
                        {Object.entries(t.settings.roleLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td style={{ padding:'11px 13px' }}>
                      <button onClick={() => toggleActive(u)}
                        style={{ padding:'4px 12px',borderRadius:'20px',border:`1px solid ${u.is_active?'#10b981':'#e5e7eb'}`,background:u.is_active?'#ecfdf5':'#f9fafb',color:u.is_active?'#059669':'#9ca3af',fontSize:'11px',fontWeight:600,cursor:'pointer',transition:'all 0.15s',fontFamily:'inherit' }}>
                        {u.is_active ? t.common.active : t.common.inactive}
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div style={{ textAlign:'center',padding:'30px',color:'#9ca3af',fontSize:'13px' }}>{t.settings.noUsers}</div>
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
const PLAN_COLORS: Record<string, string> = { free:'#6b7280', growth:'#10b981', community:'#c9a84c', enterprise:'#f59e0b' };
const PLAN_PRICES: Record<string, number | null> = { free:0, growth:49, community:99, enterprise:199 };
const PLAN_MEMBERS: Record<string, number | null> = { free:30, growth:100, community:500, enterprise:null };
const FEATURE_DATA = [
  { idx:0, free:true,  growth:true,  community:true,  enterprise:true  },
  { idx:1, free:true,  growth:true,  community:true,  enterprise:true  },
  { idx:2, free:false, growth:true,  community:true,  enterprise:true  },
  { idx:3, free:false, growth:true,  community:true,  enterprise:true  },
  { idx:4, free:false, growth:false, community:true,  enterprise:true  },
  { idx:5, free:false, growth:false, community:true,  enterprise:true  },
  { idx:6, free:'30',  growth:'100', community:'500', enterprise:'unlimited' },
  { idx:7, free:'1',   growth:'2',   community:'5',   enterprise:'unlimited' },
  { idx:8, free:false, growth:false, community:false, enterprise:true  },
];

function PlanTab() {
  const { t } = useTranslation();
  // 실제 연동 시 API에서 받아오는 값. 임시로 free 사용
  const currentPlan: string = 'free';
  const currentMembers = 24;

  const planKeys = ['free', 'growth', 'community', 'enterprise'] as const;

  const check = (v: boolean | string) => {
    if (v === true)  return <span style={{ color:'#10b981',fontSize:'16px' }}>✓</span>;
    if (v === false) return <span style={{ color:'#d1d5db',fontSize:'16px' }}>—</span>;
    return <span style={{ fontSize:'12px',fontWeight:600,color:'#374151' }}>{v}</span>;
  };

  const curPrice = PLAN_PRICES[currentPlan];
  const curMembers = PLAN_MEMBERS[currentPlan];
  const curColor = PLAN_COLORS[currentPlan];

  const priceLabel = (price: number | null) =>
    price === null ? t.settings.contact : price === 0 ? 'Free' : `$${price}/mo`;

  return (
    <div>
      {/* 현재 요금제 카드 */}
      <div style={{ ...card, background:'linear-gradient(135deg,#2a1f10,#3d2e18)', border:'none', marginBottom:'16px' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'16px' }}>
          <div>
            <div style={{ fontSize:'12px',color:'rgba(165,180,252,0.8)',fontWeight:600,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'6px' }}>{t.settings.currentPlan}</div>
            <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
              <span style={{ fontSize:'26px',fontWeight:900,color:'#fff',letterSpacing:'-0.04em' }}>{t.settings.planNames[currentPlan as keyof typeof t.settings.planNames]}</span>
              <span style={{ padding:'3px 10px',borderRadius:'20px',background:'rgba(255,255,255,0.12)',color:'#f0d88a',fontSize:'12px',fontWeight:600 }}>
                {priceLabel(curPrice!)}
              </span>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'12px',color:'rgba(165,180,252,0.8)',marginBottom:'4px' }}>{t.settings.memberStatus}</div>
            <div style={{ fontSize:'22px',fontWeight:800,color:'#fff' }}>
              {currentMembers}
              <span style={{ fontSize:'14px',color:'rgba(255,255,255,0.5)',fontWeight:500 }}>
                /{curMembers !== null ? curMembers.toLocaleString() : t.settings.unlimited}{t.common.people}
              </span>
            </div>
            {curMembers && (
              <div style={{ width:'160px',height:'6px',borderRadius:'99px',background:'rgba(255,255,255,0.15)',marginTop:'6px',marginLeft:'auto' }}>
                <div style={{ height:'100%',width:`${Math.min(100,(currentMembers/curMembers)*100)}%`,borderRadius:'99px',background:'linear-gradient(90deg,#e8d48b,#d4b85c)',transition:'width 0.4s' }}/>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 요금제 비교 표 */}
      <div style={card}>
        {sectionTitle(t.settings.planComparison)}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'13px' }}>
            <thead>
              <tr>
                <th style={{ padding:'10px 14px',textAlign:'left',fontWeight:700,color:'#6b7280',borderBottom:'1.5px solid #e5e7eb',minWidth:'120px' }}>{t.settings.featureLabel}</th>
                {planKeys.map(pk => (
                  <th key={pk} style={{ padding:'10px 14px',textAlign:'center',borderBottom:'1.5px solid #e5e7eb',minWidth:'90px' }}>
                    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:'3px' }}>
                      <span style={{ fontWeight:700,color: pk===currentPlan ? PLAN_COLORS[pk] : '#374151' }}>
                        {t.settings.planNames[pk]}
                        {pk===currentPlan && <span style={{ marginLeft:'4px',fontSize:'10px',color:'#fff',background:PLAN_COLORS[pk],padding:'1px 5px',borderRadius:'4px' }}>{t.settings.current}</span>}
                        {pk==='community' && pk!==currentPlan && <span style={{ marginLeft:'4px',fontSize:'10px',color:'#fff',background:'#c9a84c',padding:'1px 5px',borderRadius:'4px' }}>{t.settings.mostPopular}</span>}
                      </span>
                      <span style={{ fontSize:'11px',color:'#9ca3af',fontWeight:400 }}>
                        {priceLabel(PLAN_PRICES[pk]!)}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_DATA.map((f, i) => (
                <tr key={i} style={{ background: i%2===0?'#fff':'#fafbff', borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'10px 14px',color:'#374151',fontWeight:500 }}>{t.settings.features[f.idx]}</td>
                  <td style={{ padding:'10px 14px',textAlign:'center' }}>{check(f.free === 'unlimited' ? t.settings.unlimited : f.free)}</td>
                  <td style={{ padding:'10px 14px',textAlign:'center' }}>{check(f.growth === 'unlimited' ? t.settings.unlimited : f.growth)}</td>
                  <td style={{ padding:'10px 14px',textAlign:'center' }}>{check(f.community === 'unlimited' ? t.settings.unlimited : f.community)}</td>
                  <td style={{ padding:'10px 14px',textAlign:'center' }}>{check(f.enterprise === 'unlimited' ? t.settings.unlimited : f.enterprise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 업그레이드 버튼 */}
        <div style={{ marginTop:'20px',padding:'18px',borderRadius:'12px',background:'linear-gradient(135deg,#f5f7ff,#fdf8e8)',textAlign:'center' }}>
          <p style={{ margin:'0 0 10px',fontSize:'14px',color:'#374151',fontWeight:500 }}>
            {t.settings.needMore}
          </p>
          <a href="mailto:support@j-sheepfold.com"
            style={{ display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 24px',borderRadius:'10px',background:'linear-gradient(135deg,#c9a84c,#c9a84c)',color:'#fff',fontSize:'14px',fontWeight:700,textDecoration:'none',boxShadow:'0 4px 12px rgba(201,168,76,0.3)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            {t.settings.upgradeContact}
          </a>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 탭 5: 데이터 관리 (백업/복구)
// ═══════════════════════════════════════════════════════
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

function DataTab() {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string,number> | null>(null);
  const [replaceMode, setReplaceMode] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{imported:Record<string,number>,skipped:Record<string,number>,errors:string[]} | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // ── 자동 백업 이메일 상태 ─────────────────────────────
  const [emailSettings, setEmailSettings] = useState({
    is_enabled: false, frequency: 'monthly', send_to_email: '',
    last_backup_at: null as string|null, next_backup_at: null as string|null,
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsAlert, setSettingsAlert] = useState<{type:'ok'|'err';msg:string}|null>(null);
  const [sendingNow, setSendingNow] = useState(false);
  const [sendNowAlert, setSendNowAlert] = useState<{type:'ok'|'err';msg:string}|null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    fetch(`${BASE_URL}/api/v1/backup/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setEmailSettings(d)).catch(() => {});
  }, []);

  // ── 내보내기 ──────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const res = await fetch(`${BASE_URL}/api/v1/backup/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`오류 ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `jsheepfold-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setLastExport(new Date().toLocaleString());
    } catch (e: unknown) {
      alert(`${t.settingsBackup.errExport} ${e instanceof Error ? e.message : e}`);
    } finally {
      setExporting(false);
    }
  };

  // ── 파일 선택/드롭 ────────────────────────────────────
  const handleFile = (file: File) => {
    if (!file.name.endsWith('.json')) { alert(t.settingsBackup.jsonOnly); return; }
    setImportFile(file);
    setImportResult(null);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target?.result as string);
        const d = payload.data ?? {};
        const counts: Record<string,number> = {};
        for (const [k, v] of Object.entries(d)) {
          if (Array.isArray(v) && (v as unknown[]).length > 0) counts[k] = (v as unknown[]).length;
        }
        setPreview(counts);
      } catch { setPreview(null); }
    };
    reader.readAsText(file);
  };

  // ── 가져오기 ──────────────────────────────────────────
  const handleImport = async () => {
    if (!importFile) return;
    if (replaceMode && !confirm(t.settingsBackup.confirmReplace)) return;
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const form = new FormData();
      form.append('file', importFile);
      const res = await fetch(
        `${BASE_URL}/api/v1/backup/import?replace=${replaceMode}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? `${t.settingsBackup.errImport} ${res.status}`);
      }
      setImportResult(await res.json());
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
    }
  };

  const tableLabels = t.settingsBackup.tableLabels as Record<string, string>;

  const previewText = preview
    ? Object.entries(preview).map(([k,v]) => `${tableLabels[k]??k} ${v}`).join(', ')
    : null;

  const totalImported = importResult
    ? Object.values(importResult.imported).reduce((a,b)=>a+b,0) : 0;
  const totalSkipped = importResult
    ? Object.values(importResult.skipped).reduce((a,b)=>a+b,0) : 0;

  // ── 이메일 설정 저장 ──────────────────────────────────
  const handleSaveSettings = async () => {
    setSettingsSaving(true); setSettingsAlert(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const res = await fetch(`${BASE_URL}/api/v1/backup/settings`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_enabled: emailSettings.is_enabled,
          frequency: emailSettings.frequency,
          send_to_email: emailSettings.send_to_email,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail ?? `오류 ${res.status}`); }
      setEmailSettings(await res.json());
      setSettingsAlert({ type: 'ok', msg: t.settingsBackup.settingsSaved });
    } catch (e: unknown) {
      setSettingsAlert({ type: 'err', msg: e instanceof Error ? e.message : String(e) });
    } finally { setSettingsSaving(false); }
  };

  // ── 즉시 발송 ─────────────────────────────────────────
  const handleSendNow = async () => {
    setSendingNow(true); setSendNowAlert(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const res = await fetch(`${BASE_URL}/api/v1/backup/send-now`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail ?? `오류 ${res.status}`); }
      const d = await res.json();
      setSendNowAlert({ type: 'ok', msg: `${d.to}` });
    } catch (e: unknown) {
      setSendNowAlert({ type: 'err', msg: e instanceof Error ? e.message : String(e) });
    } finally { setSendingNow(false); }
  };

  return (
    <div>
      {/* 내보내기 */}
      <div style={card}>
        {sectionTitle(t.settingsBackup.exportTitle)}
        <p style={{ margin:'0 0 16px',fontSize:'13px',color:'#6b7280' }}>
          {t.settingsBackup.exportDesc}
        </p>
        <div style={{ display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap' }}>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{ display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 22px',borderRadius:'10px',
              background:'linear-gradient(135deg,#c9a84c,#d4b85c)',color:'#fff',fontSize:'14px',
              fontWeight:700,border:'none',cursor:exporting?'not-allowed':'pointer',
              opacity:exporting?0.7:1,boxShadow:'0 4px 12px rgba(201,168,76,0.3)' }}
          >
            {exporting ? t.settingsBackup.exporting : t.settingsBackup.exportBtn}
          </button>
          {lastExport && (
            <span style={{ fontSize:'12px',color:'#9ca3af' }}>{t.settingsBackup.lastExport} {lastExport}</span>
          )}
        </div>
      </div>

      {/* 가져오기 */}
      <div style={card}>
        {sectionTitle(t.settingsBackup.importTitle)}

        {/* 드래그앤드롭 영역 */}
        <div
          onDragOver={e=>{ e.preventDefault(); setDragOver(true); }}
          onDragLeave={()=>setDragOver(false)}
          onDrop={e=>{ e.preventDefault(); setDragOver(false); const f=e.dataTransfer.files[0]; if(f) handleFile(f); }}
          onClick={()=>{ const el=document.getElementById('backup-file-input'); el?.click(); }}
          style={{ border:`2px dashed ${dragOver?'#c9a84c':'#d1d5db'}`,borderRadius:'12px',
            padding:'32px',textAlign:'center',cursor:'pointer',background:dragOver?'rgba(201,168,76,0.04)':'#fafafa',
            transition:'all 0.15s',marginBottom:'16px' }}
        >
          <div style={{ fontSize:'32px',marginBottom:'8px' }}>📁</div>
          <div style={{ fontSize:'14px',fontWeight:600,color:'#374151',marginBottom:'4px' }}>
            {importFile ? importFile.name : t.settingsBackup.dropzone}
          </div>
          <div style={{ fontSize:'12px',color:'#9ca3af' }}>jsheepfold-backup-*.json</div>
          <input id="backup-file-input" type="file" accept=".json" style={{ display:'none' }}
            onChange={e=>{ const f=e.target.files?.[0]; if(f) handleFile(f); }} />
        </div>

        {/* 미리보기 */}
        {previewText && (
          <div style={{ padding:'12px 16px',borderRadius:'8px',background:'rgba(201,168,76,0.06)',
            border:'1px solid rgba(201,168,76,0.2)',marginBottom:'16px',fontSize:'13px',color:'#374151' }}>
            {t.settingsBackup.previewLabel} {previewText}
          </div>
        )}

        {/* 가져오기 옵션 */}
        {importFile && (
          <div style={{ marginBottom:'16px' }}>
            <div style={{ fontSize:'13px',fontWeight:600,color:'#374151',marginBottom:'8px' }}>{t.settingsBackup.importMethod}</div>
            <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
              <label style={{ display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'13px' }}>
                <input type="radio" name="import-mode" checked={!replaceMode}
                  onChange={()=>setReplaceMode(false)} />
                <span style={{ color:'#374151',fontWeight:500 }}>{t.settingsBackup.mergeLabel}</span>
                <span style={{ color:'#9ca3af' }}>{t.settingsBackup.mergeDesc}</span>
              </label>
              <label style={{ display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'13px' }}>
                <input type="radio" name="import-mode" checked={replaceMode}
                  onChange={()=>setReplaceMode(true)} />
                <span style={{ color:'#ef4444',fontWeight:600 }}>{t.settingsBackup.replaceLabel}</span>
                <span style={{ color:'#9ca3af' }}>{t.settingsBackup.replaceDesc}</span>
              </label>
            </div>
            {replaceMode && (
              <div style={{ marginTop:'10px',padding:'10px 14px',borderRadius:'8px',
                background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.2)',
                fontSize:'12px',color:'#dc2626',fontWeight:500 }}>
                {t.settingsBackup.replaceWarning}
              </div>
            )}
          </div>
        )}

        {/* 경고 문구 */}
        <div style={{ padding:'10px 14px',borderRadius:'8px',background:'#f8fafc',
          border:'1px solid #e5e7eb',fontSize:'12px',color:'#6b7280',marginBottom:'16px' }}>
          {t.settingsBackup.importWarning}
        </div>

        {/* 가져오기 버튼 */}
        <button
          onClick={handleImport}
          disabled={!importFile || importing}
          style={{ display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 22px',
            borderRadius:'10px',border:'none',cursor:!importFile||importing?'not-allowed':'pointer',
            fontSize:'14px',fontWeight:700,color:'#fff',
            background:replaceMode?'linear-gradient(135deg,#ef4444,#dc2626)':'linear-gradient(135deg,#10b981,#059669)',
            opacity:!importFile||importing?0.6:1,
            boxShadow:replaceMode?'0 4px 12px rgba(239,68,68,0.3)':'0 4px 12px rgba(16,185,129,0.3)' }}
        >
          {importing ? t.settingsBackup.importingBtn : replaceMode ? t.settingsBackup.replaceBtn : t.settingsBackup.importBtn}
        </button>

        {/* 결과 */}
        {importResult && (
          <div style={{ marginTop:'16px',padding:'16px',borderRadius:'10px',
            background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize:'14px',fontWeight:700,color:'#059669',marginBottom:'8px' }}>
              {t.settingsBackup.importDone}
            </div>
            <div style={{ fontSize:'13px',color:'#374151' }}>
              {t.settingsBackup.imported} <strong>{totalImported}</strong> &nbsp;|&nbsp;
              {t.settingsBackup.skipped} <strong>{totalSkipped}</strong>
            </div>
            {importResult.errors.length > 0 && (
              <div style={{ marginTop:'8px',padding:'8px 12px',borderRadius:'6px',
                background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.15)',
                fontSize:'12px',color:'#dc2626' }}>
                {t.settingsBackup.errCount} ({importResult.errors.length}):<br/>
                {importResult.errors.slice(0,5).map((e,i)=><span key={i}>{e}<br/></span>)}
              </div>
            )}
          </div>
        )}

        {importError && (
          <div style={{ marginTop:'16px',padding:'12px 16px',borderRadius:'10px',
            background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.2)',
            fontSize:'13px',color:'#dc2626' }}>
            ❌ {importError}
          </div>
        )}
      </div>

      {/* 자동 백업 이메일 */}
      <div style={card}>
        {sectionTitle(t.settingsBackup.autoBackupTitle)}
        <p style={{ margin:'0 0 16px',fontSize:'13px',color:'#6b7280' }}>
          {t.settingsBackup.autoBackupDesc}
        </p>

        {/* 활성화 토글 */}
        <div style={{ display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px' }}>
          <div
            onClick={() => setEmailSettings(s => ({...s, is_enabled: !s.is_enabled}))}
            style={{ width:'44px',height:'24px',borderRadius:'12px',cursor:'pointer',position:'relative',
              background:emailSettings.is_enabled?'#c9a84c':'#d1d5db',transition:'background 0.2s' }}
          >
            <div style={{ position:'absolute',top:'3px',
              left:emailSettings.is_enabled?'23px':'3px',
              width:'18px',height:'18px',borderRadius:'50%',background:'#fff',
              boxShadow:'0 1px 3px rgba(0,0,0,0.2)',transition:'left 0.2s' }}/>
          </div>
          <span style={{ fontSize:'14px',fontWeight:600,color:'#374151' }}>
            {emailSettings.is_enabled ? t.settingsBackup.enabledLabel : t.settingsBackup.disabledLabel}
          </span>
        </div>

        {/* 수신 이메일 */}
        <div style={{ marginBottom:'16px' }}>
          <label style={labelSt}>{t.settingsBackup.emailLabel}</label>
          <input
            style={inputSt}
            type="email"
            placeholder="backup@example.com"
            value={emailSettings.send_to_email}
            onChange={e => setEmailSettings(s => ({...s, send_to_email: e.target.value}))}
          />
        </div>

        {/* 백업 주기 */}
        <div style={{ marginBottom:'20px' }}>
          <label style={labelSt}>{t.settingsBackup.cycleLabel}</label>
          <div style={{ display:'flex',gap:'20px' }}>
            {[{val:'weekly',label:t.settingsBackup.weekly},{val:'monthly',label:t.settingsBackup.monthly}].map(opt => (
              <label key={opt.val} style={{ display:'flex',alignItems:'center',gap:'7px',cursor:'pointer',fontSize:'13px',color:'#374151' }}>
                <input type="radio" name="backup-freq" value={opt.val}
                  checked={emailSettings.frequency===opt.val}
                  onChange={() => setEmailSettings(s => ({...s, frequency: opt.val}))} />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* 마지막/다음 백업 시각 */}
        {(emailSettings.last_backup_at || (emailSettings.next_backup_at && emailSettings.is_enabled)) && (
          <div style={{ display:'flex',gap:'20px',marginBottom:'16px',flexWrap:'wrap' }}>
            {emailSettings.last_backup_at && (
              <div style={{ fontSize:'12px',color:'#6b7280' }}>
                {t.settingsBackup.lastBackup} <strong>{new Date(emailSettings.last_backup_at).toLocaleString()}</strong>
              </div>
            )}
            {emailSettings.next_backup_at && emailSettings.is_enabled && (
              <div style={{ fontSize:'12px',color:'#6b7280' }}>
                {t.settingsBackup.nextBackup} <strong>{new Date(emailSettings.next_backup_at).toLocaleString()}</strong>
              </div>
            )}
          </div>
        )}

        {settingsAlert && <Alert type={settingsAlert.type} msg={settingsAlert.msg} />}

        {/* 버튼 */}
        <div style={{ display:'flex',gap:'10px',flexWrap:'wrap' }}>
          <button
            onClick={handleSaveSettings}
            disabled={settingsSaving}
            style={{ display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 22px',
              borderRadius:'10px',background:'linear-gradient(135deg,#c9a84c,#d4b85c)',color:'#fff',
              fontSize:'14px',fontWeight:700,border:'none',cursor:settingsSaving?'not-allowed':'pointer',
              opacity:settingsSaving?0.7:1,boxShadow:'0 4px 12px rgba(201,168,76,0.3)' }}
          >
            {settingsSaving ? `⏳ ${t.settingsBackup.savingSettings}` : `💾 ${t.settingsBackup.saveSettings}`}
          </button>
          <button
            onClick={handleSendNow}
            disabled={sendingNow || !emailSettings.send_to_email}
            style={{ display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 22px',
              borderRadius:'10px',background:'#f8fafc',color:'#374151',fontSize:'14px',fontWeight:700,
              border:'1.5px solid #e5e7eb',
              cursor:sendingNow||!emailSettings.send_to_email?'not-allowed':'pointer',
              opacity:sendingNow||!emailSettings.send_to_email?0.6:1 }}
          >
            {sendingNow ? `⏳ ${t.settingsBackup.sending}` : `📧 ${t.settingsBackup.sendNow}`}
          </button>
        </div>

        {sendNowAlert && (
          <div style={{ marginTop:'12px' }}>
            <Alert type={sendNowAlert.type} msg={sendNowAlert.msg} />
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 메인: 설정 페이지
// ═══════════════════════════════════════════════════════
const TAB_ICONS: Record<string, string> = { church:'🏛️', codes:'🏷️', users:'👥', plan:'💳', backup:'🗄️' };
const TAB_KEYS = ['church', 'codes', 'users', 'plan', 'backup'] as const;

export default function SettingsPage() {
  const { t } = useTranslation();
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
        .tab-scroll { overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none; }
        .tab-scroll::-webkit-scrollbar { display:none; }
      `}</style>

      <div className="page-content" style={{ maxWidth:'820px' }}>
        {/* 헤더 */}
        <div style={{ marginBottom:'28px' }}>
          <h1 style={{ fontSize:'26px',fontWeight:800,color:'#1a1a1a',letterSpacing:'-0.04em',margin:'0 0 5px' }}>{t.settings.title}</h1>
          <p style={{ margin:0,fontSize:'13px',color:'#9ca3af',fontWeight:500 }}>{t.settings.subtitle}</p>
        </div>

        {/* 탭 바 */}
        <div className="tab-scroll" style={{ display:'flex',gap:'4px',padding:'5px',background:'#f8fafc',borderRadius:'13px',border:'1px solid #e5e7eb',marginBottom:'24px' }}>
          {TAB_KEYS.map(tk => (
            <button key={tk} className={`tab-btn${tab===tk?' active':''}`} onClick={() => setTab(tk)}>
              <span>{TAB_ICONS[tk]}</span>{t.settings.tabs[tk]}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div style={{ animation:'fadeIn 0.2s ease' }} key={tab}>
          {tab==='church'  && <ChurchTab />}
          {tab==='codes'   && <CodeTab />}
          {tab==='users'   && <UsersTab />}
          {tab==='plan'    && <PlanTab />}
          {tab==='backup'  && <DataTab />}
        </div>
      </div>
    </>
  );
}

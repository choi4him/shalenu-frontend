'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Script from 'next/script';
import { apiClient, formatKRW, formatDateKR } from '@/lib/api';


// ─── 타입 ───────────────────────────────────────────────
interface Member {
  id: number;
  name: string;
  gender?: 'M' | 'F';
  birth_date?: string;
  phone?: string;
  email?: string;
  address?: string;
  registered_date?: string;
  baptism_date?: string;
  status: 'active' | 'inactive' | 'completed' | 'withdrawn';
}

interface FamilyMember {
  id: number;
  name: string;
  relation: string;
  phone?: string;
  status?: string;
}

interface OfferingItem {
  id: number;
  offering_date: string;
  offering_type_name?: string;
  amount: number;
  payment_method?: string;
  status: string;
}

interface OfferingsResponse {
  items: OfferingItem[];
  total: number;
}

type NoteCategory = 'visit' | 'counsel' | 'prayer' | 'general';
interface PastoralNote {
  id:          number;
  category:    NoteCategory;
  content:     string;
  is_private:  boolean;
  visited_at?: string;
  created_at:  string;
  author_name?: string;
}
const NOTE_CAT: Record<NoteCategory, { label: string; color: string; bg: string; border: string; icon: string }> = {
  visit:   { label: '심방', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: '🏠' },
  counsel: { label: '상담', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '💬' },
  prayer:  { label: '기도', color: '#d97706', bg: '#fffbeb', border: '#fcd34d', icon: '🙏' },
  general: { label: '일반', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icon: '📝' },
};
function extractNoteList(res: unknown): PastoralNote[] {
  if (Array.isArray(res)) return res as PastoralNote[];
  if (res && typeof res === 'object' && 'items' in res && Array.isArray((res as any).items)) return (res as any).items as PastoralNote[];
  return [];
}

interface EditForm {
  name: string;
  gender: 'M' | 'F' | '';
  birth_date: string;
  phone: string;
  email: string;
  zipcode: string;
  road_address: string;
  detail_address: string;
  registered_date: string;
  baptism_date: string;
  status: string;
}

// ─── 상수 ───────────────────────────────────────────────
const STATUS_MAP = {
  active:    { label: '활동중',  color: '#059669', bg: '#dcfce7', border: '#bbf7d0' },
  inactive:  { label: '휴면',    color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  completed: { label: '수료',    color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  withdrawn: { label: '탈퇴',    color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
} as const;

const GENDER_MAP = { M: '남성', F: '여성' };

const PAYMENT_MAP: Record<string, string> = {
  cash: '현금', transfer: '계좌이체', card: '카드',
};

const OFFERING_STATUS_MAP = {
  draft:     { label: '임시저장', color: '#d97706', bg: '#fef3c7' },
  confirmed: { label: '확정',     color: '#059669', bg: '#dcfce7' },
};

// ─── 공통 스타일 ─────────────────────────────────────────
const inputSt: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: '9px',
  border: '1.5px solid #e5e7eb', fontSize: '14px', color: '#111827',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  background: '#fff', transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelSt: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#9ca3af',
  letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '5px', display: 'block',
};

// ─── 정보 행 컴포넌트 ─────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={labelSt}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 500, color: value ? '#111827' : '#d1d5db' }}>
        {value || '—'}
      </div>
    </div>
  );
}

// ─── 스켈레톤 ───────────────────────────────────────────
function Skeleton({ w = '100%', h = '16px' }: { w?: string; h?: string }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: '6px',
      background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
      backgroundSize: '300% 100%', animation: 'shimmer 1.5s infinite',
    }} />
  );
}

// ─── 메인 ───────────────────────────────────────────────
export default function MemberDetailPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;

  const [member,  setMember]  = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [tab,     setTab]     = useState<'info' | 'family' | 'offerings' | 'pastoral'>('info');

  // 목양 노트 탭
  const [notes,          setNotes]          = useState<PastoralNote[]>([]);
  const [notesLoading,   setNotesLoading]   = useState(false);
  const [showNoteForm,   setShowNoteForm]   = useState(false);
  const [noteForm,       setNoteForm]       = useState({ category: 'general' as NoteCategory, content: '', is_private: true, visited_at: '' });
  const [noteSaving,     setNoteSaving]     = useState(false);
  const [editingNote,    setEditingNote]    = useState<PastoralNote | null>(null);

  // 가족 탭
  const [family,       setFamily]       = useState<FamilyMember[]>([]);
  const [familyLoading, setFamilyLoading] = useState(false);

  // 헌금 탭
  const [offerings,       setOfferings]       = useState<OfferingItem[]>([]);
  const [offeringsTotal,  setOfferingsTotal]  = useState(0);
  const [offeringsLoading, setOfferingsLoading] = useState(false);

  // 편집 모드
  const [editMode,    setEditMode]    = useState(false);
  const [editForm,    setEditForm]    = useState<EditForm | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState('');

  // 삭제
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  // ── 교인 로드 ──
  const loadMember = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient<Member>(`/api/v1/members/${memberId}`);
      setMember(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '교인 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => { loadMember(); }, [loadMember]);

  // ── 가족 로드 (탭 전환 시) ──
  useEffect(() => {
    if (tab !== 'family' || family.length > 0) return;
    setFamilyLoading(true);
    apiClient<FamilyMember[]>(`/api/v1/members/${memberId}/family`)
      .then(setFamily)
      .catch(() => setFamily([]))
      .finally(() => setFamilyLoading(false));
  }, [tab, memberId, family.length]);

  // ── 헌금 로드 (탭 전환 시) ──
  useEffect(() => {
    if (tab !== 'offerings' || offerings.length > 0) return;
    setOfferingsLoading(true);
    apiClient<OfferingsResponse>(`/api/v1/offerings?member_id=${memberId}&size=50`)
      .then(r => { setOfferings(r.items ?? []); setOfferingsTotal(r.total ?? 0); })
      .catch(() => setOfferings([]))
      .finally(() => setOfferingsLoading(false));
  }, [tab, memberId, offerings.length]);

  // ── 목양 노트 로드 ──
  const loadNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      const res = await apiClient<unknown>(`/api/v1/pastoral-notes?member_id=${memberId}`);
      setNotes(extractNoteList(res));
    } catch { setNotes([]); }
    finally { setNotesLoading(false); }
  }, [memberId]);

  useEffect(() => {
    if (tab === 'pastoral') loadNotes();
  }, [tab, loadNotes]);

  // ── 노트 저장 ──
  const saveNote = async () => {
    if (!noteForm.content.trim()) return;
    setNoteSaving(true);
    try {
      if (editingNote) {
        await apiClient(`/api/v1/pastoral-notes/${editingNote.id}`, {
          method: 'PUT',
          body: JSON.stringify(noteForm),
        });
      } else {
        await apiClient('/api/v1/pastoral-notes', {
          method: 'POST',
          body: JSON.stringify({ ...noteForm, member_id: memberId }),
        });
      }
      setShowNoteForm(false);
      setEditingNote(null);
      setNoteForm({ category: 'general', content: '', is_private: true, visited_at: '' });
      await loadNotes();
    } catch { /* ignore */ }
    finally { setNoteSaving(false); }
  };

  // ── 노트 삭제 ──
  const deleteNote = async (noteId: number) => {
    if (!confirm('이 노트를 삭제하시겠습니까?')) return;
    try {
      await apiClient(`/api/v1/pastoral-notes/${noteId}`, { method: 'DELETE' });
      await loadNotes();
    } catch { /* ignore */ }
  };

  // ── 편집 모드 시작 ──
  const startEdit = () => {
    if (!member) return;
    // address를 분리 (기본주소 + 상세주소)
    const addressParts = member.address?.split('||') ?? ['', ''];
    setEditForm({
      name:           member.name,
      gender:         member.gender ?? '',
      birth_date:     member.birth_date ?? '',
      phone:          member.phone ?? '',
      email:          member.email ?? '',
      zipcode:        addressParts[2] ?? '',
      road_address:   addressParts[0] ?? '',
      detail_address: addressParts[1] ?? '',
      registered_date: member.registered_date ?? '',
      baptism_date:   member.baptism_date ?? '',
      status:         member.status,
    });
    setEditMode(true);
    setSaveError('');
  };

  // ── 편집 필드 변경 ──
  const updateField = (key: keyof EditForm, value: string) => {
    setEditForm(prev => prev ? { ...prev, [key]: value } : prev);
  };

  // ── 카카오 주소 검색 ──
  const openPostcode = () => {
    if (!window.daum?.Postcode) { alert('주소 검색 서비스를 불러오는 중입니다.'); return; }
    new window.daum.Postcode({
      oncomplete: (data) => {
        updateField('zipcode', data.zonecode);
        updateField('road_address', data.roadAddress);
        updateField('detail_address', '');
      },
    }).open();
  };

  // ── 저장 ──
  const handleSave = async () => {
    if (!editForm) return;
    setSaveError('');
    if (!editForm.name.trim()) { setSaveError('이름을 입력해주세요.'); return; }

    setSaving(true);
    try {
      const address = [editForm.road_address, editForm.detail_address, editForm.zipcode]
        .filter(Boolean).join('||');

      await apiClient(`/api/v1/members/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name:            editForm.name.trim(),
          ...(editForm.gender         ? { gender:          editForm.gender }         : {}),
          ...(editForm.birth_date     ? { birth_date:      editForm.birth_date }     : {}),
          ...(editForm.phone          ? { phone:           editForm.phone }           : {}),
          ...(editForm.email          ? { email:           editForm.email }           : {}),
          ...(address                 ? { address }                                  : {}),
          ...(editForm.registered_date ? { registered_date: editForm.registered_date } : {}),
          ...(editForm.baptism_date   ? { baptism_date:    editForm.baptism_date }   : {}),
          status:          editForm.status || 'active',
        }),
      });
      setEditMode(false);
      setEditForm(null);
      await loadMember();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // ── 삭제 ──
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient(`/api/v1/members/${memberId}`, { method: 'DELETE' });
      router.replace('/members');
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 중 오류가 발생했습니다.');
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  // ── 주소 파싱 ──
  const parseAddress = (raw?: string) => {
    if (!raw) return { road: '', detail: '', zip: '' };
    const parts = raw.split('||');
    return { road: parts[0] ?? '', detail: parts[1] ?? '', zip: parts[2] ?? '' };
  };

  const addr = member ? parseAddress(member.address) : { road: '', detail: '', zip: '' };
  const statusCfg = member ? (STATUS_MAP[member.status] ?? STATUS_MAP.active) : STATUS_MAP.active;

  const TAB_LIST: { key: 'info' | 'family' | 'offerings' | 'pastoral'; label: string; icon: React.ReactNode }[] = [
    {
      key: 'info', label: '기본 정보',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0112 0v2"/></svg>,
    },
    {
      key: 'family', label: '가족 관계',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    },
    {
      key: 'offerings', label: '헌금 내역',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    },
    {
      key: 'pastoral', label: '목양 노트',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/></svg>,
    },
  ];

  // ═══════════════════ RENDER ════════════════════════════
  return (
    <>
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
      <style>{`
        @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .mi-input:focus { border-color:#4f46e5 !important; box-shadow:0 0 0 3px rgba(79,70,229,0.12) !important; }
        .tab-btn { display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all 0.2s;white-space:nowrap; }
        .family-card { background:#f8fafc;border-radius:12px;padding:14px 18px;border:1px solid #e5e7eb;transition:all 0.15s; }
        .family-card:hover { border-color:#c7d2fe;background:#f5f7ff; }
        .offering-row { display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid #f1f5f9; }
        .offering-row:last-child { border-bottom:none; }
        .del-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:100;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s; }
      `}</style>

      <div style={{ padding: '36px 40px', maxWidth: '900px' }}>

        {/* ── 헤더 ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => router.push('/members')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#f1f5f9', border: '1.5px solid #e5e7eb',
                cursor: 'pointer', color: '#374151', flexShrink: 0, transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#e0e7ff'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div>
              {loading ? (
                <><Skeleton w="160px" h="28px" /><div style={{ marginTop: '8px' }}><Skeleton w="80px" h="14px" /></div></>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', letterSpacing: '-0.04em', margin: 0 }}>
                      {member?.name ?? '—'}
                    </h1>
                    {member && (
                      <span style={{
                        fontSize: '12px', fontWeight: 700, padding: '4px 12px',
                        borderRadius: '99px', color: statusCfg.color,
                        background: statusCfg.bg, border: `1px solid ${statusCfg.border}`,
                      }}>
                        {statusCfg.label}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>
                    {member?.gender ? GENDER_MAP[member.gender] : ''}{member?.gender && member?.birth_date ? ' · ' : ''}{member?.birth_date ? formatDateKR(member.birth_date) : '생년월일 미입력'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* 버튼 영역 */}
          {!editMode && !loading && member && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirm(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '10px 16px', borderRadius: '11px',
                  border: '1.5px solid #fecaca', background: '#fff',
                  color: '#dc2626', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#fef2f2'; b.style.borderColor = '#dc2626'; }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#fff'; b.style.borderColor = '#fecaca'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                삭제
              </button>
              <button
                onClick={startEdit}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '10px 18px', borderRadius: '11px',
                  background: 'linear-gradient(135deg,#4f46e5,#6366f1)',
                  border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(79,70,229,0.3)', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                편집
              </button>
            </div>
          )}
        </div>

        {/* ── 에러 ── */}
        {error && (
          <div style={{ padding: '14px 18px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* ── 탭 네비게이션 ── */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', background: '#f1f5f9', padding: '5px', borderRadius: '13px', width: 'fit-content' }}>
          {TAB_LIST.map(t => (
            <button
              key={t.key}
              className="tab-btn"
              onClick={() => { if (!editMode) setTab(t.key); }}
              style={{
                background: tab === t.key ? '#fff' : 'transparent',
                color: tab === t.key ? '#4f46e5' : '#6b7280',
                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                opacity: editMode && tab !== t.key ? 0.4 : 1,
                cursor: editMode && tab !== t.key ? 'not-allowed' : 'pointer',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════ 탭 콘텐츠 ════════ */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', animation: 'fadeIn 0.25s' }}>

          {/* ── 1. 기본 정보 탭 ── */}
          {tab === 'info' && (
            editMode && editForm ? (
              /* ── 편집 폼 ── */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: '4px', height: '18px', background: 'linear-gradient(#4f46e5,#6366f1)', borderRadius: '99px' }} />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>정보 편집</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>

                  {/* 이름 */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelSt}>이름 <span style={{ color: '#ef4444' }}>*</span></label>
                    <input className="mi-input" value={editForm.name} onChange={e => updateField('name', e.target.value)} placeholder="이름" style={inputSt} />
                  </div>

                  {/* 성별 */}
                  <div>
                    <label style={labelSt}>성별</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(['M', 'F'] as const).map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => updateField('gender', g)}
                          style={{
                            flex: 1, padding: '10px', borderRadius: '9px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: '2px solid', transition: 'all 0.15s',
                            borderColor: editForm.gender === g ? '#6366f1' : '#e5e7eb',
                            background:  editForm.gender === g ? 'linear-gradient(135deg,#eef2ff,#e0e7ff)' : '#f8fafc',
                            color:       editForm.gender === g ? '#3730a3' : '#6b7280',
                          }}
                        >{g === 'M' ? '남성' : '여성'}</button>
                      ))}
                    </div>
                  </div>

                  {/* 생년월일 */}
                  <div>
                    <label style={labelSt}>생년월일</label>
                    <input className="mi-input" type="date" value={editForm.birth_date} onChange={e => updateField('birth_date', e.target.value)} style={inputSt} />
                  </div>

                  {/* 전화번호 */}
                  <div>
                    <label style={labelSt}>전화번호</label>
                    <input className="mi-input" type="tel" value={editForm.phone} onChange={e => updateField('phone', e.target.value)} placeholder="010-0000-0000" style={inputSt} />
                  </div>

                  {/* 이메일 */}
                  <div>
                    <label style={labelSt}>이메일</label>
                    <input className="mi-input" type="email" value={editForm.email} onChange={e => updateField('email', e.target.value)} placeholder="example@email.com" style={inputSt} />
                  </div>

                  {/* 등록일 */}
                  <div>
                    <label style={labelSt}>등록일</label>
                    <input className="mi-input" type="date" value={editForm.registered_date} onChange={e => updateField('registered_date', e.target.value)} style={inputSt} />
                  </div>

                  {/* 세례일 */}
                  <div>
                    <label style={labelSt}>세례일</label>
                    <input className="mi-input" type="date" value={editForm.baptism_date} onChange={e => updateField('baptism_date', e.target.value)} style={inputSt} />
                  </div>

                  {/* 상태 */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelSt}>상태</label>
                    <select className="mi-input" value={editForm.status} onChange={e => updateField('status', e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                      <option value="active">활동중</option>
                      <option value="inactive">휴면</option>
                      <option value="completed">수료</option>
                      <option value="withdrawn">탈퇴</option>
                    </select>
                  </div>

                  {/* 주소 검색 */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelSt}>주소</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        className="mi-input"
                        readOnly
                        value={editForm.zipcode}
                        placeholder="우편번호"
                        style={{ ...inputSt, width: '120px', background: '#f8fafc', cursor: 'default' }}
                      />
                      <button
                        type="button"
                        onClick={openPostcode}
                        style={{
                          padding: '10px 16px', borderRadius: '9px', fontSize: '13px', fontWeight: 600,
                          background: '#4f46e5', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                          whiteSpace: 'nowrap', transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
                      >주소 검색</button>
                    </div>
                    <input
                      className="mi-input"
                      readOnly
                      value={editForm.road_address}
                      placeholder="기본주소 (주소 검색 후 자동 입력)"
                      style={{ ...inputSt, background: '#f8fafc', cursor: 'default', marginBottom: '8px' }}
                    />
                    <input
                      className="mi-input"
                      value={editForm.detail_address}
                      onChange={e => updateField('detail_address', e.target.value)}
                      placeholder="상세주소 입력 (동, 호수 등)"
                      style={inputSt}
                    />
                  </div>
                </div>

                {/* 저장 에러 */}
                {saveError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', fontWeight: 500, marginTop: '18px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {saveError}
                  </div>
                )}

                {/* 저장/취소 */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    onClick={() => { setEditMode(false); setEditForm(null); setSaveError(''); }}
                    disabled={saving}
                    style={{ padding: '11px 18px', borderRadius: '11px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.5 : 1 }}
                  >취소</button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '7px',
                      padding: '11px 22px', borderRadius: '11px',
                      background: saving ? '#c7d2fe' : 'linear-gradient(135deg,#4f46e5,#6366f1)',
                      border: 'none', color: saving ? '#818cf8' : '#fff',
                      fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 4px 12px rgba(79,70,229,0.3)',
                    }}
                  >
                    {saving ? (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>저장 중...</>
                    ) : (
                      <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>저장</>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* ── 정보 보기 ── */
              <div>
                {loading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i}><Skeleton w="70px" h="10px" /><div style={{ marginTop: '8px' }}><Skeleton h="18px" /></div></div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 40px', marginBottom: '28px' }}>
                      <InfoRow label="성별"    value={member?.gender ? GENDER_MAP[member.gender] : undefined} />
                      <InfoRow label="생년월일" value={member?.birth_date ? formatDateKR(member.birth_date) : undefined} />
                      <InfoRow label="전화번호" value={member?.phone} />
                      <InfoRow label="이메일"  value={member?.email} />
                      <InfoRow label="등록일"  value={member?.registered_date ? formatDateKR(member.registered_date) : undefined} />
                      <InfoRow label="세례일"  value={member?.baptism_date ? formatDateKR(member.baptism_date) : undefined} />
                    </div>
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                      <div style={labelSt}>주소</div>
                      {addr.road ? (
                        <div>
                          {addr.zip && <span style={{ fontSize: '12px', background: '#f3f4f6', padding: '2px 8px', borderRadius: '6px', color: '#6b7280', marginRight: '8px' }}>{addr.zip}</span>}
                          <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{addr.road}</span>
                          {addr.detail && <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}> {addr.detail}</span>}
                        </div>
                      ) : (
                        <div style={{ fontSize: '14px', color: '#d1d5db' }}>—</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          )}

          {/* ── 2. 가족 관계 탭 ── */}
          {tab === 'family' && (
            <div style={{ animation: 'fadeIn 0.2s' }}>
              {familyLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1,2,3].map(i => <Skeleton key={i} h="60px" />)}
                </div>
              ) : family.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 12px' }}>
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>등록된 가족이 없습니다</div>
                  <div style={{ fontSize: '13px' }}>가족 관계는 백엔드에서 연결됩니다</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {family.map(f => (
                    <div key={f.id} className="family-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#eef2ff,#c7d2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0112 0v2"/></svg>
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{f.name}</span>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: '99px' }}>{f.relation}</span>
                            </div>
                            {f.phone && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{f.phone}</div>}
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/members/${f.id}`)}
                          style={{ fontSize: '12px', color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                        >상세 →</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 3. 헌금 내역 탭 ── */}
          {tab === 'offerings' && (
            <div style={{ animation: 'fadeIn 0.2s' }}>
              {/* 헌금 합계 */}
              {!offeringsLoading && offerings.length > 0 && (
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {[
                    {
                      label: '총 헌금',
                      value: formatKRW(offerings.filter(o => o.status === 'confirmed').reduce((s, o) => s + o.amount, 0)),
                      gradient: 'linear-gradient(135deg,#eef2ff,#c7d2fe)', color: '#3730a3',
                    },
                    {
                      label: '헌금 건수',
                      value: `${offeringsTotal}건`,
                      gradient: 'linear-gradient(135deg,#f0fdf4,#bbf7d0)', color: '#166534',
                    },
                  ].map(c => (
                    <div key={c.label} style={{ flex: 1, background: c.gradient, borderRadius: '12px', padding: '14px 18px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>{c.label}</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: c.color }}>{c.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {offeringsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h="48px" />)}
                </div>
              ) : offerings.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 12px' }}>
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>헌금 내역이 없습니다</div>
                </div>
              ) : (
                <div>
                  {offerings.map(o => {
                    const oSt = OFFERING_STATUS_MAP[o.status as keyof typeof OFFERING_STATUS_MAP] ?? OFFERING_STATUS_MAP.draft;
                    return (
                      <div key={o.id} className="offering-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                                {o.offering_date ? formatDateKR(o.offering_date) : '—'}
                              </span>
                              {o.offering_type_name && (
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: '99px' }}>{o.offering_type_name}</span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                              {o.payment_method ? PAYMENT_MAP[o.payment_method] ?? o.payment_method : ''}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '99px', color: oSt.color, background: oSt.bg }}>{oSt.label}</span>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: '#1e40af', letterSpacing: '-0.02em' }}>{formatKRW(o.amount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── 4. 목양 노트 탭 ── */}
          {tab === 'pastoral' && (
            <div style={{ animation: 'fadeIn 0.2s' }}>
              {/* 노트 작성 버튼 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button onClick={() => { setShowNoteForm(true); setEditingNote(null); setNoteForm({ category: 'general', content: '', is_private: true, visited_at: '' }); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(79,70,229,0.3)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  노트 작성
                </button>
              </div>

              {/* 노트 작성 폼 (인라인) */}
              {showNoteForm && (
                <div style={{ background: '#f8faff', borderRadius: '12px', padding: '18px', border: '1.5px solid #c7d2fe', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#4f46e5', marginBottom: '12px' }}>{editingNote ? '노트 수정' : '새 노트 작성'}</div>
                  {/* 카테고리 */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    {(Object.entries(NOTE_CAT) as [NoteCategory, typeof NOTE_CAT[NoteCategory]][]).map(([k, v]) => (
                      <button key={k} onClick={() => setNoteForm(p => ({ ...p, category: k }))}
                        style={{ padding: '5px 12px', borderRadius: '16px', border: `1.5px solid ${noteForm.category === k ? v.border : '#e5e7eb'}`, background: noteForm.category === k ? v.bg : '#fff', color: noteForm.category === k ? v.color : '#6b7280', fontSize: '12px', fontWeight: noteForm.category === k ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.13s' }}>
                        {v.icon} {v.label}
                      </button>
                    ))}
                  </div>
                  {/* 심방일 */}
                  {noteForm.category === 'visit' && (
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', display: 'block', marginBottom: '4px' }}>심방일</label>
                      <input type="date" value={noteForm.visited_at}
                        onChange={e => setNoteForm(p => ({ ...p, visited_at: e.target.value }))}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', fontFamily: 'inherit', width: '160px' }} />
                    </div>
                  )}
                  {/* 내용 */}
                  <textarea value={noteForm.content} onChange={e => setNoteForm(p => ({ ...p, content: e.target.value }))}
                    placeholder="노트 내용을 입력하세요..."
                    style={{ width: '100%', minHeight: '90px', padding: '10px 12px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '13px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#111827' }} />
                  {/* 비공개 토글 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <div onClick={() => setNoteForm(p => ({ ...p, is_private: !p.is_private }))}
                      style={{ width: '36px', height: '20px', borderRadius: '10px', background: noteForm.is_private ? '#4f46e5' : '#d1d5db', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                      <div style={{ position: 'absolute', top: '2px', left: noteForm.is_private ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>{noteForm.is_private ? '🔒 비공개' : '🌐 공개'}</span>
                  </div>
                  {/* 버튼 */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                    <button onClick={() => { setShowNoteForm(false); setEditingNote(null); }}
                      style={{ padding: '7px 14px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
                    <button onClick={saveNote} disabled={noteSaving || !noteForm.content.trim()}
                      style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: noteSaving ? '#c7d2fe' : '#4f46e5', color: noteSaving ? '#818cf8' : '#fff', fontSize: '12px', fontWeight: 700, cursor: noteSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                      {noteSaving ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              )}

              {/* 노트 타임라인 */}
              {notesLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '13px' }}>불러오는 중...</div>
              ) : notes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>목양 노트가 없습니다</div>
                  <div style={{ fontSize: '12px' }}>위 버튼으로 첫 노트를 작성해보세요</div>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '13px', top: '8px', bottom: '8px', width: '2px', background: '#f1f5f9' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {notes.map((note, i) => {
                      const cfg = NOTE_CAT[note.category] ?? NOTE_CAT.general;
                      return (
                        <div key={note.id} style={{ display: 'flex', gap: '12px', paddingBottom: i < notes.length - 1 ? '14px' : '0', position: 'relative' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: cfg.bg, border: `2px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0, zIndex: 1 }}>{cfg.icon}</div>
                          <div style={{ flex: 1, background: '#f9fafb', borderRadius: '10px', padding: '10px 14px', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px', flexWrap: 'wrap', gap: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: '10px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: '11px', fontWeight: 700 }}>{cfg.label}</span>
                                {note.is_private && <span style={{ fontSize: '10px', color: '#9ca3af' }}>🔒 비공개</span>}
                                {note.visited_at && <span style={{ fontSize: '11px', color: '#9ca3af' }}>심방일: {note.visited_at}</span>}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '11px', color: '#d1d5db' }}>{note.created_at ? new Date(note.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : ''}</span>
                                <button onClick={(e) => { e.stopPropagation(); setEditingNote(note); setNoteForm({ category: note.category, content: note.content, is_private: note.is_private, visited_at: note.visited_at ?? '' }); setShowNoteForm(true); }}
                                  style={{ padding: '2px 7px', fontSize: '11px', color: '#6b7280', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '5px', cursor: 'pointer', fontFamily: 'inherit' }}>수정</button>
                                <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                  style={{ padding: '2px 7px', fontSize: '11px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '5px', cursor: 'pointer', fontFamily: 'inherit' }}>삭제</button>
                              </div>
                            </div>
                            <div style={{ fontSize: '13px', color: note.is_private ? '#9ca3af' : '#374151', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                              {note.is_private ? '🔒 비공개 노트입니다' : note.content}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── 삭제 확인 모달 ── */}
      {deleteConfirm && (
        <div className="del-overlay" onClick={() => !deleting && setDeleteConfirm(false)}>
          <div
            style={{
              background: '#fff', borderRadius: '20px', padding: '32px', width: '380px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'fadeIn 0.2s',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>교인 삭제</div>
              <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
                <strong style={{ color: '#111827' }}>{member?.name}</strong> 교인을 삭제하시겠습니까?<br />
                이 작업은 되돌릴 수 없습니다.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                style={{ flex: 1, padding: '12px', borderRadius: '11px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: deleting ? 0.5 : 1 }}
              >취소</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  padding: '12px', borderRadius: '11px', border: 'none',
                  background: deleting ? '#fca5a5' : 'linear-gradient(135deg,#dc2626,#ef4444)',
                  color: '#fff', fontSize: '14px', fontWeight: 700,
                  cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  boxShadow: deleting ? 'none' : '0 4px 12px rgba(220,38,38,0.35)',
                }}
              >
                {deleting ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>삭제 중...</>
                ) : '삭제 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { apiClient, formatCurrency } from '@/lib/api';
import { useTranslation, useLangRouter } from '@/lib/i18n';

// ─── 타입 ──────────────────────────────────────────────
interface LookupItem {
  id: number;
  code: string;
  name: string;
}

interface Member {
  id: number;
  name: string;
  phone?: string | null;
}

interface MembersResponse {
  items: Member[];
  total: number;
}

interface OfferingItem {
  id: string;           // 클라이언트 전용 key
  member_id?: number;
  member_name: string;  // 교인 검색 or 직접 입력
  amount: string;       // 입력 편의상 string
  payment_method: 'cash' | 'transfer' | 'card' | '';
  notes: string;
  // UI 상태
  searchQuery: string;
  searchResults: Member[];
  searchLoading: boolean;
  showDropdown: boolean;
  isManual: boolean;    // 직접 입력 모드
}

interface OfferingPayload {
  offering_date: string;
  offering_type_code: string;
  worship_type_code: string;
  status: 'draft' | 'confirmed';
  items: {
    member_id?: number;
    member_name: string;
    amount: number;
    payment_method: string;
    notes?: string;
  }[];
}

// ─── 유틸 ──────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

const newItem = (): OfferingItem => ({
  id: uid(),
  member_name: '',
  amount: '',
  payment_method: '',
  notes: '',
  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  showDropdown: false,
  isManual: false,
});

const PAYMENT_OPTIONS = [
  { value: 'cash',     label: '현금' },
  { value: 'transfer', label: '계좌이체' },
  { value: 'card',     label: '카드' },
];

// ─── 스타일 상수 ────────────────────────────────────────
const inputSt: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: '9px',
  border: '1.5px solid #e5e7eb', fontSize: '14px', color: '#1a1a1a',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  background: '#fff', transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelSt: React.CSSProperties = {
  fontSize: '12px', fontWeight: 700, color: '#6b7280',
  letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '6px',
  display: 'block',
};

// ─── 메인 컴포넌트 ──────────────────────────────────────
export default function OfferingNewPage() {
  const router = useLangRouter();
  const { t } = useTranslation();
  const paymentOptions = [
    { value: 'cash', label: t.offerings.paymentCash },
    { value: 'transfer', label: t.offerings.paymentTransfer },
    { value: 'card', label: t.offerings.paymentCard },
  ];

  // 헌금/예배 종류 (API 동적 로딩)
  const [offeringTypes, setOfferingTypes] = useState<LookupItem[]>([]);
  const [worshipTypes,  setWorshipTypes]  = useState<LookupItem[]>([]);
  const [lookupsReady,  setLookupsReady]  = useState(false);

  // 폼 헤더 값
  const [offeringDate, setOfferingDate]       = useState(new Date().toISOString().slice(0, 10));
  const [offeringTypeCode, setOfferingTypeCode] = useState('');
  const [worshipTypeCode,  setWorshipTypeCode]  = useState('');

  // 헌금 항목 목록
  const [items, setItems] = useState<OfferingItem[]>([newItem()]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  // 교인 검색 디바운스 타이머 (항목별)
  const searchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ─── 룩업 API 로드 ────────────────────────────────────
  useEffect(() => {
    Promise.allSettled([
      apiClient<LookupItem[]>('/api/v1/lookup/offering_type'),
      apiClient<LookupItem[]>('/api/v1/lookup/worship_type'),
    ]).then(([ot, wt]) => {
      const otList = ot.status === 'fulfilled' ? ot.value : [];
      const wtList = wt.status === 'fulfilled' ? wt.value : [];
      setOfferingTypes(otList);
      setWorshipTypes(wtList);
      if (otList.length) setOfferingTypeCode(otList[0].code);
      if (wtList.length) setWorshipTypeCode(wtList[0].code);
      setLookupsReady(true);
    });
  }, []);

  // ─── 교인 검색 (항목별) ───────────────────────────────
  const searchMembers = useCallback((itemId: string, query: string) => {
    if (searchTimers.current[itemId]) clearTimeout(searchTimers.current[itemId]);
    if (!query.trim()) {
      setItems(prev => prev.map(it =>
        it.id === itemId ? { ...it, searchResults: [], showDropdown: false } : it
      ));
      return;
    }
    searchTimers.current[itemId] = setTimeout(async () => {
      setItems(prev => prev.map(it =>
        it.id === itemId ? { ...it, searchLoading: true } : it
      ));
      try {
        const data = await apiClient<MembersResponse>(
          `/api/v1/members?search=${encodeURIComponent(query)}&size=8`
        );
        setItems(prev => prev.map(it =>
          it.id === itemId
            ? { ...it, searchResults: data.items ?? [], showDropdown: true, searchLoading: false }
            : it
        ));
      } catch {
        setItems(prev => prev.map(it =>
          it.id === itemId ? { ...it, searchLoading: false } : it
        ));
      }
    }, 300);
  }, []);

  // ─── 항목 업데이트 헬퍼 ────────────────────────────────
  const updateItem = (itemId: string, patch: Partial<OfferingItem>) => {
    setItems(prev => prev.map(it => it.id === itemId ? { ...it, ...patch } : it));
  };

  // 교인 선택
  const selectMember = (itemId: string, member: Member) => {
    updateItem(itemId, {
      member_id: member.id,
      member_name: member.name,
      searchQuery: member.name,
      showDropdown: false,
      isManual: false,
    });
  };

  // 직접 입력 모드 전환
  const switchManual = (itemId: string) => {
    setItems(prev => prev.map(it =>
      it.id === itemId
        ? { ...it, isManual: true, member_id: undefined, showDropdown: false, searchQuery: '', member_name: '' }
        : it
    ));
  };

  // ── 합계 계산 ───────────────────────────────────────────
  const total = items.reduce((sum, it) => {
    const n = parseInt(it.amount.replace(/,/g, ''), 10);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  // 금액 입력 자동 콤마
  const handleAmountChange = (itemId: string, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const formatted = digits ? Number(digits).toLocaleString('ko-KR') : '';
    updateItem(itemId, { amount: formatted });
  };

  // ─── 저장 공통 ─────────────────────────────────────────
  const handleSave = async (status: 'draft' | 'confirmed') => {
    setError('');
    // 검증: 항목이 하나라도 완성돼야 함
    const validItems = items.filter(it => {
      const name = it.isManual ? it.member_name.trim() : it.searchQuery.trim();
      const amt = parseInt(it.amount.replace(/,/g, ''), 10);
      return name && !isNaN(amt) && amt > 0;
    });
    if (validItems.length === 0) {
      setError(t.offerings.minOneItem);
      return;
    }
    if (!offeringTypeCode) { setError(t.offerings.selectOfferingType); return; }

    setSubmitting(true);
    try {
      const payload: OfferingPayload = {
        offering_date: offeringDate,
        offering_type_code: offeringTypeCode,
        worship_type_code: worshipTypeCode,
        status,
        items: validItems.map(it => ({
          ...(it.member_id ? { member_id: it.member_id } : {}),
          member_name: it.isManual ? it.member_name.trim() : it.searchQuery.trim(),
          amount: parseInt(it.amount.replace(/,/g, ''), 10),
          payment_method: it.payment_method || 'cash',
          ...(it.notes.trim() ? { notes: it.notes.trim() } : {}),
        })),
      };
      const created = await apiClient<{ id: number }>('/api/v1/offerings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      router.replace(`/offerings/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── 렌더 ───────────────────────────────────────────────
  return (
    <>
      <style>{`
        .fo-input:focus { border-color: #c9a84c !important; box-shadow: 0 0 0 3px rgba(201,168,76,0.12) !important; }
        @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
        .member-drop-item { padding: 9px 14px; cursor: pointer; font-size: 13px; color: #374151; display: flex; align-items: center; gap: 8px; transition: background 0.1s; }
        .member-drop-item:hover { background: #f0f0ff; }
        .item-card { background: #fff; border-radius: 14px; border: 1.5px solid #e5e7eb; padding: 20px; margin-bottom: 12px; transition: border-color 0.2s, box-shadow 0.2s; }
        .item-card:hover { border-color: #f0d88a; box-shadow: 0 2px 8px rgba(201,168,76,0.07); }
        .remove-btn { background: none; border: none; cursor: pointer; color: #d1d5db; transition: color 0.15s; padding: 4px; border-radius: 6px; display: flex; align-items: center; }
        .remove-btn:hover { color: #ef4444; background: #fef2f2; }
        .add-item-btn:hover { border-color: #c9a84c !important; color: #c9a84c !important; }
        .save-btn-draft:hover { background: #f1f5f9 !important; border-color: #c9a84c !important; color: #c9a84c !important; }
        .save-btn-confirm:hover { opacity: 0.88; transform: translateY(-1px); }
      `}</style>

      <div className="page-content" style={{ maxWidth: '860px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '30px' }}>
          <button
            onClick={() => router.push('/offerings')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '10px',
              background: '#f1f5f9', border: '1.5px solid #e5e7eb',
              cursor: 'pointer', color: '#374151', flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e0e7ff')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.04em', margin: '0 0 4px' }}>
              {t.offerings.newTitle}
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>
              {t.offerings.newSubtitle}
            </p>
          </div>
        </div>

        {/* 상단 정보 카드 */}
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '24px 28px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          border: '1px solid #f1f5f9', marginBottom: '20px',
        }}>
          <div className="r-grid-3" style={{ gap: '20px' }}>

            {/* 날짜 */}
            <div>
              <label style={labelSt}>{t.offerings.offeringDate}</label>
              <input
                className="fo-input"
                type="date"
                value={offeringDate}
                onChange={e => setOfferingDate(e.target.value)}
                style={inputSt}
              />
            </div>

            {/* 헌금 종류 */}
            <div>
              <label style={labelSt}>{t.offerings.offeringType}</label>
              {!lookupsReady ? (
                <div style={{ ...inputSt, background: '#f8fafc', color: '#9ca3af' }}>{t.common.loading}</div>
              ) : (
                <select
                  className="fo-input"
                  value={offeringTypeCode}
                  onChange={e => setOfferingTypeCode(e.target.value)}
                  style={{ ...inputSt, cursor: 'pointer' }}
                >
                  {offeringTypes.length === 0 && (
                    <option value="">{t.offerings.noItems}</option>
                  )}
                  {offeringTypes.map(t => (
                    <option key={t.code} value={t.code}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* 예배 종류 */}
            <div>
              <label style={labelSt}>{t.offerings.worshipType}</label>
              {!lookupsReady ? (
                <div style={{ ...inputSt, background: '#f8fafc', color: '#9ca3af' }}>{t.common.loading}</div>
              ) : (
                <select
                  className="fo-input"
                  value={worshipTypeCode}
                  onChange={e => setWorshipTypeCode(e.target.value)}
                  style={{ ...inputSt, cursor: 'pointer' }}
                >
                  {worshipTypes.length === 0 && (
                    <option value="">{t.offerings.noItems}</option>
                  )}
                  {worshipTypes.map(t => (
                    <option key={t.code} value={t.code}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>

          </div>
        </div>

        {/* 헌금 항목 */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e1e2e' }}>{t.offerings.offeringItems}</span>
              <span style={{ marginLeft: '10px', fontSize: '13px', color: '#9ca3af' }}>{items.length}건</span>
            </div>
            {/* 합계 */}
            <div style={{
              background: 'linear-gradient(135deg, #fdf8e8, #e0e7ff)',
              borderRadius: '10px', padding: '8px 16px',
              fontSize: '15px', fontWeight: 800, color: '#4338ca',
            }}>
              합계 {formatCurrency(total)}
            </div>
          </div>

          {items.map((item, idx) => (
            <div key={item.id} className="item-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#c9a84c', background: '#fdf8e8', padding: '3px 10px', borderRadius: '99px' }}>
                  #{idx + 1}
                </span>
                {items.length > 1 && (
                  <button
                    className="remove-btn"
                    type="button"
                    onClick={() => setItems(prev => prev.filter(it => it.id !== item.id))}
                    title="항목 삭제"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                )}
              </div>

              <div className="r-grid-2" style={{ gap: '14px' }}>

                {/* 교인 검색 / 직접 입력 */}
                <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={labelSt}>
                      {t.offerings.donor} {item.member_id && (
                        <span style={{ color: '#10b981', marginLeft: '6px', textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>{t.offerings.memberLinked}</span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => item.isManual ? updateItem(item.id, { isManual: false, member_name: '', searchQuery: '', member_id: undefined }) : switchManual(item.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '12px', color: '#c9a84c', fontWeight: 600, fontFamily: 'inherit',
                        padding: '2px 0',
                      }}
                    >
                      {item.isManual ? t.offerings.searchMember : t.offerings.directInput}
                    </button>
                  </div>

                  {item.isManual ? (
                    <input
                      className="fo-input"
                      type="text"
                      placeholder={t.offerings.manualPlaceholder}
                      value={item.member_name}
                      onChange={e => updateItem(item.id, { member_name: e.target.value })}
                      style={inputSt}
                    />
                  ) : (
                    <>
                      <div style={{ position: 'relative' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                        >
                          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                          className="fo-input"
                          type="text"
                          placeholder={t.offerings.searchPlaceholder}
                          value={item.searchQuery}
                          onChange={e => {
                            const v = e.target.value;
                            updateItem(item.id, { searchQuery: v, member_id: undefined, member_name: '' });
                            searchMembers(item.id, v);
                          }}
                          onFocus={() => item.searchResults.length > 0 && updateItem(item.id, { showDropdown: true })}
                          style={{ ...inputSt, paddingLeft: '36px' }}
                        />
                        {item.searchLoading && (
                          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#9ca3af' }}>{t.offerings.searching}</div>
                        )}
                      </div>

                      {/* 드롭다운 */}
                      {item.showDropdown && item.searchResults.length > 0 && (
                        <div style={{
                          position: 'absolute', left: 0, right: 0, top: '100%', marginTop: '4px',
                          background: '#fff', borderRadius: '10px', zIndex: 100,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb',
                          overflow: 'hidden',
                        }}>
                          {item.searchResults.map(m => (
                            <div
                              key={m.id}
                              className="member-drop-item"
                              onMouseDown={() => selectMember(item.id, m)}
                            >
                              <span style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #c9a84c, #c9a84c)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, color: '#fff', fontSize: '12px', fontWeight: 700,
                              }}>{m.name[0]}</span>
                              <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{m.name}</span>
                              {m.phone && <span style={{ color: '#9ca3af', marginLeft: 'auto', fontSize: '12px' }}>{m.phone}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {item.showDropdown && item.searchResults.length === 0 && !item.searchLoading && item.searchQuery && (
                        <div style={{
                          position: 'absolute', left: 0, right: 0, top: '100%', marginTop: '4px',
                          background: '#fff', borderRadius: '10px', zIndex: 100,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb',
                          padding: '12px 14px', fontSize: '13px', color: '#9ca3af',
                        }}>
                          <span>&#34;{item.searchQuery}&#34; 검색 결과 없음 —&nbsp;</span>
                          <button type="button" onClick={() => switchManual(item.id)} style={{ border: 'none', background: 'none', color: '#c9a84c', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '13px', padding: 0 }}>{t.offerings.directInput}</button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 금액 */}
                <div>
                  <label style={labelSt}>{t.offerings.amount}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="fo-input"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={item.amount}
                      onChange={e => handleAmountChange(item.id, e.target.value)}
                      style={{ ...inputSt, paddingRight: '28px' }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#9ca3af', pointerEvents: 'none' }}>{t.common.won}</span>
                  </div>
                </div>

                {/* 납부 방법 */}
                <div>
                  <label style={labelSt}>{t.offerings.paymentMethod}</label>
                  <select
                    className="fo-input"
                    value={item.payment_method}
                    onChange={e => updateItem(item.id, { payment_method: e.target.value as OfferingItem['payment_method'] })}
                    style={{ ...inputSt, cursor: 'pointer' }}
                  >
                    <option value="">{t.offerings.select}</option>
                    {paymentOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* 비고 */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelSt}>{t.offerings.notes}</label>
                  <input
                    className="fo-input"
                    type="text"
                    placeholder={t.offerings.notesPlaceholder}
                    value={item.notes}
                    onChange={e => updateItem(item.id, { notes: e.target.value })}
                    style={inputSt}
                  />
                </div>

              </div>
            </div>
          ))}

          {/* 항목 추가 버튼 */}
          <button
            type="button"
            className="add-item-btn"
            onClick={() => setItems(prev => [...prev, newItem()])}
            style={{
              width: '100%', padding: '13px', borderRadius: '12px',
              border: '1.5px dashed #d1d5db', background: '#fafbff',
              color: '#6b7280', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {t.offerings.addItem}
          </button>
        </div>

        {/* 에러 */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '14px 18px', borderRadius: '12px',
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#dc2626', fontSize: '13px', fontWeight: 500, marginBottom: '16px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* 버튼 그룹 */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => router.push('/offerings')}
            disabled={submitting}
            style={{
              padding: '12px 20px', borderRadius: '12px',
              border: '1.5px solid #e5e7eb', background: '#fff',
              color: '#374151', fontSize: '14px', fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: submitting ? 0.5 : 1,
              transition: 'all 0.15s',
            }}
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            className="save-btn-draft"
            onClick={() => handleSave('draft')}
            disabled={submitting}
            style={{
              padding: '12px 20px', borderRadius: '12px',
              border: '1.5px solid #e5e7eb', background: '#f8fafc',
              color: '#374151', fontSize: '14px', fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', opacity: submitting ? 0.5 : 1,
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '7px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
              <span>임시</span><span>저장</span>
            </span>
          </button>
          <button
            type="button"
            className="save-btn-confirm"
            onClick={() => handleSave('confirmed')}
            disabled={submitting}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 24px', borderRadius: '12px',
              background: submitting ? '#f0d88a' : 'linear-gradient(135deg, #c9a84c, #c9a84c)',
              border: 'none',
              color: submitting ? '#d4b85c' : '#fff',
              fontSize: '14px', fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              boxShadow: submitting ? 'none' : '0 4px 12px rgba(201,168,76,0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            {submitting ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                {t.common.saving}
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                  <span>헌금</span><span>확정</span>
                </span>
              </>
            )}
          </button>
        </div>

      </div>
    </>
  );
}

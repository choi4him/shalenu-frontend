'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useLangRouter } from '@/lib/i18n';
import { apiClient, formatCurrency, formatDateKR } from '@/lib/api';

// ─── 타입 ───────────────────────────────────────────────
interface OfferingItem {
  id: number;
  seq?: number;
  member_id?: number;
  member_name?: string;
  payer_name?: string;          // 비등록 헌금자
  amount: number;
  payment_method?: 'cash' | 'transfer' | 'card' | string;
  note?: string;
}

interface Offering {
  id: number;
  offering_date: string;
  offering_type?: string;
  offering_type_name?: string;
  worship_type?: string;
  worship_type_name?: string;
  status: 'draft' | 'confirmed';
  total_amount: number;
  item_count?: number;
  items: OfferingItem[];
  created_at?: string;
  confirmed_at?: string;
}

// ─── 상수 ───────────────────────────────────────────────
const PAYMENT_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  cash:     { label: '현금',     color: '#166534', bg: '#dcfce7', border: '#bbf7d0' },
  transfer: { label: '계좌이체', color: '#1e40af', bg: '#dbeafe', border: '#bfdbfe' },
  card:     { label: '카드',     color: '#6d28d9', bg: '#ede9fe', border: '#ddd6fe' },
};

const STATUS_MAP = {
  draft:     { label: '임시저장', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  confirmed: { label: '확정',     color: '#059669', bg: '#dcfce7', border: '#bbf7d0' },
};

// ─── 스켈레톤 ───────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[40, 120, 100, 80, 120].map((w, i) => (
        <td key={i} style={{ padding: '14px 18px' }}>
          <div style={{
            height: '14px', width: `${w}px`, maxWidth: '100%', borderRadius: '6px',
            background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
            backgroundSize: '300% 100%', animation: 'shimmer 1.5s infinite',
          }} />
        </td>
      ))}
    </tr>
  );
}

// ─── 메인 ───────────────────────────────────────────────
export default function OfferingDetailPage() {
  const router   = useLangRouter();
  const params   = useParams();
  const id       = params.id as string;

  const [offering,   setOffering]   = useState<Offering | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed,  setConfirmed]  = useState(false);  // 방금 확정됨 애니메이션

  // ── 로드 ──
  const loadOffering = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient<Offering>(`/api/v1/offerings/${id}`);
      setOffering(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '헌금 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadOffering(); }, [loadOffering]);

  // ── 확정 ──
  const handleConfirm = async () => {
    setConfirming(true);
    setError('');
    try {
      await apiClient(`/api/v1/offerings/${id}/confirm`, { method: 'PATCH' });
      setConfirmed(true);
      // 0.5초 뒤 상태 반영
      setTimeout(() => {
        setOffering(prev => prev ? { ...prev, status: 'confirmed' } : prev);
        setConfirmed(false);
      }, 600);
    } catch (e) {
      setError(e instanceof Error ? e.message : '확정 처리 중 오류가 발생했습니다.');
    } finally {
      setConfirming(false);
    }
  };

  const statusCfg = offering
    ? (STATUS_MAP[offering.status] ?? STATUS_MAP.draft)
    : STATUS_MAP.draft;

  const items   = offering?.items ?? [];
  const isDraft = offering?.status === 'draft';

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes pop     { 0%{transform:scale(1)} 50%{transform:scale(1.06)} 100%{transform:scale(1)} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .item-row { border-bottom:1px solid #f1f5f9; transition:background 0.15s; }
        .item-row:last-child { border-bottom:none; }
        .item-row:hover { background:#fafbff; }
        .member-link { color:#c9a84c;font-weight:600;cursor:pointer;text-decoration:none;border-bottom:1px solid transparent;transition:border-color 0.15s; }
        .member-link:hover { border-bottom-color:#c9a84c; }
      `}</style>

      <div className="page-content" style={{ maxWidth: '920px' }}>

        {/* ── 헤더 ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => router.push('/offerings')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#f1f5f9', border: '1.5px solid #e5e7eb',
                cursor: 'pointer', color: '#374151', flexShrink: 0, transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#e0e7ff'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            <div>
              {loading ? (
                <>
                  <div style={{ height: '26px', width: '200px', borderRadius: '8px', background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '300% 100%', animation: 'shimmer 1.5s infinite', marginBottom: '8px' }} />
                  <div style={{ height: '14px', width: '120px', borderRadius: '6px', background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '300% 100%', animation: 'shimmer 1.5s infinite' }} />
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.04em', margin: 0 }}>
                      {offering?.offering_type_name ?? offering?.offering_type ?? '헌금'}
                    </h1>
                    {offering && (
                      <span style={{
                        fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '99px',
                        color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}`,
                        animation: confirmed ? 'pop 0.4s ease' : 'none',
                      }}>
                        {statusCfg.label}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>
                    {offering?.offering_date ? formatDateKR(offering.offering_date) : '—'}
                    {offering?.worship_type_name ? ` · ${offering.worship_type_name}` : offering?.worship_type ? ` · ${offering.worship_type}` : ''}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* 목록으로 버튼 */}
          <button
            onClick={() => router.push('/offerings')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px', borderRadius: '11px',
              border: '1.5px solid #e5e7eb', background: '#fff',
              color: '#374151', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#c9a84c'; b.style.color = '#c9a84c'; }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#e5e7eb'; b.style.color = '#374151'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            목록으로
          </button>
        </div>

        {/* ── 에러 ── */}
        {error && (
          <div style={{ padding: '14px 18px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* ── 총합 카드 ── */}
        <div style={{
          background: 'linear-gradient(135deg,#c9a84c 0%,#c9a84c 50%,#d4b85c 100%)',
          borderRadius: '20px', padding: '28px 32px', marginBottom: '20px',
          boxShadow: '0 8px 32px rgba(201,168,76,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
          animation: 'fadeIn 0.3s',
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              총 헌금 합계
            </div>
            {loading ? (
              <div style={{ height: '44px', width: '200px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', animation: 'shimmer 1.5s infinite' }} />
            ) : (
              <div style={{ fontSize: '38px', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {offering ? formatCurrency(offering.total_amount) : '—'}
              </div>
            )}
            <div style={{ marginTop: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
              {loading ? '' : `${items.length}개 항목`}
            </div>
          </div>

          {/* 우측 메타 정보 */}
          {!loading && offering && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
              {[
                { label: '헌금 종류', value: offering.offering_type_name ?? offering.offering_type ?? '—' },
                { label: '예배 종류', value: offering.worship_type_name  ?? offering.worship_type  ?? '—' },
                { label: '날짜',     value: formatDateKR(offering.offering_date) },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{row.label}</span>
                  <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700, background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '7px' }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 항목 테이블 ── */}
        <div style={{
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: '20px',
          animation: 'fadeIn 0.3s 0.1s both',
        }}>
          <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '4px', height: '18px', background: 'linear-gradient(#c9a84c,#c9a84c)', borderRadius: '99px' }} />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>헌금 항목</span>
            {!loading && <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500, marginLeft: '4px' }}>{items.length}건</span>}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table-mobile" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '540px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', '헌금자', '금액', '납부 방법', '비고'].map(h => (
                    <th key={h} style={{
                      padding: '12px 18px', textAlign: 'left',
                      fontSize: '11px', fontWeight: 700, color: '#6b7280',
                      letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                  : items.length === 0
                    ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: '#9ca3af' }}>
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 10px' }}>
                            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                          </svg>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>항목이 없습니다</div>
                        </td>
                      </tr>
                    )
                    : items.map((item, idx) => {
                      const pmCfg = item.payment_method ? (PAYMENT_MAP[item.payment_method] ?? null) : null;
                      const displayName = item.member_name ?? item.payer_name ?? '—';
                      const isMember   = !!item.member_id;

                      return (
                        <tr key={item.id} className="item-row">
                          {/* 순번 */}
                          <td data-label="#" style={{ padding: '14px 18px' }}>
                            <div style={{
                              width: '26px', height: '26px', borderRadius: '8px',
                              background: 'linear-gradient(135deg,#fdf8e8,#f0d88a)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', fontWeight: 800, color: '#c9a84c',
                            }}>
                              {item.seq ?? idx + 1}
                            </div>
                          </td>

                          {/* 헌금자 */}
                          <td data-label="헌금자" style={{ padding: '14px 18px' }}>
                            {isMember ? (
                              <button
                                className="member-link"
                                onClick={() => router.push(`/members/${item.member_id}`)}
                                style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', fontSize: '14px' }}
                              >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                  {displayName}
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                                  </svg>
                                </span>
                              </button>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>{displayName}</span>
                                <span style={{ fontSize: '11px', color: '#9ca3af', background: '#f3f4f6', padding: '1px 6px', borderRadius: '5px', fontWeight: 500 }}>비등록</span>
                              </div>
                            )}
                          </td>

                          {/* 금액 */}
                          <td data-label="금액" style={{ padding: '14px 18px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#1e40af', letterSpacing: '-0.02em' }}>
                              {formatCurrency(item.amount)}
                            </span>
                          </td>

                          {/* 납부 방법 */}
                          <td data-label="납부 방법" style={{ padding: '14px 18px' }}>
                            {pmCfg ? (
                              <span style={{
                                display: 'inline-block', fontSize: '12px', fontWeight: 700,
                                padding: '4px 10px', borderRadius: '8px',
                                color: pmCfg.color, background: pmCfg.bg, border: `1px solid ${pmCfg.border}`,
                              }}>
                                {pmCfg.label}
                              </span>
                            ) : (
                              <span style={{ fontSize: '13px', color: '#9ca3af' }}>—</span>
                            )}
                          </td>

                          {/* 비고 */}
                          <td data-label="비고" style={{ padding: '14px 18px', fontSize: '13px', color: '#6b7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.note || '—'}
                          </td>
                        </tr>
                      );
                    })
                }
              </tbody>

              {/* 합계 행 */}
              {!loading && items.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'linear-gradient(135deg,#f5f7ff,#fdf8e8)', borderTop: '2px solid #e0e7ff' }}>
                    <td colSpan={2} style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: '#4b5563' }}>
                      합계 ({items.length}건)
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontSize: '17px', fontWeight: 900, color: '#7d6324', letterSpacing: '-0.03em' }}>
                        {formatCurrency(items.reduce((s, i) => s + i.amount, 0))}
                      </span>
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ── 납부 방법 범례 ── */}
        {!loading && items.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {Object.values(PAYMENT_MAP).map(p => (
              <div key={p.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6b7280' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '3px', background: p.bg, border: `1.5px solid ${p.border}` }} />
                <span style={{ color: p.color, fontWeight: 600 }}>{p.label}</span>
                <span>: {items.filter(i => i.payment_method === Object.keys(PAYMENT_MAP).find(k => PAYMENT_MAP[k] === p)).length}건</span>
              </div>
            ))}
          </div>
        )}

        {/* ── 하단 액션 버튼 ── */}
        {!loading && offering && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', background: '#fff', borderRadius: '14px',
            border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            flexWrap: 'wrap', gap: '12px',
            animation: 'fadeIn 0.3s 0.15s both',
          }}>

            {/* 상태 정보 텍스트 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isDraft ? (
                <>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 0 3px #fef3c7' }} />
                  <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>임시저장 상태입니다. 헌금을 확정하면 재정에 반영됩니다.</span>
                </>
              ) : (
                <>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 3px #d1fae5' }} />
                  <span style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>
                    확정 완료 {offering.confirmed_at ? `· ${formatDateKR(offering.confirmed_at.slice(0, 10))}` : ''}
                  </span>
                </>
              )}
            </div>

            {/* 버튼 영역 */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => router.push('/offerings')}
                style={{
                  padding: '11px 18px', borderRadius: '11px',
                  border: '1.5px solid #e5e7eb', background: '#fff',
                  color: '#374151', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#c9a84c'; b.style.color = '#c9a84c'; }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#e5e7eb'; b.style.color = '#374151'; }}
              >
                목록으로
              </button>

              {isDraft ? (
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                    padding: '11px 22px', borderRadius: '11px',
                    background: confirming ? '#bbf7d0' : 'linear-gradient(135deg,#059669,#10b981)',
                    border: 'none',
                    color: confirming ? '#059669' : '#fff',
                    fontSize: '13px', fontWeight: 700,
                    cursor: confirming ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: confirming ? 'none' : '0 4px 14px rgba(5,150,105,0.35)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!confirming) { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}
                >
                  {confirming ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      확정 처리 중...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      헌금 확정
                    </>
                  )}
                </button>
              ) : (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  padding: '11px 22px', borderRadius: '11px',
                  background: '#dcfce7', color: '#059669',
                  fontSize: '13px', fontWeight: 700,
                  border: '1.5px solid #bbf7d0',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  확정 완료
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
}

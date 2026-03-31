'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';

// ─── 타입 ──────────────────────────────────────────────────
// 백엔드 BookingResponse 필드명 그대로 사용
interface Booking {
  id:              string;
  facility_id:     string;
  facility_name?:  string;
  title:           string;
  booked_by:       string;
  booked_by_name?: string;
  start_time:      string; // ISO 8601 datetime
  end_time:        string; // ISO 8601 datetime
  status:          'pending' | 'approved' | 'cancelled';
  note?:           string;
  created_at:      string;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'cancelled';

function extractList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && 'items' in res && Array.isArray((res as any).items))
    return (res as any).items as T[];
  return [];
}

// datetime 문자열 → "HH:MM"
function toTimeStr(dtStr: string): string {
  if (!dtStr) return '';
  const d = new Date(dtStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// datetime 문자열 → "MM월 DD일"
function toDateStr(dtStr: string): string {
  if (!dtStr) return '';
  return new Date(dtStr).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
}

// ─── 상태 설정 ──────────────────────────────────────────────
const STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: '승인대기', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  approved:  { label: '승인',    color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  cancelled: { label: '취소',    color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' },
};

// ─── 상세 모달 ─────────────────────────────────────────────
function DetailModal({
  booking,
  onClose,
  onStatusChange,
}: {
  booking:        Booking;
  onClose:        () => void;
  onStatusChange: (id: string, status: 'approved' | 'cancelled') => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const st = STATUS[booking.status] ?? STATUS.pending;

  const changeStatus = async (s: 'approved' | 'cancelled') => {
    setLoading(true);
    await onStatusChange(booking.id, s);
    setLoading(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '480px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ padding: '3px 10px', borderRadius: '12px', background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontSize: '11px', fontWeight: 700 }}>{st.label}</span>
            </div>
            <h3 style={{ margin: '6px 0 0', fontSize: '18px', fontWeight: 800, color: '#1a1a1a' }}>{booking.title}</h3>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f3f4f6', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: '시설',   value: booking.facility_name ?? '—' },
            { label: '날짜',   value: `${toDateStr(booking.start_time)} (${toTimeStr(booking.start_time)} – ${toTimeStr(booking.end_time)})` },
            { label: '신청자', value: booking.booked_by_name ?? '—' },
            { label: '신청일', value: new Date(booking.created_at).toLocaleDateString('ko-KR') },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', minWidth: '50px' }}>{r.label}</span>
              <span style={{ fontSize: '13px', color: '#374151' }}>{r.value}</span>
            </div>
          ))}
          {booking.note && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', minWidth: '50px' }}>메모</span>
              <span style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{booking.note}</span>
            </div>
          )}
        </div>

        {/* 승인/취소 버튼 (pending 상태일 때만) */}
        {booking.status === 'pending' && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => changeStatus('cancelled')} disabled={loading}
              style={{ padding: '9px 18px', borderRadius: '9px', border: '1.5px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
              취소
            </button>
            <button onClick={() => changeStatus('approved')} disabled={loading}
              style={{ padding: '9px 22px', borderRadius: '9px', border: 'none', background: loading ? '#bbf7d0' : '#16a34a', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(22,163,74,0.25)' }}>
              {loading ? '처리 중...' : '✓ 승인'}
            </button>
          </div>
        )}
        {booking.status === 'approved' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => changeStatus('cancelled')} disabled={loading}
              style={{ padding: '9px 18px', borderRadius: '9px', border: '1.5px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
              {loading ? '처리 중...' : '예약 취소'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 메인 페이지 ────────────────────────────────────────────
export default function BookingsPage() {
  const [bookings,    setBookings]    = useState<Booking[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [statusTab,   setStatusTab]   = useState<StatusFilter>('all');
  const [search,      setSearch]      = useState('');
  const [detailBk,    setDetailBk]    = useState<Booking | null>(null);
  const [alert,       setAlert]       = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<unknown>('/api/v1/facilities/bookings?limit=100');
      setBookings(extractList<Booking>(res));
    } catch { setBookings([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id: string, status: 'approved' | 'cancelled') => {
    try {
      await apiClient(`/api/v1/facilities/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setAlert({ type: 'ok', msg: status === 'approved' ? '승인되었습니다.' : '취소되었습니다.' });
      await load();
    } catch {
      setAlert({ type: 'err', msg: '처리 중 오류가 발생했습니다.' });
    }
    finally { setTimeout(() => setAlert(null), 2500); }
  };

  // 탭별 카운트
  const counts = { all: bookings.length, pending: 0, approved: 0, cancelled: 0 };
  bookings.forEach(b => { counts[b.status] = (counts[b.status] ?? 0) + 1; });

  const displayed = bookings
    .filter(b => statusTab === 'all' || b.status === statusTab)
    .filter(b => !search.trim() || b.title?.includes(search) || b.facility_name?.includes(search) || b.booked_by_name?.includes(search));

  const TABS: { key: StatusFilter; label: string }[] = [
    { key: 'all',       label: '전체' },
    { key: 'pending',   label: '승인대기' },
    { key: 'approved',  label: '승인' },
    { key: 'cancelled', label: '취소' },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .bk-row { transition:background 0.12s; }
        .bk-row:hover { background:#f8faff !important; }
        .inp-bk:focus { border-color:#c9a84c !important; box-shadow:0 0 0 3px rgba(201,168,76,0.1); }
      `}</style>

      <div className="page-content" style={{ maxWidth: '900px' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.04em' }}>예약 관리</h1>
          <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#9ca3af' }}>시설 예약을 승인하거나 취소합니다</p>
        </div>

        {/* 알림 */}
        {alert && (
          <div style={{ padding: '11px 16px', borderRadius: '10px', background: alert.type === 'ok' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${alert.type === 'ok' ? '#86efac' : '#fca5a5'}`, color: alert.type === 'ok' ? '#16a34a' : '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: '16px', animation: 'fadeIn 0.2s' }}>
            {alert.type === 'ok' ? '✓' : '✕'} {alert.msg}
          </div>
        )}

        {/* 통계 카드 */}
        <div className="r-grid-4" style={{ gap: '10px', marginBottom: '20px' }}>
          {TABS.map(t => {
            const cfg = STATUS[t.key] ?? { color: '#c9a84c', bg: '#fdf8e8', border: '#f0d88a' };
            const isSel = statusTab === t.key;
            return (
              <div key={t.key} onClick={() => setStatusTab(t.key)}
                style={{ background: isSel ? (t.key === 'all' ? '#fdf8e8' : cfg.bg) : '#fff', border: `1.5px solid ${isSel ? (t.key === 'all' ? '#f0d88a' : cfg.border) : '#f1f5f9'}`, borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: t.key === 'all' ? '#c9a84c' : cfg.color, letterSpacing: '-0.02em' }}>{counts[t.key] ?? 0}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginTop: '2px' }}>{t.label}</div>
              </div>
            );
          })}
        </div>

        {/* 탭 + 검색 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '5px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setStatusTab(t.key)}
                style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', fontFamily: 'inherit', fontSize: '12px', fontWeight: statusTab === t.key ? 700 : 500, cursor: 'pointer', background: statusTab === t.key ? '#fff' : 'transparent', color: statusTab === t.key ? '#c9a84c' : '#6b7280', boxShadow: statusTab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.13s', whiteSpace: 'nowrap' }}>
                {t.label}
                <span style={{ marginLeft: '4px', background: statusTab === t.key ? '#fdf8e8' : '#e5e7eb', color: statusTab === t.key ? '#c9a84c' : '#9ca3af', borderRadius: '8px', padding: '0 5px', fontSize: '10px', fontWeight: 700 }}>{counts[t.key] ?? 0}</span>
              </button>
            ))}
          </div>
          <input className="inp-bk"
            style={{ padding: '9px 13px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', fontFamily: 'inherit', color: '#1a1a1a', marginLeft: 'auto', width: '200px', maxWidth: '100%' }}
            placeholder="제목/시설/신청자 검색" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* 테이블 */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: '560px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '110px 90px 1fr 90px 80px 90px', gap: '0', padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
            {['날짜', '시간', '예약 제목 / 시설', '신청자', '상태', '관리'].map(h => (
              <span key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.03em' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', fontSize: '14px' }}>불러오는 중...</div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>📅</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>예약이 없습니다</div>
              <div style={{ fontSize: '13px', color: '#9ca3af' }}>예약 현황 페이지에서 예약을 신청해보세요</div>
            </div>
          ) : (
            displayed.map(b => {
              const st = STATUS[b.status] ?? STATUS.pending;
              return (
                <div key={b.id} className="bk-row" onClick={() => setDetailBk(b)}
                  style={{ display: 'grid', gridTemplateColumns: '110px 90px 1fr 90px 80px 90px', gap: '0', padding: '14px 20px', borderBottom: '1px solid #f9fafb', alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{toDateStr(b.start_time)}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{toTimeStr(b.start_time)}–{toTimeStr(b.end_time)}</span>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.facility_name}</div>
                  </div>
                  <span style={{ fontSize: '13px', color: '#374151' }}>{b.booked_by_name ?? '—'}</span>
                  <span style={{ padding: '3px 8px', borderRadius: '10px', background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontSize: '11px', fontWeight: 700, display: 'inline-block' }}>{st.label}</span>
                  <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '5px' }}>
                    {b.status === 'pending' && (
                      <>
                        <button onClick={() => changeStatus(b.id, 'approved')}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: '#f0fdf4', color: '#16a34a', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>승인</button>
                        <button onClick={() => changeStatus(b.id, 'cancelled')}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: '#fef2f2', color: '#dc2626', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
                      </>
                    )}
                    {b.status === 'approved' && (
                      <button onClick={() => changeStatus(b.id, 'cancelled')}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: '#fef2f2', color: '#dc2626', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          </div>
          </div>
        </div>
      </div>

      {detailBk && (
        <DetailModal booking={detailBk} onClose={() => setDetailBk(null)} onStatusChange={changeStatus} />
      )}
    </>
  );
}

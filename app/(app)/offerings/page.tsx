'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, formatKRW } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

// ─── 타입 ──────────────────────────────────────────────
interface LookupItem {
  code: string;
  name: string;
}

interface Offering {
  id: number;
  offering_date: string;
  offering_type_code: string;
  offering_type_name?: string;
  worship_type_code?: string;
  worship_type_name?: string;
  total_amount: number;
  status: 'draft' | 'confirmed';
  item_count?: number;
}

interface OfferingsResponse {
  items: Offering[];
  total: number;
  page: number;
  pages: number;
}

interface MonthlyStats {
  total_amount: number;
  count: number;
}

// ─── 상태 뱃지 (다크 테마) ─────────────────────────────
function StatusBadge({ status }: { status: 'draft' | 'confirmed' }) {
  const { t } = useTranslation();
  return (
    <span className={`badge ${status === 'confirmed' ? 'badge-confirmed' : 'badge-draft'}`}>
      {status === 'confirmed' ? t.offerings.confirmed : t.offerings.draft}
    </span>
  );
}

// ─── 스켈레톤 행 ───────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[120, 110, 100, 110, 80, 70].map((w, i) => (
        <td key={i} style={{ padding: '14px 18px' }}>
          <div className="skeleton" style={{ height: '14px', width: `${w}px`, maxWidth: '100%' }} />
        </td>
      ))}
    </tr>
  );
}

// ─── 통계 카드 (다크 테마) ─────────────────────────────
function StatCard({ icon, label, value, sub, accentColor }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; accentColor: string;
}) {
  return (
    <div style={{
      borderRadius: '16px', padding: '22px 24px',
      background: 'var(--surface)',
      border: `1px solid ${accentColor}30`,
      boxShadow: `var(--shadow-card), 0 0 20px ${accentColor}15`,
      display: 'flex', alignItems: 'flex-start', gap: '16px',
    }}>
      <div style={{
        width: '46px', height: '46px', borderRadius: '12px',
        background: `${accentColor}18`,
        border: `1px solid ${accentColor}35`,
        boxShadow: `0 0 16px ${accentColor}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: accentColor,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.03em' }}>{value}</div>
        {sub && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px', fontWeight: 500 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────
export default function OfferingsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [offerings, setOfferings]     = useState<Offering[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  // 필터
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo,   setDateTo]         = useState('');
  const [filterType, setFilterType]   = useState('');

  // 룩업
  const [offeringTypes, setOfferingTypes] = useState<LookupItem[]>([]);

  // 이번 달 통계
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);

  const SIZE = 20;

  useEffect(() => {
    apiClient<LookupItem[]>('/api/v1/lookup/offering_type')
      .then(setOfferingTypes)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const now = new Date();
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const from  = `${year}-${month}-01`;
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const to    = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    apiClient<{ total_amount: number; count: number }>(
      `/api/v1/offerings/stats?date_from=${from}&date_to=${to}`
    ).then(setMonthlyStats).catch(() => {});
  }, []);

  const fetchOfferings = useCallback(async (pg: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(pg), size: String(SIZE) });
      if (dateFrom)   params.set('date_from', dateFrom);
      if (dateTo)     params.set('date_to',   dateTo);
      if (filterType) params.set('offering_type_code', filterType);
      const data = await apiClient<OfferingsResponse>(`/api/v1/offerings?${params}`);
      setOfferings(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.pages ?? 1);
      setPage(data.page ?? pg);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.fetchError);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, filterType]);

  useEffect(() => { fetchOfferings(1); }, [fetchOfferings]);

  const goPage = (p: number) => { setPage(p); fetchOfferings(p); };

  const pageButtons = () => {
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) range.push(i);
    return range;
  };

  const fmtDate = (d: string) => {
    if (!d) return '—';
    const parts = d.slice(0, 10).split('-');
    return parts.length < 3 ? d : `${parts[0]}.${parts[1]}.${parts[2]}`;
  };

  const now = new Date();
  const monthLabel = now.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });

  return (
    <div className="page-content" style={{ maxWidth: '1100px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{
            fontSize: '26px', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 6px',
            color: '#1a1a1a',
          }}>
            {t.offerings.title}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>
            {t.offerings.totalCount.replace('{count}', total.toLocaleString())}
          </p>
        </div>
        <button
          onClick={() => router.push('/offerings/new')}
          className="btn-primary-dark"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t.offerings.enterOffering}
        </button>
      </div>

      {/* 이번 달 통계 카드 */}
      <div className="r-grid-2" style={{ gap: '16px', marginBottom: '24px' }}>
        <StatCard
          accentColor="#c9a84c"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          }
          label={t.offerings.monthlyTotal.replace('{label}', monthLabel)}
          value={monthlyStats ? formatKRW(monthlyStats.total_amount) : '—'}
          sub={monthlyStats ? t.offerings.totalCount.replace('{count}', String(monthlyStats.count)) : undefined}
        />
        <StatCard
          accentColor="#10b981"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          }
          label={t.offerings.totalOfferingCount}
          value={`${total.toLocaleString()}${t.common.cases}`}
          sub={t.offerings.allPeriod}
        />
      </div>

      {/* 필터 */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '14px', padding: '18px 24px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {[
            { label: t.offerings.dateFrom, type: 'date', value: dateFrom, onChange: setDateFrom },
            { label: t.offerings.dateTo, type: 'date', value: dateTo,   onChange: setDateTo },
          ].map(({ label, type, value, onChange }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '150px', flex: 1 }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</label>
              <input
                className="input-dark"
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '160px', flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t.offerings.offeringType}</label>
            <select
              className="input-dark"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{ width: '100%', cursor: 'pointer' }}
            >
              <option value="">{t.common.all}</option>
              {offeringTypes.map(t => (
                <option key={t.code} value={t.code}>{t.name}</option>
              ))}
            </select>
          </div>
          <button
            className="btn-secondary-dark"
            onClick={() => { setDateFrom(''); setDateTo(''); setFilterType(''); }}
          >
            {t.common.reset}
          </button>
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div className="error-dark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
          <button onClick={() => fetchOfferings(page)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '13px' }}>
            {t.common.retry}
          </button>
        </div>
      )}

      {/* 테이블 */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-dark" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
            <thead>
              <tr>
                {t.offerings.headers.map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : offerings.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}>
                            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                          </svg>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground-2)', marginBottom: '4px' }}>{t.offerings.noOfferings}</div>
                          <div style={{ fontSize: '13px' }}>
                            {(dateFrom || dateTo || filterType) ? t.offerings.changeFilter : t.offerings.tryEntering}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                  : offerings.map(o => (
                    <tr
                      key={o.id}
                      onClick={() => router.push(`/offerings/${o.id}`)}
                    >
                      <td data-label={t.offerings.headers[0]} style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {fmtDate(o.offering_date)}
                      </td>
                      <td data-label={t.offerings.headers[1]} style={{ whiteSpace: 'nowrap' }}>
                        <span className="badge badge-type">
                          {o.offering_type_name ?? o.offering_type_code}
                        </span>
                      </td>
                      <td data-label={t.offerings.headers[2]} style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {o.worship_type_name ?? o.worship_type_code ?? '—'}
                      </td>
                      <td data-label={t.offerings.headers[3]} style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                        {formatKRW(o.total_amount)}
                      </td>
                      <td data-label={t.offerings.headers[4]} style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {o.item_count != null ? `${o.item_count}${t.common.cases}` : '—'}
                      </td>
                      <td data-label={t.offerings.headers[5]} style={{ whiteSpace: 'nowrap' }}>
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {!loading && totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '18px 20px', borderTop: '1px solid var(--border)',
          }}>
            <button className="page-btn-dark" disabled={page === 1} onClick={() => goPage(1)}>«</button>
            <button className="page-btn-dark" disabled={page === 1} onClick={() => goPage(page - 1)}>‹</button>
            {pageButtons().map(p => (
              <button key={p} className={`page-btn-dark${p === page ? ' active' : ''}`} onClick={() => goPage(p)}>{p}</button>
            ))}
            <button className="page-btn-dark" disabled={page === totalPages} onClick={() => goPage(page + 1)}>›</button>
            <button className="page-btn-dark" disabled={page === totalPages} onClick={() => goPage(totalPages)}>»</button>
          </div>
        )}
      </div>
    </div>
  );
}

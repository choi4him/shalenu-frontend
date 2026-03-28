'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, formatDateKR } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

// ─── 타입 ─────────────────────────────────────────────
interface Member {
  id: number;
  name: string;
  gender?: 'M' | 'F' | null;
  phone?: string | null;
  email?: string | null;
  birth_date?: string | null;
  registered_date?: string | null;
  status?: string | null;
}

interface MembersResponse {
  items: Member[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ─── 상태 뱃지 (다크 테마) ────────────────────────────
const STATUS_CLASS: Record<string, string> = {
  active:    'badge-active',
  inactive:  'badge-inactive',
  completed: 'badge-completed',
  withdrawn: 'badge-withdrawn',
};
function StatusBadge({ status }: { status?: string | null }) {
  const { t } = useTranslation();
  if (!status || !STATUS_CLASS[status]) {
    return <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>—</span>;
  }
  return (
    <span className={`badge ${STATUS_CLASS[status]}`}>
      {t.members.statusLabels[status] ?? status}
    </span>
  );
}

// ─── 스켈레톤 행 ──────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[140, 60, 100, 120, 110, 70].map((w, i) => (
        <td key={i} style={{ padding: '14px 18px' }}>
          <div className="skeleton" style={{ height: '14px', width: `${w}px`, maxWidth: '100%' }} />
        </td>
      ))}
    </tr>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────
export default function MembersPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [members, setMembers]       = useState<Member[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch]         = useState('');
  const [inputVal, setInputVal]     = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SIZE = 20;

  const fetchMembers = useCallback(async (pg: number, q: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(pg), size: String(SIZE), ...(q ? { search: q } : {}) });
      const data = await apiClient<MembersResponse>(`/api/v1/members?${params}`);
      setMembers(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.pages ?? 1);
      setPage(data.page ?? pg);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.fetchError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(page, search); }, [fetchMembers, page, search]);

  const handleSearchChange = (val: string) => {
    setInputVal(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); setSearch(val.trim()); }, 300);
  };

  const pageButtons = () => {
    const range: number[] = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) range.push(i);
    return range;
  };

  const genderLabel = (g?: string | null) => g ? (t.members.genderLabels[g] ?? '—') : '—';

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1100px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{
            fontSize: '26px', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 6px',
            color: '#1a1a1a',
          }}>
            {t.members.title}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>
            {t.members.totalCount.replace('{count}', total.toLocaleString())}
          </p>
        </div>
        <button
          onClick={() => router.push('/members/new')}
          className="btn-primary-dark"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t.members.register}
        </button>
      </div>

      {/* 검색바 */}
      <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '380px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="input-dark"
          type="text"
          placeholder={t.members.searchPlaceholder}
          value={inputVal}
          onChange={e => handleSearchChange(e.target.value)}
          style={{ width: '100%', paddingLeft: '40px', paddingRight: '16px', paddingTop: '11px', paddingBottom: '11px', borderRadius: '10px', fontSize: '14px' }}
        />
      </div>

      {/* 에러 */}
      {error && (
        <div className="error-dark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
          <button onClick={() => fetchMembers(page, search)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '13px' }}>
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
                {t.members.headers.map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : members.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 12px' }}>
                          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground-2)', marginBottom: '4px' }}>{t.members.noMembers}</div>
                        <div style={{ fontSize: '13px' }}>
                          {search ? t.members.noSearchResults.replace('{query}', search) : t.members.registerPrompt}
                        </div>
                      </td>
                    </tr>
                  )
                  : members.map(m => (
                    <tr
                      key={m.id}
                      onClick={() => router.push(`/members/${m.id}`)}
                    >
                      <td style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '14px', whiteSpace: 'nowrap' }}>
                        {m.name}
                      </td>
                      <td style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>
                        {genderLabel(m.gender)}
                      </td>
                      <td style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>
                        {m.phone ?? '—'}
                      </td>
                      <td style={{ fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.email ?? '—'}
                      </td>
                      <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {m.registered_date ? formatDateKR(m.registered_date) : '—'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <StatusBadge status={m.status} />
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
            <button className="page-btn-dark" disabled={page === 1} onClick={() => setPage(1)}>«</button>
            <button className="page-btn-dark" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {pageButtons().map(p => (
              <button key={p} className={`page-btn-dark${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn-dark" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            <button className="page-btn-dark" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
          </div>
        )}
      </div>
    </div>
  );
}

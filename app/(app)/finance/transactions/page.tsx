'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, formatKRW } from '@/lib/api';

// ─── 타입 ───────────────────────────────────────────────
interface Account {
  id: number;
  name: string;
}

interface Transaction {
  id: number;
  transaction_date: string;
  transaction_type: 'income' | 'expense';
  account_id: number;
  account_name?: string;
  amount: number;
  description: string;
  category?: string;
}

interface TxResponse {
  items: Transaction[];
  total: number;
  page: number;
  pages: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  worship: '예배', mission: '선교', education: '교육',
  admin: '행정', facility: '시설', etc: '기타',
};

// ─── 스켈레톤 ───────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[100, 180, 70, 110, 100, 100].map((w, i) => (
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
export default function TransactionsPage() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [hoveredRow, setHoveredRow]     = useState<number | null>(null);

  // 계좌 목록
  const [accounts, setAccounts]   = useState<Account[]>([]);

  // 필터
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');
  const [filterAcct,  setFilterAcct]  = useState('');
  const [filterType,  setFilterType]  = useState('');

  const SIZE = 20;

  useEffect(() => {
    apiClient<Account[]>('/api/v1/finance/accounts').then(setAccounts).catch(() => {});
  }, []);

  const fetchTx = useCallback(async (pg: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(pg), size: String(SIZE) });
      if (dateFrom)   params.set('date_from',         dateFrom);
      if (dateTo)     params.set('date_to',           dateTo);
      if (filterAcct) params.set('account_id',        filterAcct);
      if (filterType) params.set('transaction_type',  filterType);

      const data = await apiClient<TxResponse>(`/api/v1/finance/transactions?${params}`);
      setTransactions(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.pages ?? 1);
      setPage(data.page ?? pg);
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, filterAcct, filterType]);

  useEffect(() => { fetchTx(1); }, [fetchTx]);

  const goPage = (p: number) => fetchTx(p);

  const pageButtons = () => {
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) range.push(i);
    return range;
  };

  const fmtDate = (d: string) => {
    if (!d) return '—';
    const p = d.slice(0, 10).split('-');
    return p.length === 3 ? `${p[0]}.${p[1]}.${p[2]}` : d;
  };

  // 이번 달 수입/지출 합계
  const incomeSum  = transactions.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenseSum = transactions.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
        .tx-row { cursor:pointer; transition:background 0.15s; }
        .tx-row:hover { background:rgba(160,120,40,0.06) !important; }
        .page-btn { display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid rgba(160,120,40,0.3);background:rgba(255,255,255,0.90);color:#1a1a1a;transition:all 0.15s;font-family:inherit; }
        .page-btn:hover:not(:disabled) { border-color:#c9a84c;color:#c9a84c; }
        .page-btn.active { background:#c9a84c;color:#fff;border-color:#c9a84c; }
        .page-btn:disabled { opacity:.35;cursor:not-allowed; }
        .fi-filter:focus { border-color:#c9a84c !important; box-shadow:0 0 0 3px rgba(201,168,76,0.12); }
      `}</style>

      <div className="page-content" style={{ maxWidth: '1100px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => router.push('/finance')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.90)', border: '1px solid rgba(160,120,40,0.3)',
                cursor: 'pointer', color: '#1a1a1a', flexShrink: 0, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#c9a84c'; b.style.color = '#c9a84c'; }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(160,120,40,0.3)'; b.style.color = '#1a1a1a'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.04em', margin: '0 0 6px' }}>거래 내역</h1>
              <p style={{ margin: 0, fontSize: '14px', color: '#8b6914', fontWeight: 500 }}>전체 {total.toLocaleString()}건</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/finance/transactions/new')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '11px 20px', borderRadius: '12px',
              background: 'linear-gradient(135deg,#c9a84c,#c9a84c)',
              color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: 700, fontFamily: 'inherit',
              boxShadow: '0 4px 12px rgba(201,168,76,0.35)', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            거래 입력
          </button>
        </div>

        {/* 간단 통계 */}
        <div className="r-grid-3" style={{ gap: '14px', marginBottom: '20px' }}>
          {[
            { label: '조회 수입 합계', value: formatKRW(incomeSum), color: '#7d6324', bg: 'linear-gradient(135deg,#fdf8e8,#f0d88a)' },
            { label: '조회 지출 합계', value: formatKRW(expenseSum), color: '#be123c', bg: 'linear-gradient(135deg,#fff1f2,#fecdd3)' },
            { label: '순수익', value: formatKRW(incomeSum - expenseSum), color: incomeSum >= expenseSum ? '#059669' : '#dc2626', bg: 'linear-gradient(135deg,#f0fdf4,#bbf7d0)' },
          ].map(c => (
            <div key={c.label} style={{ background: c.bg, borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>{c.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: c.color, letterSpacing: '-0.02em' }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* 필터 */}
        <div style={{
          background: 'rgba(255,255,255,0.90)', borderRadius: '14px', padding: '18px 24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)', border: '1px solid rgba(160,120,40,0.3)', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>

            {[
              { label: '시작일', el: <input className="fi-filter" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding:'9px 12px', borderRadius:'9px', border:'1px solid rgba(160,120,40,0.3)', fontSize:'13px', color:'#1a1a1a', outline:'none', fontFamily:'inherit', background:'rgba(255,255,255,0.90)', transition:'all 0.2s', boxSizing:'border-box' as const, width:'100%' }} /> },
              { label: '종료일', el: <input className="fi-filter" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding:'9px 12px', borderRadius:'9px', border:'1px solid rgba(160,120,40,0.3)', fontSize:'13px', color:'#1a1a1a', outline:'none', fontFamily:'inherit', background:'rgba(255,255,255,0.90)', transition:'all 0.2s', boxSizing:'border-box' as const, width:'100%' }} /> },
              {
                label: '계좌',
                el: (
                  <select className="fi-filter" value={filterAcct} onChange={e => setFilterAcct(e.target.value)} style={{ padding:'9px 12px', borderRadius:'9px', border:'1px solid rgba(160,120,40,0.3)', fontSize:'13px', color:'#1a1a1a', outline:'none', fontFamily:'inherit', background:'rgba(255,255,255,0.90)', cursor:'pointer', transition:'all 0.2s', boxSizing:'border-box' as const, width:'100%' }}>
                    <option value="">전체</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                ),
              },
              {
                label: '거래 유형',
                el: (
                  <select className="fi-filter" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding:'9px 12px', borderRadius:'9px', border:'1px solid rgba(160,120,40,0.3)', fontSize:'13px', color:'#1a1a1a', outline:'none', fontFamily:'inherit', background:'rgba(255,255,255,0.90)', cursor:'pointer', transition:'all 0.2s', boxSizing:'border-box' as const, width:'100%' }}>
                    <option value="">전체</option>
                    <option value="income">수입</option>
                    <option value="expense">지출</option>
                  </select>
                ),
              },
            ].map(({ label, el }) => (
              <div key={label} style={{ flex: 1, minWidth: '130px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#8b6914', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</label>
                {el}
              </div>
            ))}

            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setFilterAcct(''); setFilterType(''); }}
              style={{
                padding: '9px 16px', borderRadius: '9px', border: '1px solid rgba(160,120,40,0.3)',
                background: 'rgba(255,255,255,0.90)', fontSize: '13px', fontWeight: 600, color: '#1a1a1a',
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#c9a84c'; (e.currentTarget as HTMLButtonElement).style.color = '#c9a84c'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(160,120,40,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#1a1a1a'; }}
            >초기화</button>
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <div style={{ padding:'14px 18px', borderRadius:'12px', background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'14px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
            <button onClick={() => fetchTx(page)} style={{ marginLeft:'auto', background:'none', border:'none', color:'#dc2626', cursor:'pointer', fontWeight:600, fontFamily:'inherit', fontSize:'13px' }}>다시 시도</button>
          </div>
        )}

        {/* 테이블 */}
        <div style={{ background:'rgba(255,255,255,0.90)', borderRadius:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.1)', overflow:'hidden', border:'1px solid rgba(160,120,40,0.3)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'700px' }}>
              <thead>
                <tr style={{ background:'rgba(160,120,40,0.06)', borderBottom:'1px solid rgba(160,120,40,0.2)' }}>
                  {['날짜', '적요', '분류', '계좌', '수입', '지출'].map(h => (
                    <th key={h} style={{ padding:'13px 18px', textAlign:'left', fontSize:'12px', fontWeight:700, color:'#8b6914', letterSpacing:'0.05em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  : transactions.length === 0
                    ? (
                      <tr>
                        <td colSpan={6} style={{ padding:'60px 20px', textAlign:'center', color:'#8b6914' }}>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:'block', margin:'0 auto 12px' }}>
                            <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                          </svg>
                          <div style={{ fontSize:'15px', fontWeight:600, color:'#1a1a1a', marginBottom:'4px' }}>거래 내역이 없습니다</div>
                          <div style={{ fontSize:'13px' }}>
                            {(dateFrom || dateTo || filterAcct || filterType) ? '필터 조건을 변경해보세요.' : '거래를 입력해보세요!'}
                          </div>
                        </td>
                      </tr>
                    )
                    : transactions.map(tx => (
                      <tr
                        key={tx.id}
                        className="tx-row"
                        onMouseEnter={() => setHoveredRow(tx.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{ borderBottom:'1px solid rgba(160,120,40,0.15)', background: hoveredRow === tx.id ? 'rgba(160,120,40,0.06)' : 'transparent' }}
                      >
                        <td data-label="날짜" style={{ padding:'14px 18px', fontSize:'14px', color:'#1a1a1a', whiteSpace:'nowrap', fontWeight:500 }}>
                          {fmtDate(tx.transaction_date)}
                        </td>
                        <td data-label="내용" style={{ padding:'14px 18px', fontSize:'14px', color:'#1a1a1a', fontWeight:500, maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {tx.description || '—'}
                        </td>
                        <td data-label="분류" style={{ padding:'14px 18px', fontSize:'13px', whiteSpace:'nowrap' }}>
                          {tx.category ? (
                            <span style={{ background:'rgba(160,120,40,0.1)', color:'#7a5c00', padding:'3px 10px', borderRadius:'99px', fontSize:'12px', fontWeight:600, border:'1px solid rgba(160,120,40,0.25)' }}>
                              {CATEGORY_LABELS[tx.category] ?? tx.category}
                            </span>
                          ) : '—'}
                        </td>
                        <td data-label="계좌" style={{ padding:'14px 18px', fontSize:'13px', color:'#8b6914', whiteSpace:'nowrap' }}>
                          {tx.account_name ?? `계좌 #${tx.account_id}`}
                        </td>
                        {/* 수입 */}
                        <td data-label="수입" style={{ padding:'14px 18px', fontSize:'14px', fontWeight:700, whiteSpace:'nowrap' }}>
                          {tx.transaction_type === 'income' ? (
                            <span style={{ color:'#2563eb' }}>+ {formatKRW(tx.amount)}</span>
                          ) : '—'}
                        </td>
                        {/* 지출 */}
                        <td data-label="지출" style={{ padding:'14px 18px', fontSize:'14px', fontWeight:700, whiteSpace:'nowrap' }}>
                          {tx.transaction_type === 'expense' ? (
                            <span style={{ color:'#dc2626' }}>– {formatKRW(tx.amount)}</span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {!loading && totalPages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'18px 20px', borderTop:'1px solid rgba(160,120,40,0.2)' }}>
              <button className="page-btn" disabled={page === 1} onClick={() => goPage(1)}>«</button>
              <button className="page-btn" disabled={page === 1} onClick={() => goPage(page - 1)}>‹</button>
              {pageButtons().map(p => (
                <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => goPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page === totalPages} onClick={() => goPage(page + 1)}>›</button>
              <button className="page-btn" disabled={page === totalPages} onClick={() => goPage(totalPages)}>»</button>
            </div>
          )}
        </div>

      </div>
    </>
  );
}

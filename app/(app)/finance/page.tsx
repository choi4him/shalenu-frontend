'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, formatKRW } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// ─── 타입 ───────────────────────────────────────────────
interface MonthlyStat {
  month: number;
  income: number;
  expense: number;
}

interface SummaryReport {
  year: number;
  total_income: number;
  total_expense: number;
  current_balance: number;
  monthly: MonthlyStat[];
}

interface Account {
  id: number;
  name: string;
  account_type?: 'checking' | 'savings' | 'cash' | string;
  bank_name?: string;
  account_number?: string;
  balance: number;
  is_active: boolean;
}

const ACCOUNT_TYPE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  checking: { label: '당좌', color: '#1e40af', bg: '#dbeafe' },
  savings:  { label: '보통', color: '#166534', bg: '#dcfce7' },
  cash:     { label: '현금', color: '#7c3aed', bg: '#ede9fe' },
};

// ─── 요약 카드 ──────────────────────────────────────────
function SummaryCard({
  icon, label, value, valueColor, gradient,
}: {
  icon: React.ReactNode; label: string; value: string;
  valueColor?: string; gradient: string;
}) {
  return (
    <div style={{
      borderRadius: '16px', padding: '22px 24px', background: gradient,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'flex-start', gap: '16px',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ fontSize: '20px', fontWeight: 800, color: valueColor ?? '#111827', letterSpacing: '-0.03em' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── 스켈레톤 ───────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      borderRadius: '16px', padding: '22px 24px',
      background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
      backgroundSize: '300% 100%', animation: 'shimmer 1.5s infinite', height: '88px',
    }} />
  );
}

// MONTHS is now derived from translations inside the component

// ─── 메인 ───────────────────────────────────────────────
export default function FinancePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const MONTHS = t.finance.months;
  const [year, setYear]         = useState(new Date().getFullYear());
  const [summary, setSummary]   = useState<SummaryReport | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.allSettled([
      apiClient<SummaryReport>(`/api/v1/finance/reports/summary?year=${year}`),
      apiClient<Account[]>('/api/v1/finance/accounts'),
    ]).then(([sumRes, accRes]) => {
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
      else setError(sumRes.reason?.message ?? t.common.fetchError);
      if (accRes.status === 'fulfilled') setAccounts(accRes.value ?? []);
    }).finally(() => setLoading(false));
  }, [year]);

  // 차트 데이터
  const monthlyStats: MonthlyStat[] = summary?.monthly ?? Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expense: 0 }));
  const chartData = {
    labels: MONTHS,
    datasets: [
      {
        label: t.finance.income,
        data: MONTHS.map((_, i) => {
          const s = monthlyStats.find(m => m.month === i + 1);
          return s?.income ?? 0;
        }),
        backgroundColor: 'rgba(201,168,76,0.75)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: t.finance.expense,
        data: MONTHS.map((_, i) => {
          const s = monthlyStats.find(m => m.month === i + 1);
          return s?.expense ?? 0;
        }),
        backgroundColor: 'rgba(239,68,68,0.65)',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { family: 'Pretendard, sans-serif', size: 12 }, usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) =>
            `${ctx.dataset.label}: ${(Number(ctx.parsed.y) || 0).toLocaleString('ko-KR')}원`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Pretendard', size: 12 } } },
      y: {
        grid: { color: 'rgba(160,120,40,0.1)' },
        ticks: {
          font: { family: 'Pretendard', size: 11 },
          callback: (v: string | number) => `${Number(v).toLocaleString('ko-KR')}원`,
        },
      },
    },
  };

  // 순이익
  const netProfit = (summary?.total_income ?? 0) - (summary?.total_expense ?? 0);
  const netColor = !summary ? '#111827' : netProfit >= 0 ? '#059669' : '#dc2626';

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
        .year-btn { display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;border:1px solid rgba(160,120,40,0.3);background:rgba(255,255,255,0.90);cursor:pointer;color:#1a1a1a;transition:all 0.15s; }
        .year-btn:hover { border-color:#c9a84c; color:#c9a84c; }
        .acc-row { display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid rgba(160,120,40,0.2);transition:background 0.15s; }
        .acc-row:last-child { border-bottom:none; }
        .acc-row:hover { background:rgba(160,120,40,0.06); }
      `}</style>

      <div style={{ padding: '36px 40px', maxWidth: '1100px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.04em', margin: '0 0 6px' }}>{t.finance.title}</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#8b6914', fontWeight: 500 }}>{t.finance.subtitle}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* 연도 선택기 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.90)', borderRadius: '12px', padding: '6px 14px', border: '1px solid rgba(160,120,40,0.3)', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
              <button className="year-btn" onClick={() => setYear(y => y - 1)}>‹</button>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#1a1a1a', minWidth: '52px', textAlign: 'center' }}>{year}{t.common.year}</span>
              <button className="year-btn" onClick={() => setYear(y => y + 1)}>›</button>
            </div>
            {/* 거래 입력 버튼 */}
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
              {t.finance.enterTransaction}
            </button>
          </div>
        </div>

        {/* 요약 카드 4개 */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <SummaryCard
              gradient="linear-gradient(135deg,#fdf8e8 0%,#f0d88a 100%)"
              label={t.finance.totalIncome}
              value={summary ? formatKRW(Number(summary.total_income)) : '—'}
              valueColor="#7d6324"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
            />
            <SummaryCard
              gradient="linear-gradient(135deg,#fff1f2 0%,#fecdd3 100%)"
              label={t.finance.totalExpense}
              value={summary ? formatKRW(Number(summary.total_expense)) : '—'}
              valueColor="#be123c"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>}
            />
            <SummaryCard
              gradient={summary && netProfit >= 0 ? 'linear-gradient(135deg,#f0fdf4 0%,#bbf7d0 100%)' : 'linear-gradient(135deg,#fff7ed 0%,#fed7aa 100%)'}
              label={t.finance.netProfit}
              value={summary ? formatKRW(netProfit) : '—'}
              valueColor={netColor}
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={netColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
            />
            <SummaryCard
              gradient="linear-gradient(135deg,#f0f9ff 0%,#bae6fd 100%)"
              label={t.finance.currentBalance}
              value={summary ? formatKRW(Number(summary.current_balance)) : '—'}
              valueColor="#0369a1"
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
            />
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div style={{
            padding: '14px 18px', borderRadius: '12px', background: '#fef2f2',
            border: '1px solid #fecaca', color: '#dc2626', fontSize: '14px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* 차트 + 계좌 목록 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

          {/* 월별 수입/지출 차트 */}
          <div style={{
            background: 'rgba(255,255,255,0.90)', borderRadius: '16px', padding: '24px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            border: '1px solid rgba(160,120,40,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>{t.finance.monthlyChart}</div>
                <div style={{ fontSize: '12px', color: '#8b6914', marginTop: '2px' }}>{t.finance.yearStats.replace('{year}', String(year))}</div>
              </div>
              <button
                onClick={() => router.push('/finance/transactions')}
                style={{
                  fontSize: '12px', fontWeight: 600, color: '#c9a84c',
                  background: '#fdf8e8', border: 'none', padding: '6px 12px',
                  borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#e0e7ff'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#fdf8e8'}
              >
                {t.finance.viewTransactions}
              </button>
            </div>
            <div style={{ height: '280px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* 계좌 목록 */}
          <div style={{
            background: 'rgba(255,255,255,0.90)', borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            border: '1px solid rgba(160,120,40,0.3)', overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(160,120,40,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>{t.finance.accountStatus}</div>
                <div style={{ fontSize: '12px', color: '#8b6914', marginTop: '2px' }}>{t.finance.registeredAccounts}</div>
              </div>
              <button
                onClick={() => router.push('/finance/accounts/new')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '7px 13px', borderRadius: '9px',
                  background: 'linear-gradient(135deg,#c9a84c,#c9a84c)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 700, fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(201,168,76,0.3)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                {t.finance.addAccount}
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{
                    height: '56px', borderRadius: '10px',
                    background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
                    backgroundSize: '300% 100%', animation: 'shimmer 1.5s infinite',
                  }} />
                ))}
              </div>
            ) : accounts.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 10px' }}>
                  <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
                {t.finance.noAccounts}
              </div>
            ) : (
              accounts.map(acc => {
                const typeCfg = acc.account_type ? ACCOUNT_TYPE_MAP[acc.account_type] : null;
                return (
                  <div key={acc.id} className="acc-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>{acc.name}</span>
                        {typeCfg && (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: typeCfg.color, background: typeCfg.bg, padding: '2px 8px', borderRadius: '99px', letterSpacing: '0.02em' }}>
                            {typeCfg.label}
                          </span>
                        )}
                        {!acc.is_active && (
                          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, background: '#f3f4f6', padding: '2px 8px', borderRadius: '99px' }}>{t.common.inactive}</span>
                        )}
                      </div>
                      {acc.bank_name && (
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                          {acc.bank_name}{acc.account_number ? ` · ${acc.account_number}` : ''}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: acc.balance >= 0 ? '#1e40af' : '#dc2626', letterSpacing: '-0.02em', flexShrink: 0 }}>
                      {formatKRW(Number(acc.balance))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </>
  );
}

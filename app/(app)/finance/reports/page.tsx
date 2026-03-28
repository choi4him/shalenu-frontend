'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, formatKRW } from '@/lib/api';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  ArcElement,
  Tooltip, Legend, Filler,
  type TooltipItem,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale,
  PointElement, LineElement,
  ArcElement,
  Tooltip, Legend, Filler,
);

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
  net_profit: number;
  current_balance: number;
  monthly_stats: MonthlyStat[];
}

interface TxItem {
  id: number;
  transaction_type: 'income' | 'expense';
  amount: number;
  category?: string;
}

interface TxResponse {
  items: TxItem[];
  total: number;
}

// ─── 상수 ───────────────────────────────────────────────
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

const CATEGORY_LABELS: Record<string, string> = {
  worship: '예배', mission: '선교', education: '교육',
  admin: '행정', facility: '시설', etc: '기타',
};

const DONUT_COLORS = [
  '#c9a84c','#e8d48b','#4a7c59','#b5923a','#6b9e78','#d4b85c',
];

// ─── 요약 카드 ──────────────────────────────────────────
function SummaryCard({
  icon, label, value, valueColor, gradient, sub,
}: {
  icon: React.ReactNode; label: string; value: string;
  valueColor?: string; gradient: string; sub?: string;
}) {
  return (
    <div style={{
      borderRadius: '16px', padding: '22px 24px', background: gradient,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 14px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'flex-start', gap: '16px',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(0,0,0,0.38)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '20px', fontWeight: 800, color: valueColor ?? '#111827', letterSpacing: '-0.03em' }}>{value}</div>
        {sub && <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.35)', marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── 스켈레톤 ───────────────────────────────────────────
function Sk({ w = '100%', h = '16px', r = '6px' }: { w?: string; h?: string; r?: string }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
      backgroundSize: '300% 100%', animation: 'shimmer 1.5s infinite',
    }} />
  );
}

// ─── 메인 ───────────────────────────────────────────────
export default function FinanceReportsPage() {
  const router = useRouter();
  const [year,    setYear]    = useState(new Date().getFullYear());
  const [summary, setSummary] = useState<SummaryReport | null>(null);
  const [txItems, setTxItems] = useState<TxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sumRes, txRes] = await Promise.allSettled([
        apiClient<SummaryReport>(`/api/v1/finance/reports/summary?year=${year}`),
        apiClient<TxResponse>(`/api/v1/finance/transactions?year=${year}&size=500`),
      ]);
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value);
      else setError(sumRes.reason?.message ?? '데이터를 불러오지 못했습니다.');
      if (txRes.status === 'fulfilled')  setTxItems(txRes.value?.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── 월별 통계 ──
  const monthlyStats: MonthlyStat[] = summary?.monthly_stats
    ?? Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expense: 0 }));

  const incomeByMonth  = MONTHS.map((_, i) => { const s = monthlyStats.find(m => m.month === i + 1); return s?.income  ?? 0; });
  const expenseByMonth = MONTHS.map((_, i) => { const s = monthlyStats.find(m => m.month === i + 1); return s?.expense ?? 0; });

  // 누계 잔액 계산
  let cumulative = 0;
  const monthRows = MONTHS.map((m, i) => {
    const inc = incomeByMonth[i];
    const exp = expenseByMonth[i];
    const net = inc - exp;
    cumulative += net;
    return { month: m, income: inc, expense: exp, net, cumulative };
  });

  // ── 꺾은선 차트 ──
  const lineData = {
    labels: MONTHS,
    datasets: [
      {
        label: '수입',
        data: incomeByMonth,
        borderColor: '#c9a84c',
        backgroundColor: 'rgba(201,168,76,0.08)',
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#c9a84c',
        tension: 0.4,
        fill: true,
      },
      {
        label: '지출',
        data: expenseByMonth,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.06)',
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#ef4444',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'top' as const, labels: { font: { family: 'Pretendard, sans-serif', size: 12 }, usePointStyle: true, boxWidth: 8, color: '#374151' } },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) =>
            ` ${ctx.dataset.label}: ${(Number(ctx.parsed.y) || 0).toLocaleString('ko-KR')}원`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Pretendard', size: 12 }, color: '#374151' } },
      y: {
        grid: { color: 'rgba(160,120,40,0.1)' },
        ticks: { font: { family: 'Pretendard', size: 11 }, color: '#374151', callback: (v: string | number) => `${Number(v).toLocaleString()}원` },
      },
    },
  };

  // ── 도넛 차트 (지출 항목 분류) ──
  const expenseTx = txItems.filter(t => t.transaction_type === 'expense');
  const categoryTotals: Record<string, number> = {};
  expenseTx.forEach(t => {
    const cat = t.category ?? 'etc';
    categoryTotals[cat] = (categoryTotals[cat] ?? 0) + t.amount;
  });
  const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const totalExpTx = sortedCats.reduce((s, [, v]) => s + v, 0);

  const donutData = {
    labels: sortedCats.map(([k]) => CATEGORY_LABELS[k] ?? k),
    datasets: [{
      data: sortedCats.map(([, v]) => v),
      backgroundColor: DONUT_COLORS.slice(0, sortedCats.length),
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.9)',
      hoverOffset: 6,
    }],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const, labels: { font: { family: 'Pretendard, sans-serif', size: 12 }, usePointStyle: true, boxWidth: 8, padding: 14, color: '#374151' } },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'doughnut'>) => {
            const val = Number(ctx.parsed) || 0;
            const pct = totalExpTx > 0 ? ((val / totalExpTx) * 100).toFixed(1) : '0.0';
            return ` ${ctx.label}: ${val.toLocaleString('ko-KR')}원 (${pct}%)`;
          },
        },
      },
    },
    cutout: '62%',
  };

  const netColor = !summary ? '#1a1a1a' : summary.net_profit >= 0 ? '#059669' : '#dc2626';

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .yr-btn { display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;border:1px solid rgba(160,120,40,0.3);background:rgba(255,255,255,0.90);cursor:pointer;color:#1a1a1a;transition:all 0.15s;font-size:16px; }
        .yr-btn:hover { border-color:#c9a84c;color:#c9a84c; }
        .sec-title { font-size:15px;font-weight:700;color:#1a1a1a;display:flex;align-items:center;gap:8px;margin-bottom:18px; }
        .sec-bar { width:4px;height:18px;background:linear-gradient(#c9a84c,#c9a84c);border-radius:99px;flex-shrink:0; }
        @media print {
          nav, aside, [data-noprint] { display:none !important; }
          body { font-family:'Pretendard',sans-serif; }
          .print-page { padding:20px !important; max-width:100% !important; }
          .no-print { display:none !important; }
        }
      `}</style>

      <div className="print-page" style={{ padding: '36px 40px', maxWidth: '1100px', animation: 'fadeIn 0.3s' }}>

        {/* ── 헤더 ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              className="no-print"
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.04em', margin: '0 0 4px' }}>재정 보고서</h1>
              <p style={{ margin: 0, fontSize: '13px', color: '#8b6914', fontWeight: 500 }}>{year}년 연간 보고서</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* 연도 선택기 */}
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.90)', borderRadius: '12px', padding: '6px 14px', border: '1px solid rgba(160,120,40,0.3)', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
              <button className="yr-btn" onClick={() => setYear(y => y - 1)}>‹</button>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#1a1a1a', minWidth: '52px', textAlign: 'center' }}>{year}년</span>
              <button className="yr-btn" onClick={() => setYear(y => y + 1)}>›</button>
            </div>

            {/* 인쇄 버튼 */}
            <button
              className="no-print"
              onClick={() => window.print()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '11px 18px', borderRadius: '12px',
                border: '1px solid rgba(160,120,40,0.3)', background: 'rgba(255,255,255,0.90)',
                color: '#1a1a1a', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#c9a84c'; b.style.color = '#c9a84c'; }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(160,120,40,0.3)'; b.style.color = '#1a1a1a'; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              인쇄
            </button>
          </div>
        </div>

        {/* ── 에러 ── */}
        {error && (
          <div style={{ padding: '14px 18px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
            <button onClick={fetchData} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: '13px' }}>다시 시도</button>
          </div>
        )}

        {/* ════ 섹션 1: 연간 요약 카드 ════ */}
        <div style={{ marginBottom: '28px' }}>
          <div className="sec-title">
            <div className="sec-bar" />
            섹션 1 — 연간 요약
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
              {[0,1,2,3].map(i => <Sk key={i} h="88px" r="16px" />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
              <SummaryCard
                gradient="linear-gradient(135deg,#fdf8e8,#f0d88a)"
                label="총 수입" valueColor="#7d6324"
                value={summary ? formatKRW(summary.total_income) : '—'}
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
              />
              <SummaryCard
                gradient="linear-gradient(135deg,#fff1f2,#fecdd3)"
                label="총 지출" valueColor="#be123c"
                value={summary ? formatKRW(summary.total_expense) : '—'}
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>}
              />
              <SummaryCard
                gradient={summary && summary.net_profit >= 0 ? 'linear-gradient(135deg,#f0fdf4,#bbf7d0)' : 'linear-gradient(135deg,#fff7ed,#fed7aa)'}
                label="순이익" valueColor={netColor}
                value={summary ? formatKRW(summary.net_profit) : '—'}
                sub={summary && summary.total_income > 0 ? `수입 대비 ${((summary.net_profit / summary.total_income) * 100).toFixed(1)}%` : undefined}
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={netColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
              />
              <SummaryCard
                gradient="linear-gradient(135deg,#f0f9ff,#bae6fd)"
                label="현재 잔액" valueColor="#0369a1"
                value={summary ? formatKRW(summary.current_balance) : '—'}
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
              />
            </div>
          )}
        </div>

        {/* ════ 섹션 2 + 3: 차트 2개 ════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px', marginBottom: '28px' }}>

          {/* 꺾은선 차트 */}
          <div style={{ background: 'rgba(255,255,255,0.90)', borderRadius: '16px', padding: '22px 24px', border: '1px solid rgba(160,120,40,0.3)', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
            <div className="sec-title">
              <div className="sec-bar" />
              섹션 2 — 월별 수입/지출 추이
            </div>
            {loading ? (
              <Sk h="260px" r="12px" />
            ) : (
              <div style={{ height: '260px' }}>
                <Line data={lineData} options={lineOptions} />
              </div>
            )}
          </div>

          {/* 도넛 차트 */}
          <div style={{ background: 'rgba(255,255,255,0.90)', borderRadius: '16px', padding: '22px 24px', border: '1px solid rgba(160,120,40,0.3)', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
            <div className="sec-title">
              <div className="sec-bar" />
              섹션 3 — 항목별 지출 분포
            </div>
            {loading ? (
              <Sk h="260px" r="12px" />
            ) : sortedCats.length === 0 ? (
              <div style={{ height: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', gap: '10px' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                </svg>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>지출 데이터가 없습니다</div>
              </div>
            ) : (
              <div style={{ height: '260px', position: 'relative' }}>
                <Doughnut data={donutData} options={donutOptions} />
                {/* 중앙 텍스트 */}
                <div style={{
                  position: 'absolute', top: '50%', left: '34%',
                  transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none',
                }}>
                  <div style={{ fontSize: '11px', color: '#8b6914', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>총 지출</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#1a1a1a', marginTop: '2px' }}>{formatKRW(totalExpTx)}</div>
                </div>
              </div>
            )}

            {/* 항목별 비율 목록 */}
            {!loading && sortedCats.length > 0 && (
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sortedCats.map(([cat, amt], i) => {
                  const pct = totalExpTx > 0 ? (amt / totalExpTx * 100).toFixed(1) : '0.0';
                  return (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: DONUT_COLORS[i], flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: '#1a1a1a', fontWeight: 500, flex: 1 }}>{CATEGORY_LABELS[cat] ?? cat}</span>
                      <span style={{ fontSize: '11px', color: '#8b6914' }}>{pct}%</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a1a' }}>{formatKRW(amt)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ════ 섹션 4: 월별 상세 테이블 ════ */}
        <div style={{ background: 'rgba(255,255,255,0.90)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(160,120,40,0.3)', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(160,120,40,0.2)' }}>
            <div className="sec-title" style={{ marginBottom: 0 }}>
              <div className="sec-bar" />
              섹션 4 — 월별 상세
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'rgba(160,120,40,0.06)' }}>
                  {['월', '수입 합계', '지출 합계', '순이익', '누계 잔액'].map(h => (
                    <th key={h} style={{
                      padding: '12px 20px', textAlign: h === '월' ? 'left' : 'right',
                      fontSize: '11px', fontWeight: 700, color: '#8b6914',
                      letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 12 }).map((_, i) => (
                    <tr key={i}>
                      {[60,120,120,100,120].map((w, j) => (
                        <td key={j} style={{ padding: '13px 20px' }}>
                          <Sk w={`${w}px`} />
                        </td>
                      ))}
                    </tr>
                  ))
                  : monthRows.map((row, i) => {
                    const hasData = row.income > 0 || row.expense > 0;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(160,120,40,0.15)', background: hasData ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)' }}>
                        <td style={{ padding: '13px 20px', fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>{row.month}</td>
                        <td style={{ padding: '13px 20px', textAlign: 'right', fontSize: '14px', fontWeight: row.income > 0 ? 700 : 400, color: row.income > 0 ? '#7d6324' : '#d1d5db' }}>
                          {row.income > 0 ? formatKRW(row.income) : '—'}
                        </td>
                        <td style={{ padding: '13px 20px', textAlign: 'right', fontSize: '14px', fontWeight: row.expense > 0 ? 700 : 400, color: row.expense > 0 ? '#be123c' : '#d1d5db' }}>
                          {row.expense > 0 ? formatKRW(row.expense) : '—'}
                        </td>
                        <td style={{ padding: '13px 20px', textAlign: 'right', fontSize: '14px', fontWeight: 700, color: row.net > 0 ? '#059669' : row.net < 0 ? '#dc2626' : '#9ca3af' }}>
                          {row.net > 0 ? `+${formatKRW(row.net)}` : row.net < 0 ? `${formatKRW(row.net)}` : '—'}
                        </td>
                        <td style={{ padding: '13px 20px', textAlign: 'right', fontSize: '14px', fontWeight: 700, color: row.cumulative >= 0 ? '#1e40af' : '#dc2626' }}>
                          {row.income > 0 || row.expense > 0 ? formatKRW(row.cumulative) : '—'}
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
              {/* 합계 행 */}
              {!loading && summary && (
                <tfoot>
                  <tr style={{ background: 'linear-gradient(135deg,#f5f7ff,#fdf8e8)', borderTop: '2px solid #f0d88a' }}>
                    <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 800, color: '#7d6324' }}>연간 합계</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: '15px', fontWeight: 900, color: '#7d6324', letterSpacing: '-0.02em' }}>
                      {formatKRW(summary.total_income)}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: '15px', fontWeight: 900, color: '#be123c', letterSpacing: '-0.02em' }}>
                      {formatKRW(summary.total_expense)}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: '15px', fontWeight: 900, color: netColor, letterSpacing: '-0.02em' }}>
                      {summary.net_profit >= 0 ? '+' : ''}{formatKRW(summary.net_profit)}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontSize: '15px', fontWeight: 900, color: '#0369a1', letterSpacing: '-0.02em' }}>
                      {formatKRW(summary.current_balance)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* 인쇄 푸터 (인쇄 시에만) */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#9ca3af', display: 'none' }} className="print-footer">
          J-SheepFold 교회 관리 시스템 · {year}년 재정 보고서 · 출력일: {new Date().toLocaleDateString('ko-KR')}
        </div>
        <style>{`@media print { .print-footer { display:block !important; } }`}</style>

      </div>
    </>
  );
}

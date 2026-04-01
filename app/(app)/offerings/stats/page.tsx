'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, formatCurrency } from '@/lib/api';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import type { TooltipItem } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// ─── 타입 ────────────────────────────────────────────────
interface OfferingTypeSummary {
  type:       string;
  type_label: string;
  total:      number;
}

interface MonthlyItem {
  month:  number;
  type:   string;
  amount: number;
}

interface StatsResponse {
  year:          number;
  grand_total:   number;
  by_type:       OfferingTypeSummary[];
  monthly:       MonthlyItem[];       // [{month,type,amount}]
}

interface MemberStat {
  member_id:   number | null;
  member_name: string;
  by_type:     Record<string, number>; // { '주일헌금': 500000, ... }
  total:       number;
}

// ─── 상수 ────────────────────────────────────────────────
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

// 헌금 종류별 팔레트
const TYPE_PALETTE = [
  { bg:'rgba(201,168,76,0.85)',  border:'#c9a84c' },
  { bg:'rgba(16,185,129,0.85)', border:'#10b981' },
  { bg:'rgba(245,158,11,0.85)', border:'#f59e0b' },
  { bg:'rgba(239,68,68,0.85)',  border:'#ef4444' },
  { bg:'rgba(59,130,246,0.85)', border:'#3b82f6' },
  { bg:'rgba(201,168,76,0.85)', border:'#e8d48b' },
  { bg:'rgba(74,124,89,0.85)', border:'#4a7c59' },
];

// ─── 스켈레톤 ─────────────────────────────────────────────
function Sk({ w='100%', h='16px', r='8px' }: { w?:string; h?:string; r?:string }) {
  return (
    <div style={{
      width:w, height:h, borderRadius:r,
      background:'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)',
      backgroundSize:'300% 100%', animation:'shimmer 1.5s infinite',
    }} />
  );
}

// ─── 요약 카드 ────────────────────────────────────────────
function SummaryCard({
  label, amount, sub, color, bg,
}: { label:string; amount:number; sub?:string; color:string; bg:string }) {
  return (
    <div style={{
      background:'#fff', borderRadius:'14px', padding:'18px 20px',
      border:'1.5px solid #f1f5f9',
      boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
      borderTop:`3px solid ${color}`,
    }}>
      <div style={{ fontSize:'11px', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'10px' }}>{label}</div>
      <div style={{ fontSize:'22px', fontWeight:900, color:'#1a1a1a', letterSpacing:'-0.04em', marginBottom:'4px' }}>{formatCurrency(amount)}</div>
      {sub && <div style={{ fontSize:'12px', color:'#6b7280' }}>{sub}</div>}
      <div style={{ marginTop:'10px', height:'4px', borderRadius:'99px', background:bg, overflow:'hidden' }}>
        <div style={{ height:'100%', width:'100%', background:color, borderRadius:'99px' }} />
      </div>
    </div>
  );
}

// ─── 메인 ────────────────────────────────────────────────
export default function OfferingsStatsPage() {
  const router = useRouter();
  const [year,      setYear]      = useState(new Date().getFullYear());
  const [stats,     setStats]     = useState<StatsResponse | null>(null);
  const [members,   setMembers]   = useState<MemberStat[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [loadingM,  setLoadingM]  = useState(true);
  const [error,     setError]     = useState('');
  const [sortKey,   setSortKey]   = useState<'total'|string>('total');
  const [sortAsc,   setSortAsc]   = useState(false);

  // ── 통계 로드 ──
  const loadStats = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await apiClient<StatsResponse>(`/api/v1/offerings/stats?year=${year}`);
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '데이터를 불러오지 못했습니다.');
    } finally { setLoading(false); }
  }, [year]);

  // ── 교인별 통계 로드 ──
  const loadMembers = useCallback(async () => {
    setLoadingM(true);
    try {
      const data = await apiClient<MemberStat[]>(`/api/v1/offerings/stats/by-member?year=${year}`);
      setMembers(data ?? []);
    } catch { setMembers([]); }
    finally { setLoadingM(false); }
  }, [year]);

  useEffect(() => { loadStats(); loadMembers(); }, [loadStats, loadMembers]);

  // ── 정렬 ──
  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };
  const sortedMembers = [...members].sort((a, b) => {
    const av = sortKey === 'total' ? a.total : (a.by_type[sortKey] ?? 0);
    const bv = sortKey === 'total' ? b.total : (b.by_type[sortKey] ?? 0);
    return sortAsc ? av - bv : bv - av;
  });

  // ── 차트 데이터 ──
  const allTypes = stats ? stats.by_type.map(t => t.type_label) : [];

  // 누적 막대 데이터셋
  const barDatasets = allTypes.map((typeLabel, i) => {
    const palette = TYPE_PALETTE[i % TYPE_PALETTE.length];
    const data = MONTHS.map((_, mi) => {
      const match = stats?.monthly.find(m => m.month === mi + 1 && m.type === (stats.by_type[i]?.type ?? ''));
      return match?.amount ?? 0;
    });
    return {
      label: typeLabel,
      data,
      backgroundColor: palette.bg,
      borderColor: palette.border,
      borderRadius: 4,
      borderSkipped: false as const,
    };
  });

  const barData = {
    labels: MONTHS,
    datasets: barDatasets,
  };

  const barOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { font: { family: 'Pretendard', size: 12 }, boxWidth: 12, padding: 14, color: '#c0c0d0' } },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) =>
            ` ${ctx.dataset.label}: ${(ctx.raw as number).toLocaleString('ko-KR')}원`,
        },
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Pretendard', size: 12 }, color: '#7b7b9d' } },
      y: {
        stacked: true,
        grid: { color: 'rgba(255,255,255,0.07)' },
        ticks: {
          font: { family: 'Pretendard', size: 11 },
          color: '#7b7b9d',
          callback: (v: number | string) => `${Number(v).toLocaleString('ko-KR')}원`,
        },
      },
    },
  };

  // 도넛 차트
  const doughnutData = {
    labels: stats?.by_type.map(t => t.type_label) ?? [],
    datasets: [{
      data: stats?.by_type.map(t => t.total) ?? [],
      backgroundColor: TYPE_PALETTE.map(p => p.bg),
      borderColor:     TYPE_PALETTE.map(p => p.border),
      borderWidth: 2,
      hoverOffset: 6,
    }],
  };

  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'doughnut'>) =>
            ` ${ctx.label}: ${(ctx.raw as number).toLocaleString('ko-KR')}원`,
        },
      },
    },
  };

  // 전체 타입 목록 (테이블 헤더용)
  const memberTypeKeys = Array.from(
    new Set(members.flatMap(m => Object.keys(m.by_type)))
  );

  // SortIcon
  const SortIcon = ({ k }: { k: string }) => (
    <span style={{ marginLeft:'4px', opacity: sortKey === k ? 1 : 0.3, fontSize:'11px' }}>
      {sortKey === k ? (sortAsc ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .yr-btn { display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;border:1.5px solid #e5e7eb;background:#fff;cursor:pointer;color:#374151;transition:all 0.15s;font-size:18px;font-family:inherit; }
        .yr-btn:hover { border-color:#c9a84c;color:#c9a84c; }
        .th-btn { background:none;border:none;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;color:#6b7280;padding:0;display:flex;align-items:center; }
        .th-btn:hover { color:#c9a84c; }
        .member-row:hover { background:#f8faff !important; cursor:pointer; }
      `}</style>

      <div style={{ padding:'36px 40px', maxWidth:'980px' }}>

        {/* ── 헤더 ── */}
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'28px',flexWrap:'wrap',gap:'14px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'14px' }}>
            <button
              onClick={() => router.push('/offerings')}
              style={{ display:'flex',alignItems:'center',justifyContent:'center',width:'36px',height:'36px',borderRadius:'10px',background:'#f1f5f9',border:'1.5px solid #e5e7eb',cursor:'pointer',color:'#374151',transition:'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background='#e0e7ff'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background='#f1f5f9'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div>
              <h1 style={{ fontSize:'26px',fontWeight:800,color:'#1a1a1a',letterSpacing:'-0.04em',margin:'0 0 4px' }}>헌금 통계</h1>
              <p style={{ margin:0,fontSize:'13px',color:'#9ca3af',fontWeight:500 }}>연도별 헌금 현황 분석</p>
            </div>
          </div>
          {/* 연도 선택기 */}
          <div style={{ display:'flex',alignItems:'center',gap:'8px',background:'#fff',borderRadius:'12px',padding:'6px 14px',border:'1.5px solid #e5e7eb',boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <button className="yr-btn" onClick={() => setYear(y => y - 1)}>‹</button>
            <span style={{ fontSize:'16px',fontWeight:800,color:'#1e1e2e',minWidth:'52px',textAlign:'center' }}>{year}년</span>
            <button className="yr-btn" onClick={() => setYear(y => y + 1)}>›</button>
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <div style={{ padding:'13px 16px',borderRadius:'11px',background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:'13px',marginBottom:'20px',display:'flex',alignItems:'center',gap:'10px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
            <button onClick={loadStats} style={{ marginLeft:'auto',background:'none',border:'none',color:'#dc2626',cursor:'pointer',fontWeight:600,fontFamily:'inherit',fontSize:'13px' }}>다시 시도</button>
          </div>
        )}

        {/* ── 섹션 1: 연간 요약 카드 ── */}
        <div style={{ marginBottom:'24px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px' }}>
            <div style={{ width:'4px',height:'18px',background:'linear-gradient(#c9a84c,#c9a84c)',borderRadius:'99px' }} />
            <span style={{ fontSize:'15px',fontWeight:700,color:'#1a1a1a' }}>연간 요약</span>
          </div>
          {loading ? (
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'14px' }}>
              {[0,1,2,3].map(i => <Sk key={i} h="100px" r="14px" />)}
            </div>
          ) : stats ? (
            <div style={{ display:'grid',gridTemplateColumns:`repeat(auto-fill,minmax(180px,1fr))`,gap:'14px',animation:'fadeIn 0.3s' }}>
              {/* 총합 카드 */}
              <SummaryCard
                label="연간 헌금 합계"
                amount={stats.grand_total}
                sub={`${(stats.grand_total / 12).toFixed(0) !== 'NaN' ? '월평균 ' + formatCurrency(Math.round(stats.grand_total / 12)) : ''}`}
                color="#c9a84c"
                bg="#fdf8e8"
              />
              {/* 종류별 카드 */}
              {stats.by_type.map((t, i) => (
                <SummaryCard
                  key={t.type}
                  label={t.type_label}
                  amount={t.total}
                  sub={stats.grand_total > 0 ? `비율 ${((t.total / stats.grand_total) * 100).toFixed(1)}%` : ''}
                  color={TYPE_PALETTE[i % TYPE_PALETTE.length].border}
                  bg={TYPE_PALETTE[i % TYPE_PALETTE.length].bg.replace('0.85', '0.15')}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* ── 섹션 2 & 3: 차트 ── */}
        <div className="m-1col" style={{ display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:'18px',marginBottom:'24px' }}>
          {/* 월별 막대 차트 */}
          <div style={{ background:'#fff',borderRadius:'16px',padding:'22px 24px',border:'1px solid #f1f5f9',boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px' }}>
              <div style={{ width:'4px',height:'18px',background:'linear-gradient(#c9a84c,#c9a84c)',borderRadius:'99px' }} />
              <span style={{ fontSize:'15px',fontWeight:700,color:'#1a1a1a' }}>월별 헌금 추이</span>
            </div>
            {loading ? <Sk h="240px" r="12px" /> : (
              <div style={{ height:'260px', animation:'fadeIn 0.3s' }}>
                <Bar data={barData} options={barOpts} />
              </div>
            )}
          </div>

          {/* 도넛 차트 */}
          <div style={{ background:'#fff',borderRadius:'16px',padding:'22px 24px',border:'1px solid #f1f5f9',boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px' }}>
              <div style={{ width:'4px',height:'18px',background:'linear-gradient(#c9a84c,#c9a84c)',borderRadius:'99px' }} />
              <span style={{ fontSize:'15px',fontWeight:700,color:'#1a1a1a' }}>종류별 비율</span>
            </div>
            {loading ? <Sk h="240px" r="12px" /> : (
              <div style={{ animation:'fadeIn 0.3s' }}>
                <div style={{ height:'180px', position:'relative' }}>
                  <Doughnut data={doughnutData} options={doughnutOpts} />
                  {/* 중앙 라벨 */}
                  {stats && (
                    <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none' }}>
                      <div style={{ fontSize:'10px',fontWeight:700,color:'#9ca3af',letterSpacing:'0.05em' }}>합계</div>
                      <div style={{ fontSize:'13px',fontWeight:900,color:'#1a1a1a',whiteSpace:'nowrap' }}>
                        {formatCurrency(stats.grand_total)}
                      </div>
                    </div>
                  )}
                </div>
                {/* 범례 */}
                <div style={{ marginTop:'14px',display:'flex',flexDirection:'column',gap:'7px' }}>
                  {stats?.by_type.map((t, i) => {
                    const pct = stats.grand_total > 0 ? ((t.total / stats.grand_total) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={t.type} style={{ display:'flex',alignItems:'center',gap:'8px' }}>
                        <div style={{ width:'10px',height:'10px',borderRadius:'3px',background:TYPE_PALETTE[i % TYPE_PALETTE.length].border,flexShrink:0 }} />
                        <span style={{ fontSize:'12px',color:'#374151',flex:1 }}>{t.type_label}</span>
                        <span style={{ fontSize:'11px',color:'#9ca3af' }}>{pct}%</span>
                        <span style={{ fontSize:'12px',fontWeight:700,color:'#1a1a1a',minWidth:'80px',textAlign:'right' }}>{formatCurrency(t.total)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 섹션 4: 교인별 헌금 현황 테이블 ── */}
        <div style={{ background:'#fff',borderRadius:'16px',padding:'22px 24px',border:'1px solid #f1f5f9',boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'16px' }}>
            <div style={{ width:'4px',height:'18px',background:'linear-gradient(#c9a84c,#c9a84c)',borderRadius:'99px' }} />
            <span style={{ fontSize:'15px',fontWeight:700,color:'#1a1a1a' }}>교인별 헌금 현황</span>
            {!loadingM && <span style={{ fontSize:'12px',color:'#9ca3af',fontWeight:500 }}>{members.length}명</span>}
          </div>

          {loadingM ? (
            <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
              {[0,1,2,3,4].map(i => <Sk key={i} h="44px" r="10px" />)}
            </div>
          ) : members.length === 0 ? (
            <div style={{ textAlign:'center',padding:'40px 20px',color:'#9ca3af',fontSize:'14px' }}>
              데이터가 없습니다
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:'13px' }}>
                <thead>
                  <tr style={{ background:'#f8fafc',borderBottom:'1.5px solid #e5e7eb' }}>
                    <th style={{ padding:'10px 14px',textAlign:'left',fontWeight:700,color:'#374151',whiteSpace:'nowrap',position:'sticky',left:0,background:'#f8fafc',zIndex:1 }}>
                      교인명
                    </th>
                    {memberTypeKeys.map(k => (
                      <th key={k} style={{ padding:'10px 14px',textAlign:'right',whiteSpace:'nowrap' }}>
                        <button className="th-btn" onClick={() => handleSort(k)} style={{ marginLeft:'auto' }}>
                          {k}<SortIcon k={k} />
                        </button>
                      </th>
                    ))}
                    <th style={{ padding:'10px 14px',textAlign:'right',whiteSpace:'nowrap',color:'#c9a84c' }}>
                      <button className="th-btn" onClick={() => handleSort('total')} style={{ marginLeft:'auto',color:'#c9a84c' }}>
                        연간 합계<SortIcon k="total" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMembers.map((m, i) => (
                    <tr
                      key={m.member_id ?? `anon-${i}`}
                      className="member-row"
                      style={{ borderBottom:'1px solid #f1f5f9',transition:'background 0.12s' }}
                      onClick={() => { if (m.member_id) router.push(`/members/${m.member_id}`); }}
                    >
                      <td style={{
                        padding:'11px 14px',fontWeight:600,color:'#1a1a1a',
                        position:'sticky',left:0,background:'#fff',zIndex:1,
                        display:'flex',alignItems:'center',gap:'8px',whiteSpace:'nowrap',
                      }}>
                        {/* 아바타 */}
                        <div style={{
                          width:'28px',height:'28px',borderRadius:'50%',
                          background:'linear-gradient(135deg,#fdf8e8,#f0d88a)',
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:'11px',fontWeight:800,color:'#c9a84c',flexShrink:0,
                        }}>
                          {m.member_name.charAt(0)}
                        </div>
                        {m.member_name}
                        {!m.member_id && (
                          <span style={{ fontSize:'10px',color:'#9ca3af',fontWeight:500,background:'#f1f5f9',padding:'1px 6px',borderRadius:'4px' }}>비등록</span>
                        )}
                      </td>
                      {memberTypeKeys.map(k => (
                        <td key={k} style={{ padding:'11px 14px',textAlign:'right',color:'#374151',whiteSpace:'nowrap' }}>
                          {m.by_type[k] ? formatCurrency(m.by_type[k]) : <span style={{ color:'#d1d5db' }}>—</span>}
                        </td>
                      ))}
                      <td style={{ padding:'11px 14px',textAlign:'right',fontWeight:800,color:'#7d6324',whiteSpace:'nowrap' }}>
                        {formatCurrency(m.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* 합계 행 */}
                <tfoot>
                  <tr style={{ background:'linear-gradient(135deg,#f5f7ff,#fdf8e8)',borderTop:'2px solid #f0d88a' }}>
                    <td style={{ padding:'12px 14px',fontWeight:800,color:'#7d6324',whiteSpace:'nowrap',position:'sticky',left:0,background:'linear-gradient(135deg,#f5f7ff,#fdf8e8)',zIndex:1 }}>합계</td>
                    {memberTypeKeys.map(k => {
                      const sum = members.reduce((s, m) => s + (m.by_type[k] ?? 0), 0);
                      return (
                        <td key={k} style={{ padding:'12px 14px',textAlign:'right',fontWeight:700,color:'#374151',whiteSpace:'nowrap' }}>
                          {sum > 0 ? formatCurrency(sum) : <span style={{ color:'#d1d5db' }}>—</span>}
                        </td>
                      );
                    })}
                    <td style={{ padding:'12px 14px',textAlign:'right',fontWeight:900,color:'#7d6324',whiteSpace:'nowrap' }}>
                      {formatCurrency(members.reduce((s, m) => s + m.total, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

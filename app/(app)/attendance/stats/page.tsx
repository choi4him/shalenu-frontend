'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

// ─── 타입 ──────────────────────────────────────────────────
interface StatsData {
  summary: { present: number; absent: number; late: number; online: number; total: number };
  monthly: { month: number; present: number; absent: number; late: number; online: number }[];
  by_member: { member_id: number; name: string; present: number; absent: number; late: number; online: number; rate: number }[];
}

// ─── 차트 유틸 ─────────────────────────────────────────────
declare global {
  interface Window { Chart: any; }
}

async function loadChartJs() {
  if (typeof window === 'undefined' || window.Chart) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const STATUS_COLORS = {
  present: '#c9a84c',
  absent:  '#ef4444',
  late:    '#f59e0b',
  online:  '#06b6d4',
};

// ─── 꺾은선 차트 ─────────────────────────────────────────
function LineChart({ monthly }: { monthly: StatsData['monthly'] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<any>(null);

  useEffect(() => {
    loadChartJs().then(() => {
      if (!canvasRef.current || !window.Chart) return;
      chartRef.current?.destroy();

      const sorted = [...monthly].sort((a,b) => a.month - b.month);
      const labels = sorted.map(d => MONTH_LABELS[d.month - 1]);
      const Chart  = window.Chart;

      chartRef.current = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label:'출석', data: sorted.map(d => d.present), borderColor: STATUS_COLORS.present, backgroundColor: `${STATUS_COLORS.present}1a`, fill:true, tension:0.4, pointBackgroundColor: STATUS_COLORS.present, pointRadius:4 },
            { label:'결석', data: sorted.map(d => d.absent),  borderColor: STATUS_COLORS.absent,  backgroundColor: `${STATUS_COLORS.absent}1a`,  fill:false, tension:0.4, pointBackgroundColor: STATUS_COLORS.absent,  pointRadius:4 },
            { label:'지각', data: sorted.map(d => d.late),    borderColor: STATUS_COLORS.late,    backgroundColor: `${STATUS_COLORS.late}1a`,    fill:false, tension:0.4, pointBackgroundColor: STATUS_COLORS.late,    pointRadius:4, borderDash:[4,4] },
            { label:'온라인', data: sorted.map(d => d.online),borderColor: STATUS_COLORS.online,  backgroundColor: `${STATUS_COLORS.online}1a`,  fill:false, tension:0.4, pointBackgroundColor: STATUS_COLORS.online,  pointRadius:4, borderDash:[2,3] },
          ],
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins: { legend: { position:'top', labels:{ font:{family:'Pretendard, sans-serif', size:12}, usePointStyle:true, padding:16 } } },
          scales: {
            x: { grid:{ color:'#f1f5f9' }, ticks:{ font:{family:'Pretendard'} } },
            y: { beginAtZero:true, grid:{ color:'#f1f5f9' }, ticks:{ font:{family:'Pretendard'} } },
          },
        },
      });
    }).catch(() => {});
    return () => { chartRef.current?.destroy(); };
  }, [monthly]);

  return <canvas ref={canvasRef} />;
}

// ─── 도넛 차트 ───────────────────────────────────────────
function DonutChart({ summary }: { summary: StatsData['summary'] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<any>(null);

  useEffect(() => {
    loadChartJs().then(() => {
      if (!canvasRef.current || !window.Chart) return;
      chartRef.current?.destroy();

      const Chart = window.Chart;
      const { present, absent, late, online } = summary;

      chartRef.current = new Chart(canvasRef.current, {
        type: 'doughnut',
        data: {
          labels: ['출석', '결석', '지각', '온라인'],
          datasets: [{
            data: [present, absent, late, online],
            backgroundColor: [STATUS_COLORS.present, STATUS_COLORS.absent, STATUS_COLORS.late, STATUS_COLORS.online],
            borderWidth: 0,
            hoverOffset: 6,
          }],
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          cutout:'68%',
          plugins: {
            legend: { position:'right', labels:{ font:{family:'Pretendard, sans-serif', size:12}, usePointStyle:true, padding:14 } },
            tooltip: {
              callbacks: {
                label: (ctx: any) => {
                  const total = summary.total || 1;
                  return ` ${ctx.label}: ${ctx.raw}명 (${Math.round(ctx.raw/total*100)}%)`;
                },
              },
            },
          },
        },
      });
    }).catch(() => {});
    return () => { chartRef.current?.destroy(); };
  }, [summary]);

  return <canvas ref={canvasRef} />;
}

// ─── 메인 페이지 ──────────────────────────────────────────
export default function AttendanceStatsPage() {
  const router = useRouter();
  const today  = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey,  setSortKey]  = useState<'name' | 'rate' | 'present'>('rate');
  const [sortDesc, setSortDesc] = useState(true);
  const [search,   setSearch]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<StatsData>(`/api/v1/attendance/stats?year=${year}&month=${month}`);
      setStats(res);
    } catch {
      // mock 데이터 (API 준비 전)
      setStats({
        summary: { present: 142, absent: 18, late: 12, online: 8, total: 180 },
        monthly: [1,2,3,4,5,6,7,8,9,10,11,12].map(m => ({
          month: m, present: 120 + Math.floor(Math.random()*40), absent: 10 + Math.floor(Math.random()*20),
          late: 5 + Math.floor(Math.random()*10), online: 3 + Math.floor(Math.random()*8),
        })),
        by_member: Array.from({ length: 20 }, (_, i) => ({
          member_id: i+1, name: `샘플${i+1}`, present: Math.floor(Math.random()*12)+1,
          absent: Math.floor(Math.random()*4), late: Math.floor(Math.random()*3), online: Math.floor(Math.random()*2),
          rate: Math.floor(Math.random()*40)+60,
        })),
      });
    } finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const changeMonth = (delta: number) => {
    let m = month + delta, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1)  { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDesc(p => !p);
    else { setSortKey(key); setSortDesc(true); }
  };

  const filteredMembers = (stats?.by_member ?? [])
    .filter(m => m.name.includes(search.trim()))
    .sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'string') return sortDesc ? vb.toString().localeCompare(va) : va.localeCompare(vb.toString());
      return sortDesc ? (vb as number) - (va as number) : (va as number) - (vb as number);
    });

  const summary = stats?.summary ?? { present:0, absent:0, late:0, online:0, total:0 };
  const SortIcon = ({ col }: { col: string }) => sortKey === col
    ? <span style={{ fontSize:'10px' }}>{sortDesc ? '▼' : '▲'}</span>
    : <span style={{ fontSize:'10px', opacity:0.3 }}>⇅</span>;

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .th-btn { background:none; border:none; cursor:pointer; font:inherit; font-size:13px; font-weight:700; color:#374151; display:flex; align-items:center; gap:4px; }
        .th-btn:hover { color:#c9a84c; }
        tr.mem-row:hover td { background:#f8faff; }
      `}</style>

      <div className="page-content" style={{ maxWidth:'960px', animation:'fadeIn 0.2s ease' }}>
        {/* 헤더 */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h1 style={{ margin:0, fontSize:'26px', fontWeight:800, color:'#1a1a1a', letterSpacing:'-0.04em' }}>출석 통계</h1>
            <p style={{ margin:'5px 0 0', fontSize:'13px', color:'#9ca3af' }}>월별 출석 현황과 교인별 출석률을 확인합니다</p>
          </div>
          <button onClick={() => router.push('/attendance')}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 16px', borderRadius:'10px', border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            출석 입력으로
          </button>
        </div>

        {/* 월 선택기 */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'8px 14px', borderRadius:'12px', background:'#fff', border:'1.5px solid #e5e7eb', marginBottom:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <button onClick={() => changeMonth(-1)}
            style={{ border:'none', background:'none', cursor:'pointer', padding:'4px 6px', borderRadius:'6px', color:'#6b7280', display:'flex', alignItems:'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span style={{ fontSize:'15px', fontWeight:700, color:'#1a1a1a', minWidth:'80px', textAlign:'center' }}>{year}년 {month}월</span>
          <button onClick={() => changeMonth(1)}
            style={{ border:'none', background:'none', cursor:'pointer', padding:'4px 6px', borderRadius:'6px', color:'#6b7280', display:'flex', alignItems:'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()+1); }}
            style={{ padding:'4px 10px', borderRadius:'7px', border:'1px solid #e5e7eb', background:'#f3f4f6', color:'#374151', fontSize:'11px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            이번 달
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'80px', color:'#9ca3af' }}>통계 불러오는 중...</div>
        ) : (
          <>
            {/* ── 요약 카드 4개 ── */}
            <div className="r-grid-4" style={{ gap:'12px', marginBottom:'20px' }}>
              {([
                { label:'출석', key:'present', icon:'✅', color:STATUS_COLORS.present, bg:'#fdf8e8', border:'#f0d88a' },
                { label:'결석', key:'absent',  icon:'❌', color:STATUS_COLORS.absent,  bg:'#fef2f2', border:'#fecaca' },
                { label:'지각', key:'late',    icon:'⏰', color:STATUS_COLORS.late,    bg:'#fffbeb', border:'#fde68a' },
                { label:'온라인',key:'online', icon:'💻', color:STATUS_COLORS.online,  bg:'#ecfeff', border:'#a5f3fc' },
              ] as const).map(({ label, key, icon, color, bg, border }) => {
                const val = summary[key as keyof typeof summary] as number;
                const total = summary.total || 1;
                return (
                  <div key={key} style={{ background:bg, borderRadius:'14px', padding:'18px', border:`1px solid ${border}` }}>
                    <div style={{ fontSize:'22px', marginBottom:'8px' }}>{icon}</div>
                    <div style={{ fontSize:'11px', color, fontWeight:700, marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
                    <div style={{ fontSize:'28px', fontWeight:800, color, marginBottom:'2px' }}>{val}</div>
                    <div style={{ fontSize:'12px', color:`${color}99` }}>{Math.round(val/total*100)}%</div>
                  </div>
                );
              })}
            </div>

            {/* ── 차트 2개 ── */}
            <div className="m-1col" style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'16px', marginBottom:'20px' }}>
              <div style={{ background:'#fff', borderRadius:'16px', padding:'20px', border:'1px solid #f1f5f9', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                  <div style={{ width:'4px', height:'18px', background:'linear-gradient(#c9a84c,#c9a84c)', borderRadius:'99px' }}/>
                  <span style={{ fontSize:'14px', fontWeight:700, color:'#1a1a1a' }}>월별 출석 추이</span>
                  <span style={{ fontSize:'12px', color:'#9ca3af' }}>{year}년</span>
                </div>
                <div style={{ height:'220px' }}>
                  {stats && <LineChart monthly={stats.monthly} />}
                </div>
              </div>

              <div style={{ background:'#fff', borderRadius:'16px', padding:'20px', border:'1px solid #f1f5f9', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
                  <div style={{ width:'4px', height:'18px', background:'linear-gradient(#c9a84c,#c9a84c)', borderRadius:'99px' }}/>
                  <span style={{ fontSize:'14px', fontWeight:700, color:'#1a1a1a' }}>출석 비율</span>
                </div>
                <div style={{ height:'220px' }}>
                  {stats && <DonutChart summary={stats.summary} />}
                </div>
              </div>
            </div>

            {/* ── 교인별 출석률 테이블 ── */}
            <div style={{ background:'#fff', borderRadius:'16px', padding:'20px', border:'1px solid #f1f5f9', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px', flexWrap:'wrap', gap:'10px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ width:'4px', height:'18px', background:'linear-gradient(#c9a84c,#c9a84c)', borderRadius:'99px' }}/>
                  <span style={{ fontSize:'14px', fontWeight:700, color:'#1a1a1a' }}>교인별 출석 현황</span>
                  <span style={{ fontSize:'12px', color:'#9ca3af' }}>{filteredMembers.length}명</span>
                </div>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="이름 검색..."
                  style={{ padding:'7px 12px', borderRadius:'9px', border:'1.5px solid #e5e7eb', fontSize:'13px', outline:'none', fontFamily:'inherit', width:'180px' }} />
              </div>

              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                  <thead>
                    <tr style={{ borderBottom:'2px solid #f1f5f9' }}>
                      <th style={{ padding:'10px 12px', textAlign:'left' }}>
                        <button className="th-btn" onClick={() => handleSort('name')}>이름 <SortIcon col="name"/></button>
                      </th>
                      <th style={{ padding:'10px 12px', textAlign:'center' }}>
                        <button className="th-btn" style={{ margin:'0 auto' }} onClick={() => handleSort('present')}>출석 <SortIcon col="present"/></button>
                      </th>
                      <th style={{ padding:'10px 12px', textAlign:'center', color:'#ef4444' }}>결석</th>
                      <th style={{ padding:'10px 12px', textAlign:'center', color:'#f59e0b' }}>지각</th>
                      <th style={{ padding:'10px 12px', textAlign:'center', color:'#06b6d4' }}>온라인</th>
                      <th style={{ padding:'10px 12px', textAlign:'center' }}>
                        <button className="th-btn" style={{ margin:'0 auto' }} onClick={() => handleSort('rate')}>출석률 <SortIcon col="rate"/></button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map(m => {
                      const rate = m.rate;
                      const rateColor = rate >= 80 ? '#16a34a' : rate >= 60 ? '#d97706' : '#dc2626';
                      return (
                        <tr key={m.member_id} className="mem-row" style={{ borderBottom:'1px solid #f9fafb', cursor:'pointer' }}
                          onClick={() => router.push(`/members/${m.member_id}`)}>
                          <td style={{ padding:'10px 12px', fontWeight:600, color:'#1a1a1a' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                              <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'linear-gradient(135deg,#fdf8e8,#f0d88a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:800, color:'#c9a84c', flexShrink:0 }}>
                                {m.name.charAt(0)}
                              </div>
                              {m.name}
                            </div>
                          </td>
                          <td style={{ padding:'10px 12px', textAlign:'center', fontWeight:600, color:'#c9a84c' }}>{m.present}</td>
                          <td style={{ padding:'10px 12px', textAlign:'center', color:'#ef4444' }}>{m.absent}</td>
                          <td style={{ padding:'10px 12px', textAlign:'center', color:'#f59e0b' }}>{m.late}</td>
                          <td style={{ padding:'10px 12px', textAlign:'center', color:'#06b6d4' }}>{m.online}</td>
                          <td style={{ padding:'10px 12px', textAlign:'center' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'6px', justifyContent:'center' }}>
                              <div style={{ flex:1, maxWidth:'60px', height:'5px', borderRadius:'99px', background:'#f1f5f9', overflow:'hidden' }}>
                                <div style={{ width:`${rate}%`, height:'100%', background:rateColor, borderRadius:'99px', transition:'width 0.3s' }}/>
                              </div>
                              <span style={{ fontSize:'12px', fontWeight:700, color:rateColor, minWidth:'36px' }}>{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredMembers.length === 0 && (
                  <div style={{ textAlign:'center', padding:'30px', color:'#9ca3af' }}>데이터가 없습니다</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, formatKRW } from '@/lib/api';

// ─── 타입 ───────────────────────────────────────────────
interface BudgetItem {
  id: number;
  category: string;
  category_name?: string;
  description?: string;
  planned_amount: number;
  actual_amount: number;
}

interface Budget {
  id: number;
  year: number;
  status: 'draft' | 'confirmed';
  total_planned: number;
  total_actual: number;
  items: BudgetItem[];
  created_at?: string;
}

// ─── 상수 ───────────────────────────────────────────────
const STATUS_MAP = {
  draft:     { label: '초안',  color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  confirmed: { label: '확정',  color: '#059669', bg: '#dcfce7', border: '#bbf7d0' },
};

const CATEGORY_LABELS: Record<string, string> = {
  worship: '예배', mission: '선교', education: '교육',
  admin: '행정',  facility: '시설', etc: '기타',
};

const CATEGORY_COLORS: Record<string, string> = {
  worship: '#6366f1', mission: '#3b82f6', education: '#10b981',
  admin: '#f59e0b',   facility: '#ef4444', etc: '#8b5cf6',
};

// ─── 진행 막대 컴포넌트 ─────────────────────────────────
function ProgressBar({ planned, actual }: { planned: number; actual: number }) {
  const pct     = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0;
  const over    = planned > 0 && actual > planned;
  const overPct = planned > 0 ? ((actual / planned) * 100).toFixed(1) : '0.0';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          실적: <strong style={{ color: over ? '#dc2626' : '#111827' }}>{formatKRW(actual)}</strong>
          <span style={{ color: '#9ca3af' }}> / {formatKRW(planned)}</span>
        </span>
        <span style={{
          fontSize: '11px', fontWeight: 700,
          color: over ? '#dc2626' : pct >= 80 ? '#d97706' : '#059669',
        }}>
          {over ? `초과 ${overPct}%` : `${overPct}%`}
        </span>
      </div>
      <div style={{ height: '8px', borderRadius: '99px', background: '#f1f5f9', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: '99px',
          background: over
            ? 'linear-gradient(90deg,#ef4444,#dc2626)'
            : pct >= 80
              ? 'linear-gradient(90deg,#f59e0b,#d97706)'
              : 'linear-gradient(90deg,#6366f1,#4f46e5)',
          transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
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
export default function BudgetListPage() {
  const router = useRouter();
  const [year,    setYear]    = useState(new Date().getFullYear());
  const [budget,  setBudget]  = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [notFound, setNotFound] = useState(false);

  const loadBudget = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotFound(false);
    setBudget(null);
    try {
      const data = await apiClient<Budget>(`/api/v1/finance/budgets/${year}`);
      setBudget(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('404') || msg.includes('찾을 수 없') || msg.toLowerCase().includes('not found')) {
        setNotFound(true);
      } else {
        setError(msg || '예산 정보를 불러오지 못했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { loadBudget(); }, [loadBudget]);

  const statusCfg = budget ? (STATUS_MAP[budget.status] ?? STATUS_MAP.draft) : STATUS_MAP.draft;
  const overallPct = budget && budget.total_planned > 0
    ? ((budget.total_actual / budget.total_planned) * 100).toFixed(1)
    : '0.0';
  const isOver = budget ? budget.total_actual > budget.total_planned : false;

  return (
    <>
      <style>{`
        @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes pop     { 0%{transform:scale(0.96)} 60%{transform:scale(1.02)} 100%{transform:scale(1)} }
        .yr-btn { display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;border:1.5px solid #e5e7eb;background:#fff;cursor:pointer;color:#374151;transition:all 0.15s;font-size:18px;font-family:inherit; }
        .yr-btn:hover { border-color:#4f46e5;color:#4f46e5; }
        .budget-item-card { background:#fff;border:1.5px solid #f1f5f9;border-radius:14px;padding:18px 20px;transition:all 0.15s; }
        .budget-item-card:hover { border-color:#c7d2fe;box-shadow:0 2px 10px rgba(79,70,229,0.08); }
      `}</style>

      <div style={{ padding: '36px 40px', maxWidth: '860px' }}>

        {/* ── 헤더 ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => router.push('/finance')}
              style={{ display:'flex',alignItems:'center',justifyContent:'center',width:'36px',height:'36px',borderRadius:'10px',background:'#f1f5f9',border:'1.5px solid #e5e7eb',cursor:'pointer',color:'#374151',flexShrink:0,transition:'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background='#e0e7ff'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background='#f1f5f9'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div>
              <h1 style={{ fontSize:'26px',fontWeight:800,color:'#111827',letterSpacing:'-0.04em',margin:'0 0 4px' }}>예산 관리</h1>
              <p style={{ margin:0,fontSize:'13px',color:'#9ca3af',fontWeight:500 }}>연도별 예산 편성 및 실적 비교</p>
            </div>
          </div>

          <div style={{ display:'flex',alignItems:'center',gap:'12px' }}>
            {/* 연도 선택기 */}
            <div style={{ display:'flex',alignItems:'center',gap:'8px',background:'#fff',borderRadius:'12px',padding:'6px 14px',border:'1.5px solid #e5e7eb',boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
              <button className="yr-btn" onClick={() => setYear(y => y - 1)}>‹</button>
              <span style={{ fontSize:'16px',fontWeight:800,color:'#1e1e2e',minWidth:'52px',textAlign:'center' }}>{year}년</span>
              <button className="yr-btn" onClick={() => setYear(y => y + 1)}>›</button>
            </div>
            {/* 예산 편성 버튼 */}
            <button
              onClick={() => router.push('/finance/budgets/new')}
              style={{
                display:'inline-flex',alignItems:'center',gap:'7px',
                padding:'11px 18px',borderRadius:'12px',
                background:'linear-gradient(135deg,#4f46e5,#6366f1)',
                border:'none',color:'#fff',fontSize:'13px',fontWeight:700,
                cursor:'pointer',fontFamily:'inherit',
                boxShadow:'0 4px 14px rgba(79,70,229,0.3)',
                transition:'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity='0.9'; (e.currentTarget as HTMLButtonElement).style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity='1'; (e.currentTarget as HTMLButtonElement).style.transform='none'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              예산 편성
            </button>
          </div>
        </div>

        {/* ── 에러 ── */}
        {error && (
          <div style={{ padding:'14px 18px',borderRadius:'12px',background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:'14px',marginBottom:'20px',display:'flex',alignItems:'center',gap:'10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
            <button onClick={loadBudget} style={{ marginLeft:'auto',background:'none',border:'none',color:'#dc2626',cursor:'pointer',fontWeight:600,fontFamily:'inherit',fontSize:'13px' }}>다시 시도</button>
          </div>
        )}

        {/* ── 로딩 ── */}
        {loading && (
          <div style={{ display:'flex',flexDirection:'column',gap:'16px',animation:'fadeIn 0.2s' }}>
            <Sk h="120px" r="16px" />
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px' }}>
              {[0,1,2,3].map(i => <Sk key={i} h="100px" r="14px" />)}
            </div>
          </div>
        )}

        {/* ── 예산 없음 ── */}
        {!loading && notFound && (
          <div style={{ textAlign:'center',padding:'60px 20px',animation:'fadeIn 0.3s' }}>
            <div style={{
              width:'72px',height:'72px',borderRadius:'20px',
              background:'linear-gradient(135deg,#eef2ff,#c7d2fe)',
              display:'flex',alignItems:'center',justifyContent:'center',
              margin:'0 auto 18px',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <h2 style={{ fontSize:'20px',fontWeight:800,color:'#111827',marginBottom:'8px' }}>{year}년 예산이 없습니다</h2>
            <p style={{ fontSize:'14px',color:'#9ca3af',marginBottom:'28px' }}>새 예산을 편성하여 재정 계획을 시작해보세요.</p>
            <button
              onClick={() => router.push('/finance/budgets/new')}
              style={{
                display:'inline-flex',alignItems:'center',gap:'8px',
                padding:'13px 28px',borderRadius:'14px',
                background:'linear-gradient(135deg,#4f46e5,#6366f1)',
                border:'none',color:'#fff',fontSize:'15px',fontWeight:700,
                cursor:'pointer',fontFamily:'inherit',
                boxShadow:'0 6px 20px rgba(79,70,229,0.35)',
                transition:'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow='0 10px 26px rgba(79,70,229,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform='none'; (e.currentTarget as HTMLButtonElement).style.boxShadow='0 6px 20px rgba(79,70,229,0.35)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {year}년 예산 편성하기
            </button>
          </div>
        )}

        {/* ── 예산 있음 ── */}
        {!loading && budget && (
          <div style={{ animation:'fadeIn 0.3s' }}>

            {/* 총괄 카드 */}
            <div style={{
              background:'linear-gradient(135deg,#4f46e5 0%,#6366f1 50%,#818cf8 100%)',
              borderRadius:'20px',padding:'26px 30px',marginBottom:'20px',
              boxShadow:'0 8px 32px rgba(79,70,229,0.3)',
            }}>
              <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px' }}>
                <div>
                  <div style={{ fontSize:'12px',fontWeight:700,color:'rgba(255,255,255,0.6)',letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:'6px' }}>
                    {year}년 총 예산
                  </div>
                  <div style={{ fontSize:'34px',fontWeight:900,color:'#fff',letterSpacing:'-0.04em' }}>
                    {formatKRW(budget.total_planned)}
                  </div>
                </div>
                <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'8px' }}>
                  <span style={{
                    fontSize:'12px',fontWeight:700,padding:'5px 14px',borderRadius:'99px',
                    color: statusCfg.color, background: statusCfg.bg, border:`1px solid ${statusCfg.border}`,
                  }}>{statusCfg.label}</span>
                  <div style={{ fontSize:'13px',color:'rgba(255,255,255,0.7)',textAlign:'right' }}>
                    총 실적: <strong style={{ color:'#fff' }}>{formatKRW(budget.total_actual)}</strong>
                  </div>
                </div>
              </div>

              {/* 전체 진행률 */}
              <div>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'8px' }}>
                  <span style={{ fontSize:'12px',color:'rgba(255,255,255,0.7)',fontWeight:600 }}>전체 집행률</span>
                  <span style={{ fontSize:'13px',fontWeight:800,color: isOver ? '#fca5a5' : '#fff' }}>
                    {isOver ? `초과 (${overallPct}%)` : `${overallPct}%`}
                  </span>
                </div>
                <div style={{ height:'10px',borderRadius:'99px',background:'rgba(255,255,255,0.2)',overflow:'hidden' }}>
                  <div style={{
                    height:'100%',
                    width:`${budget.total_planned > 0 ? Math.min((budget.total_actual / budget.total_planned) * 100, 100) : 0}%`,
                    borderRadius:'99px',
                    background: isOver ? '#fca5a5' : 'rgba(255,255,255,0.85)',
                    transition:'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
                  }} />
                </div>
              </div>
            </div>

            {/* 항목별 카드 목록 */}
            <div style={{ marginBottom:'12px' }}>
              <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px' }}>
                <div style={{ width:'4px',height:'18px',background:'linear-gradient(#4f46e5,#6366f1)',borderRadius:'99px' }} />
                <span style={{ fontSize:'15px',fontWeight:700,color:'#111827' }}>항목별 예산</span>
                <span style={{ fontSize:'12px',color:'#9ca3af',fontWeight:500 }}>{budget.items.length}개 항목</span>
              </div>

              {budget.items.length === 0 ? (
                <div style={{ textAlign:'center',padding:'32px',color:'#9ca3af',fontSize:'14px',background:'#f8fafc',borderRadius:'14px' }}>
                  등록된 예산 항목이 없습니다
                </div>
              ) : (
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px' }}>
                  {budget.items.map(item => {
                    const cat   = item.category;
                    const color = CATEGORY_COLORS[cat] ?? '#6b7280';
                    const label = item.category_name ?? CATEGORY_LABELS[cat] ?? cat;
                    return (
                      <div key={item.id} className="budget-item-card">
                        <div style={{ display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px' }}>
                          <div style={{
                            width:'32px',height:'32px',borderRadius:'10px',
                            background:`${color}18`,flexShrink:0,
                            display:'flex',alignItems:'center',justifyContent:'center',
                          }}>
                            <div style={{ width:'10px',height:'10px',borderRadius:'3px',background:color }} />
                          </div>
                          <div>
                            <div style={{ fontSize:'13px',fontWeight:700,color:'#111827' }}>{label}</div>
                            {item.description && (
                              <div style={{ fontSize:'11px',color:'#9ca3af',marginTop:'1px' }}>{item.description}</div>
                            )}
                          </div>
                          <div style={{ marginLeft:'auto',textAlign:'right' }}>
                            <div style={{ fontSize:'12px',color:'#9ca3af',fontWeight:500 }}>계획</div>
                            <div style={{ fontSize:'13px',fontWeight:800,color:'#374151' }}>{formatKRW(item.planned_amount)}</div>
                          </div>
                        </div>
                        <ProgressBar planned={item.planned_amount} actual={item.actual_amount} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

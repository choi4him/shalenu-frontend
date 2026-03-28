'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';

// ─── 타입 ──────────────────────────────────────────────────
interface Pledge {
  id:              number;
  member_id:       number;
  member_name:     string;
  title:           string;
  pledge_amount:   number;
  paid_amount:     number;
  start_date?:     string;
  end_date?:       string;
  pay_cycle?:      string;
  status:          PledgeStatus;
}
interface Member { id: number; full_name?: string; name?: string; }
type PledgeStatus = 'active' | 'completed' | 'cancelled';

// API 배열 추출 헬퍼
function extractList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && 'items' in res && Array.isArray((res as any).items))
    return (res as any).items as T[];
  return [];
}

// ─── 상수 ──────────────────────────────────────────────────
const STATUS_CONFIG: Record<PledgeStatus, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: '진행중', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  completed: { label: '완료',   color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  cancelled: { label: '중단',   color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' },
};
const STATUS_TABS: Array<{ key: 'all' | PledgeStatus; label: string }> = [
  { key: 'all',       label: '전체' },
  { key: 'active',    label: '진행중' },
  { key: 'completed', label: '완료' },
  { key: 'cancelled', label: '중단' },
];
const PAY_CYCLES = ['일시납', '월납', '주납', '분기납'];
const THIS_YEAR  = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => THIS_YEAR - i);

// ─── 유틸 ──────────────────────────────────────────────────
const fmtKRW = (n: number) => n.toLocaleString('ko-KR') + '원';

// ─── 스타일 ────────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: '9px',
  border: '1.5px solid #e5e7eb', fontSize: '14px', color: '#1a1a1a',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
};
const labelSt: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '5px', display: 'block',
};

// ─── 납입 모달 ─────────────────────────────────────────────
function PayModal({ pledge, onClose, onPaid }: { pledge: Pledge; onClose: () => void; onPaid: () => void }) {
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const remaining = pledge.pledge_amount - pledge.paid_amount;

  const submit = async () => {
    const num = Number(amount.replace(/,/g, ''));
    if (!num || num <= 0) { setError('납입금액을 입력해주세요.'); return; }
    if (num > remaining)  { setError(`납입 가능 금액은 최대 ${fmtKRW(remaining)}입니다.`); return; }
    setSaving(true); setError('');
    try {
      await apiClient(`/api/v1/pledges/${pledge.id}/pay`, {
        method: 'PATCH',
        body: JSON.stringify({ amount: num }),
      });
      onPaid(); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '납입 처리에 실패했습니다.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: '18px', padding: '28px', width: '380px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#1a1a1a' }}>납입 처리</h2>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#9ca3af' }}>{pledge.member_name} · {pledge.title}</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f3f4f6', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* 현황 */}
        <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>작정 금액</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>{fmtKRW(pledge.pledge_amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>납입 완료</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>{fmtKRW(pledge.paid_amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>잔여 금액</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444' }}>{fmtKRW(remaining)}</span>
          </div>
        </div>

        {error && <div style={{ padding: '8px 12px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

        <label style={labelSt}>납입 금액</label>
        <input style={inputSt} placeholder={`최대 ${fmtKRW(remaining)}`}
          value={amount} onChange={e => {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            setAmount(raw ? Number(raw).toLocaleString('ko-KR') : '');
          }} autoFocus
          onKeyDown={e => { if (e.key === 'Enter') submit(); }} />
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
          {[10, 30, 50, 100].map(w => (
            <button key={w} onClick={() => setAmount((Math.round(remaining * w / 100 / 10000) * 10000).toLocaleString('ko-KR'))}
              style={{ padding: '4px 10px', borderRadius: '7px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {w}%
            </button>
          ))}
          <button onClick={() => setAmount(remaining.toLocaleString('ko-KR'))}
            style={{ padding: '4px 10px', borderRadius: '7px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#c9a84c', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            전액
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '9px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
          <button onClick={submit} disabled={saving}
            style={{ flex: 2, padding: '10px', borderRadius: '9px', border: 'none', background: saving ? '#f0d88a' : 'linear-gradient(135deg,#c9a84c,#c9a84c)', color: saving ? '#d4b85c' : '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 3px 10px rgba(201,168,76,0.3)' }}>
            {saving ? '처리 중...' : '납입 확인'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 등록 모달 ─────────────────────────────────────────────
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: `${THIS_YEAR}년 작정헌금`,
    pledge_amount: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: `${THIS_YEAR}-12-31`,
    pay_cycle: '월납',
  });
  const [memberId,    setMemberId]    = useState<number | null>(null);
  const [memberName,  setMemberName]  = useState('');
  const [search,      setSearch]      = useState('');
  const [results,     setResults]     = useState<Member[]>([]);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await apiClient<unknown>(`/api/v1/members?search=${encodeURIComponent(search)}&limit=8`);
        setResults(extractList<Member>(res));
      } catch { setResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const submit = async () => {
    if (!memberId) { setError('교인을 선택해주세요.'); return; }
    if (!form.title.trim()) { setError('작정헌금명을 입력해주세요.'); return; }
    const amt = Number(form.pledge_amount.replace(/,/g, ''));
    if (!amt || amt <= 0) { setError('작정 금액을 입력해주세요.'); return; }
    setSaving(true); setError('');
    try {
      await apiClient('/api/v1/pledges', {
        method: 'POST',
        body: JSON.stringify({ ...form, pledge_amount: amt, member_id: memberId }),
      });
      onCreated(); onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '등록에 실패했습니다.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '520px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.03em' }}>작정헌금 등록</h2>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#9ca3af' }}>새 작정헌금을 등록합니다</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f3f4f6', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {error && <div style={{ padding: '10px 14px', borderRadius: '9px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* 교인 검색 */}
          <div style={{ position: 'relative' }}>
            <label style={labelSt}>교인 <span style={{ color: '#ef4444' }}>*</span></label>
            <input style={{ ...inputSt, borderColor: memberId ? '#86efac' : '#e5e7eb' }}
              placeholder="교인 이름 검색..."
              value={memberName || search}
              onChange={e => { setSearch(e.target.value); setMemberId(null); setMemberName(''); }} />
            {memberId && <span style={{ position: 'absolute', right: '12px', top: '38px', fontSize: '12px', color: '#16a34a', fontWeight: 700 }}>✓ 선택됨</span>}
            {results.length > 0 && !memberId && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '9px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginTop: '2px', overflow: 'hidden' }}>
                {results.map(m => {
                  const nm = (m as any).full_name || (m as any).name || '';
                  return (
                    <div key={m.id} onClick={() => { setMemberId(m.id); setMemberName(nm); setSearch(''); setResults([]); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f8faff'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#fff'}>
                      {nm}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label style={labelSt}>작정헌금명 <span style={{ color: '#ef4444' }}>*</span></label>
            <input style={inputSt} placeholder="예) 2026년 건축헌금 작정" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>

          <div>
            <label style={labelSt}>작정 금액 <span style={{ color: '#ef4444' }}>*</span></label>
            <input style={inputSt} placeholder="0" value={form.pledge_amount}
              onChange={e => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                setForm(p => ({ ...p, pledge_amount: raw ? Number(raw).toLocaleString('ko-KR') : '' }));
              }} />
            {form.pledge_amount && (
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                = {fmtKRW(Number(form.pledge_amount.replace(/,/g, '')))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelSt}>시작일</label>
              <input style={inputSt} type="date" value={form.start_date}
                onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
            </div>
            <div>
              <label style={labelSt}>종료일</label>
              <input style={inputSt} type="date" value={form.end_date}
                onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
            </div>
          </div>

          <div>
            <label style={labelSt}>납입 주기</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PAY_CYCLES.map(c => (
                <button key={c} onClick={() => setForm(p => ({ ...p, pay_cycle: c }))}
                  style={{ padding: '7px 16px', borderRadius: '20px', border: `1.5px solid ${form.pay_cycle === c ? '#c9a84c' : '#e5e7eb'}`, background: form.pay_cycle === c ? '#c9a84c' : '#f9fafb', color: form.pay_cycle === c ? '#fff' : '#6b7280', fontSize: '13px', fontWeight: form.pay_cycle === c ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
          <button onClick={submit} disabled={saving}
            style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: saving ? '#f0d88a' : 'linear-gradient(135deg,#c9a84c,#c9a84c)', color: saving ? '#d4b85c' : '#fff', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 4px 12px rgba(201,168,76,0.3)' }}>
            {saving ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 진행률 바 ─────────────────────────────────────────────
function ProgressBar({ pledge }: { pledge: Pledge }) {
  const pct = pledge.pledge_amount > 0
    ? Math.min(100, Math.round(pledge.paid_amount / pledge.pledge_amount * 100))
    : 0;
  const barColor =
    pledge.status === 'cancelled' ? '#d1d5db' :
    pledge.status === 'completed' ? '#16a34a' :
    '#c9a84c';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: '6px', borderRadius: '99px', background: '#f1f5f9', overflow: 'hidden', width: '100px' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: barColor, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

// ─── 메인 페이지 ────────────────────────────────────────────
export default function PledgesPage() {
  const [pledges,      setPledges]      = useState<Pledge[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState<'all' | PledgeStatus>('all');
  const [year,         setYear]         = useState(THIS_YEAR);
  const [search,       setSearch]       = useState('');
  const [showCreate,   setShowCreate]   = useState(false);
  const [payTarget,    setPayTarget]    = useState<Pledge | null>(null);
  const [alert,        setAlert]        = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<unknown>(`/api/v1/pledges?year=${year}`);
      setPledges(extractList<Pledge>(res));
    } catch { setPledges([]); }
    finally { setLoading(false); }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const showAlert = (type: 'ok' | 'err', msg: string) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const displayed = pledges
    .filter(p => tab === 'all' || p.status === tab)
    .filter(p => !search.trim() || p.member_name.includes(search.trim()) || p.title.includes(search.trim()));

  // 합계
  const totalPledge = displayed.reduce((s, p) => s + p.pledge_amount, 0);
  const totalPaid   = displayed.reduce((s, p) => s + p.paid_amount,   0);
  const totalRate   = totalPledge > 0 ? Math.round(totalPaid / totalPledge * 100) : 0;

  const counts = STATUS_TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'all' ? pledges.length : pledges.filter(p => p.status === t.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes slideIn { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:none} }
        .pledge-row:hover { background: #f8faff !important; }
        .pledge-row:hover .pay-btn { opacity:1 !important; }
        .pay-btn { opacity:0; transition: opacity 0.15s; }
      `}</style>

      <div style={{ padding: '36px 40px', maxWidth: '1100px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.04em' }}>작정헌금 관리</h1>
            <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#9ca3af' }}>교인별 작정헌금 현황을 관리합니다</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '11px', border: 'none', background: 'linear-gradient(135deg,#c9a84c,#c9a84c)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(201,168,76,0.35)', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            작정헌금 등록
          </button>
        </div>

        {/* 알림 */}
        {alert && (
          <div style={{ padding: '10px 16px', borderRadius: '10px', background: alert.type === 'ok' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${alert.type === 'ok' ? '#86efac' : '#fca5a5'}`, color: alert.type === 'ok' ? '#16a34a' : '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: '16px', animation: 'slideIn 0.2s ease' }}>
            {alert.type === 'ok' ? '✓' : '✕'} {alert.msg}
          </div>
        )}

        {/* 연도 선택 + 검색 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            style={{ padding: '9px 13px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '13px', fontWeight: 700, color: '#1a1a1a', fontFamily: 'inherit', outline: 'none', background: '#fff', cursor: 'pointer' }}>
            {YEARS.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <input style={{ ...inputSt, maxWidth: '220px' }} placeholder="교인명 또는 헌금명 검색"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {STATUS_TABS.map(t => {
            const sel = tab === t.key;
            const cfg = t.key !== 'all' ? STATUS_CONFIG[t.key as PledgeStatus] : null;
            return (
              <button key={t.key} onClick={() => setTab(t.key as 'all' | PledgeStatus)}
                style={{ padding: '7px 16px', borderRadius: '20px', border: `1.5px solid ${sel ? (cfg?.border ?? '#f0d88a') : '#e5e7eb'}`, background: sel ? (cfg?.bg ?? '#fdf8e8') : '#fff', color: sel ? (cfg?.color ?? '#c9a84c') : '#6b7280', fontSize: '13px', fontWeight: sel ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                {t.label}
                <span style={{ marginLeft: '5px', padding: '1px 6px', borderRadius: '10px', background: sel ? 'rgba(255,255,255,0.5)' : '#f3f4f6', fontSize: '11px', fontWeight: 700 }}>
                  {counts[t.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* 테이블 */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden', animation: 'fadeIn 0.2s ease' }}>
          {/* 테이블 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 2fr 1.2fr 1.2fr 140px 80px 80px', gap: '0', padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
            {['교인명', '작정헌금명', '작정금액', '납입금액', '진행률', '상태', ''].map((h, i) => (
              <span key={i} style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', fontSize: '14px' }}>불러오는 중...</div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px', color: '#9ca3af' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>📋</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>등록된 작정헌금이 없습니다</div>
              <div style={{ fontSize: '13px', color: '#9ca3af' }}>상단 버튼으로 작정헌금을 등록하세요</div>
            </div>
          ) : (
            displayed.map(pledge => {
              const cfg = STATUS_CONFIG[pledge.status];
              return (
                <div key={pledge.id} className="pledge-row"
                  style={{ display: 'grid', gridTemplateColumns: '1.4fr 2fr 1.2fr 1.2fr 140px 80px 80px', gap: '0', padding: '14px 20px', borderBottom: '1px solid #f9fafb', alignItems: 'center', transition: 'background 0.12s' }}>
                  {/* 교인명 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,#fdf8e8,#f0d88a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#c9a84c', flexShrink: 0 }}>
                      {pledge.member_name.charAt(0)}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>{pledge.member_name}</span>
                  </div>
                  {/* 헌금명 */}
                  <div style={{ fontSize: '13px', color: '#374151', paddingRight: '8px' }}>{pledge.title}</div>
                  {/* 작정금액 */}
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{fmtKRW(pledge.pledge_amount)}</div>
                  {/* 납입금액 */}
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a' }}>{fmtKRW(pledge.paid_amount)}</div>
                  {/* 진행률 */}
                  <ProgressBar pledge={pledge} />
                  {/* 상태 뱃지 */}
                  <span style={{ padding: '3px 9px', borderRadius: '20px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: '11px', fontWeight: 700, display: 'inline-block' }}>
                    {cfg.label}
                  </span>
                  {/* 납입 버튼 */}
                  <div>
                    {pledge.status === 'active' && (
                      <button className="pay-btn" onClick={() => setPayTarget(pledge)}
                        style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', background: '#c9a84c', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        납입
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 합계 카드 */}
        {displayed.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginTop: '16px' }}>
            {[
              { label: '총 작정금액', value: fmtKRW(totalPledge), color: '#1a1a1a', bg: '#fff' },
              { label: '총 납입금액', value: fmtKRW(totalPaid),   color: '#16a34a', bg: '#f0fdf4' },
              { label: '전체 달성률',  value: `${totalRate}%`,     color: '#c9a84c', bg: '#fdf8e8' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: '12px', padding: '16px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { load(); showAlert('ok', '등록되었습니다.'); }} />}
      {payTarget && <PayModal pledge={payTarget} onClose={() => setPayTarget(null)} onPaid={() => { load(); showAlert('ok', '납입 처리되었습니다.'); setPayTarget(null); }} />}
    </>
  );
}

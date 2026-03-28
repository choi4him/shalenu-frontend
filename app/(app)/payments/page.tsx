'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';

// ─── 타입 ──────────────────────────────────────────────────
interface PaymentLink {
  id:                string;
  title:             string;
  description?:      string;
  amount?:           number;  // USD: 센트 단위 / KRW: 원 단위
  currency:          string;
  provider:          string;  // "stripe" | "portone"
  stripe_link_id?:   string;
  stripe_link_url?:  string;
  portone_link_id?:  string;
  portone_link_url?: string;
  is_active:         boolean;
  created_at:        string;
}

interface OnlinePayment {
  id:               string;
  payment_link_id?: string;
  link_title?:      string;
  donor_name?:      string;
  donor_email?:     string;
  amount:           number; // 센트 단위
  currency:         string;
  status:           string;
  paid_at?:         string;
  created_at:       string;
}

function extractList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && 'items' in res && Array.isArray((res as any).items))
    return (res as any).items as T[];
  return [];
}

// 금액 표기: KRW는 원 단위 그대로, USD는 센트→달러 변환
function formatAmount(amount: number, currency: string): string {
  const cur = currency.toUpperCase();
  if (cur === 'KRW') {
    return amount.toLocaleString('ko-KR') + '원';
  }
  const major = amount / 100;
  return major.toLocaleString('en-US', { style: 'currency', currency: cur });
}

// ─── 결제 링크 생성 모달 ────────────────────────────────────
function CreateLinkModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    title:       '',
    description: '',
    amountType:  'fixed' as 'fixed' | 'custom',
    amountValue: '',   // 달러 or 원 단위 입력
    currency:    'usd' as 'usd' | 'krw',
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  const isKrw = form.currency === 'krw';

  const inputStyle = { width: '100%', padding: '10px 13px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, color: '#111827' };
  const labelStyle = { fontSize: '11px', fontWeight: 700 as const, color: '#9ca3af', display: 'block' as const, marginBottom: '5px', letterSpacing: '0.04em', textTransform: 'uppercase' as const };

  const save = async () => {
    if (!form.title.trim()) { setErr('헌금 항목명을 입력해주세요.'); return; }
    if (form.amountType === 'fixed' && (!form.amountValue || Number(form.amountValue) <= 0)) {
      setErr('금액을 입력해주세요.'); return;
    }
    setSaving(true); setErr('');
    try {
      if (isKrw) {
        // PortOne 한국 결제
        await apiClient('/api/v1/payments/korea/create-link', {
          method: 'POST',
          body: JSON.stringify({
            title:       form.title,
            description: form.description || null,
            amount:      form.amountType === 'fixed' ? Math.round(Number(form.amountValue)) : null,
          }),
        });
      } else {
        // Stripe 달러 결제
        await apiClient('/api/v1/payments/payment-links', {
          method: 'POST',
          body: JSON.stringify({
            title:       form.title,
            description: form.description || null,
            amount:      form.amountType === 'fixed' ? Math.round(Number(form.amountValue) * 100) : null,
            currency:    'usd',
          }),
        });
      }
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '결제 링크 생성에 실패했습니다.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '480px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111827' }}>결제 링크 생성</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
              {isKrw ? '포트원(PortOne) 한국 결제 링크를 만듭니다' : 'Stripe를 통한 온라인 헌금 링크를 만듭니다'}
            </p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f3f4f6', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {err && <div style={{ padding: '10px 14px', borderRadius: '9px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', fontSize: '13px', marginBottom: '14px', fontWeight: 600 }}>✕ {err}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* 결제 통화 선택 */}
          <div>
            <label style={labelStyle}>결제 통화 / 방법</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {([
                { key: 'usd', label: '$ USD', sub: 'Stripe', color: '#c9a84c', bg: '#fdf8e8', border: '#f0d88a' },
                { key: 'krw', label: '₩ KRW', sub: 'PortOne', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
              ] as const).map(opt => (
                <button key={opt.key} onClick={() => setForm(p => ({ ...p, currency: opt.key, amountValue: '' }))}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `2px solid ${form.currency === opt.key ? opt.border : '#e5e7eb'}`, background: form.currency === opt.key ? opt.bg : '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: form.currency === opt.key ? opt.color : '#374151' }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', color: form.currency === opt.key ? opt.color : '#9ca3af', fontWeight: 600, marginTop: '2px' }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>헌금 항목명 *</label>
            <input style={inputStyle} placeholder="예: 주일헌금, 선교헌금, 건축헌금" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>설명 (선택)</label>
            <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} placeholder="헌금에 대한 간단한 설명"
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>

          {/* 금액 방식 선택 */}
          <div>
            <label style={labelStyle}>금액 방식</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { key: 'fixed',  label: '금액 고정' },
                { key: 'custom', label: '자유 금액' },
              ].map(opt => (
                <button key={opt.key} onClick={() => setForm(p => ({ ...p, amountType: opt.key as any }))}
                  style={{ flex: 1, padding: '9px', borderRadius: '9px', border: `1.5px solid ${form.amountType === opt.key ? '#c9a84c' : '#e5e7eb'}`, background: form.amountType === opt.key ? '#fdf8e8' : '#fff', color: form.amountType === opt.key ? '#c9a84c' : '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {form.amountType === 'fixed' && (
            <div>
              <label style={labelStyle}>{isKrw ? '금액 (원)' : '금액 (달러)'}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#6b7280', fontWeight: 600 }}>
                  {isKrw ? '₩' : '$'}
                </span>
                <input type="number" min="1" step={isKrw ? '1' : '0.01'}
                  style={{ ...inputStyle, paddingLeft: '26px' }}
                  placeholder={isKrw ? '10000' : '0.00'} value={form.amountValue}
                  onChange={e => setForm(p => ({ ...p, amountValue: e.target.value }))} />
              </div>
            </div>
          )}

          {form.amountType === 'custom' && (
            <div style={{ padding: '10px 12px', borderRadius: '9px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>ℹ️ 헌금자가 직접 금액을 입력하여 결제합니다</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
            <button onClick={save} disabled={saving}
              style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: saving ? '#f0d88a' : isKrw ? 'linear-gradient(135deg,#0ea5e9,#38bdf8)' : 'linear-gradient(135deg,#c9a84c,#c9a84c)', color: saving ? '#d4b85c' : '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 4px 12px rgba(201,168,76,0.28)' }}>
              {saving ? '생성 중...' : '링크 생성'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ────────────────────────────────────────────
export default function PaymentsPage() {
  const [links,     setLinks]     = useState<PaymentLink[]>([]);
  const [payments,  setPayments]  = useState<OnlinePayment[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<'links' | 'history'>('links');
  const [showModal, setShowModal] = useState(false);
  const [alert,     setAlert]     = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [copied,    setCopied]    = useState<string | null>(null);
  const [stripeErr, setStripeErr] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setStripeErr(false);
    try {
      const [linkRes, payRes] = await Promise.allSettled([
        apiClient<unknown>('/api/v1/payments/payment-links'),
        apiClient<unknown>('/api/v1/payments/online-payments'),
      ]);
      if (linkRes.status === 'fulfilled') setLinks(extractList<PaymentLink>(linkRes.value));
      else {
        const msg = linkRes.reason?.message ?? '';
        if (msg.includes('Stripe') || msg.includes('503')) setStripeErr(true);
      }
      if (payRes.status === 'fulfilled') setPayments(extractList<OnlinePayment>(payRes.value));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const toggleLink = async (id: string) => {
    try {
      await apiClient(`/api/v1/payments/payment-links/${id}/toggle`, { method: 'PATCH' });
      setAlert({ type: 'ok', msg: '상태가 변경되었습니다.' });
      await load();
    } catch {
      setAlert({ type: 'err', msg: '상태 변경에 실패했습니다.' });
    }
    finally { setTimeout(() => setAlert(null), 2500); }
  };

  // 통계
  const totalCompleted = payments.filter(p => p.status === 'completed');
  const totalAmount    = totalCompleted.reduce((s, p) => s + p.amount, 0);

  const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    completed: { label: '완료', color: '#16a34a', bg: '#f0fdf4' },
    pending:   { label: '대기', color: '#d97706', bg: '#fffbeb' },
    failed:    { label: '실패', color: '#dc2626', bg: '#fef2f2' },
    refunded:  { label: '환불', color: '#7c3aed', bg: '#f5f3ff' },
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .link-card:hover { box-shadow:0 6px 20px rgba(201,168,76,0.1) !important; border-color:#f0d88a !important; }
        .pay-row:hover { background:#f8faff !important; }
      `}</style>

      <div style={{ padding: '36px 40px', maxWidth: '960px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#111827', letterSpacing: '-0.04em' }}>온라인 헌금</h1>
            <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#9ca3af' }}>Stripe(USD) · 포트원(KRW) 결제 링크로 온라인 헌금을 받으세요</p>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '11px', border: 'none', background: 'linear-gradient(135deg,#c9a84c,#c9a84c)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(201,168,76,0.3)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            결제 링크 생성
          </button>
        </div>

        {/* Stripe 미설정 경고 */}
        {stripeErr && (
          <div style={{ padding: '14px 18px', borderRadius: '12px', background: '#fffbeb', border: '1.5px solid #fcd34d', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>Stripe 설정이 필요합니다</div>
              <div style={{ fontSize: '13px', color: '#78350f', lineHeight: 1.6 }}>
                백엔드 <code style={{ background: '#fef3c7', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace' }}>.env</code> 파일에 아래 항목을 추가해주세요:<br />
                <code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', display: 'block', marginTop: '6px' }}>
                  STRIPE_SECRET_KEY=sk_test_...<br />
                  STRIPE_WEBHOOK_SECRET=whsec_...
                </code>
              </div>
            </div>
          </div>
        )}

        {/* 알림 */}
        {alert && (
          <div style={{ padding: '11px 16px', borderRadius: '10px', background: alert.type === 'ok' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${alert.type === 'ok' ? '#86efac' : '#fca5a5'}`, color: alert.type === 'ok' ? '#16a34a' : '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: '16px', animation: 'fadeIn 0.2s' }}>
            {alert.type === 'ok' ? '✓' : '✕'} {alert.msg}
          </div>
        )}

        {/* 통계 카드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: '결제 링크', value: `${links.filter(l => l.is_active).length}개 활성`, icon: '🔗', color: '#c9a84c', bg: '#fdf8e8', border: '#f0d88a' },
            { label: '완료된 헌금', value: `${totalCompleted.length}건`, icon: '✅', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
            { label: '총 헌금액', value: totalCompleted.length > 0 ? formatAmount(totalAmount, 'usd') : '—', icon: '💰', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: '14px', padding: '16px 18px' }}>
              <div style={{ fontSize: '22px', marginBottom: '6px' }}>{s.icon}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', marginBottom: '18px', width: 'fit-content' }}>
          {[
            { key: 'links',   label: '결제 링크' },
            { key: 'history', label: '헌금 내역' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              style={{ padding: '7px 20px', borderRadius: '7px', border: 'none', fontFamily: 'inherit', fontSize: '13px', fontWeight: tab === t.key ? 700 : 500, cursor: 'pointer', background: tab === t.key ? '#fff' : 'transparent', color: tab === t.key ? '#c9a84c' : '#6b7280', boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.13s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ 결제 링크 탭 ══ */}
        {tab === 'links' && (
          loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', fontSize: '14px' }}>불러오는 중...</div>
          ) : links.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px', background: '#f9fafb', borderRadius: '16px', border: '1.5px dashed #e5e7eb' }}>
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>🔗</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>결제 링크가 없습니다</div>
              <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>우측 상단 "결제 링크 생성" 버튼을 눌러 첫 번째 헌금 링크를 만드세요</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeIn 0.2s' }}>
              {links.map(link => (
                <div key={link.id} className="link-card"
                  style={{ background: '#fff', borderRadius: '14px', padding: '18px 20px', border: '1.5px solid #f1f5f9', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', transition: 'all 0.15s', opacity: link.is_active ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {/* 아이콘 */}
                    <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: link.is_active ? 'linear-gradient(135deg,#fdf8e8,#e0e7ff)' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                      💳
                    </div>
                    {/* 정보 */}
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{link.title}</span>
                        <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, background: link.is_active ? '#f0fdf4' : '#f3f4f6', color: link.is_active ? '#16a34a' : '#9ca3af' }}>
                          {link.is_active ? '활성' : '비활성'}
                        </span>
                      </div>
                      {link.description && <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{link.description}</div>}
                      <div style={{ fontSize: '13px', color: '#c9a84c', fontWeight: 700 }}>
                        {link.amount ? formatAmount(link.amount, link.currency) : '자유 금액'}
                      </div>
                    </div>
                    {/* 공급자 뱃지 + 버튼 */}
                    <div style={{ display: 'flex', gap: '7px', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, background: link.provider === 'portone' ? '#f0f9ff' : '#fdf8e8', color: link.provider === 'portone' ? '#0ea5e9' : '#c9a84c', border: `1px solid ${link.provider === 'portone' ? '#bae6fd' : '#f0d88a'}` }}>
                        {link.provider === 'portone' ? 'PortOne' : 'Stripe'}
                      </span>
                      {(link.stripe_link_url || link.portone_link_url) && (() => {
                        const url = (link.stripe_link_url || link.portone_link_url)!;
                        return (
                          <>
                            <button onClick={() => copyLink(url, link.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '8px', border: '1.5px solid #f0d88a', background: copied === link.id ? '#fdf8e8' : '#fff', color: '#c9a84c', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                              {copied === link.id ? (
                                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> 복사됨</>
                              ) : (
                                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> 링크 복사</>
                              )}
                            </button>
                            <a href={url} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                              미리보기
                            </a>
                          </>
                        );
                      })()}
                      <button onClick={() => toggleLink(link.id)}
                        style={{ padding: '7px 13px', borderRadius: '8px', border: `1.5px solid ${link.is_active ? '#fca5a5' : '#86efac'}`, background: link.is_active ? '#fef2f2' : '#f0fdf4', color: link.is_active ? '#dc2626' : '#16a34a', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {link.is_active ? '비활성화' : '활성화'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ══ 헌금 내역 탭 ══ */}
        {tab === 'history' && (
          <div>
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 90px 90px 80px', gap: '0', padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                {['날짜', '헌금자', '헌금 항목', '금액', '상태'].map(h => (
                  <span key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.03em' }}>{h}</span>
                ))}
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', fontSize: '14px' }}>불러오는 중...</div>
              ) : payments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '56px' }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>💳</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>헌금 내역이 없습니다</div>
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>결제 링크를 공유하면 헌금자가 결제한 내역이 여기에 표시됩니다</div>
                </div>
              ) : (
                payments.map(p => {
                  const stCfg = STATUS_CFG[p.status] ?? STATUS_CFG.pending;
                  return (
                    <div key={p.id} className="pay-row"
                      style={{ display: 'grid', gridTemplateColumns: '120px 1fr 90px 90px 80px', gap: '0', padding: '13px 20px', borderBottom: '1px solid #f9fafb', alignItems: 'center', transition: 'background 0.12s' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {new Date(p.paid_at ?? p.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                      </span>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.donor_name ?? '익명'}
                        </div>
                        {p.donor_email && <div style={{ fontSize: '11px', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.donor_email}</div>}
                      </div>
                      <span style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.link_title ?? '—'}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{formatAmount(p.amount, p.currency)}</span>
                      <span style={{ padding: '3px 8px', borderRadius: '10px', background: stCfg.bg, color: stCfg.color, fontSize: '11px', fontWeight: 700, display: 'inline-block' }}>{stCfg.label}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <CreateLinkModal onClose={() => setShowModal(false)} onDone={() => { setShowModal(false); load(); }} />
      )}
    </>
  );
}

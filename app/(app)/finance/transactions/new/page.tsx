'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, formatKRW } from '@/lib/api';

// ─── 타입 ───────────────────────────────────────────────
interface Account {
  id: number;
  name: string;
  bank_name?: string;
}

interface Offering {
  id: number;
  offering_date: string;
  offering_type_name?: string;
  total_amount: number;
}

interface OfferingsResponse {
  items: Offering[];
}

const CATEGORIES = [
  { value: 'worship',    label: '예배' },
  { value: 'mission',    label: '선교' },
  { value: 'education',  label: '교육' },
  { value: 'admin',      label: '행정' },
  { value: 'facility',   label: '시설' },
  { value: 'etc',        label: '기타' },
];

const inputSt: React.CSSProperties = {
  width: '100%', padding: '11px 13px', borderRadius: '10px',
  border: '1.5px solid #e5e7eb', fontSize: '14px', color: '#111827',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  background: '#fff', transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelSt: React.CSSProperties = {
  fontSize: '12px', fontWeight: 700, color: '#6b7280',
  letterSpacing: '0.04em', textTransform: 'uppercase',
  marginBottom: '7px', display: 'block',
};

// ─── 메인 ───────────────────────────────────────────────
export default function TransactionNewPage() {
  const router = useRouter();

  const [accounts, setAccounts]   = useState<Account[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);

  // 폼 값
  const [txDate,      setTxDate]      = useState(new Date().toISOString().slice(0, 10));
  const [txType,      setTxType]      = useState<'income' | 'expense'>('income');
  const [accountId,   setAccountId]   = useState('');
  const [amount,      setAmount]      = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('');
  const [offeringId,  setOfferingId]  = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    // 계좌 로드
    apiClient<Account[]>('/api/v1/finance/accounts').then(setAccounts).catch(() => {});
    // 확정 헌금 로드
    apiClient<OfferingsResponse>('/api/v1/offerings?status=confirmed&size=50')
      .then(r => setOfferings(r.items ?? []))
      .catch(() => {});
  }, []);

  const handleAmountChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    setAmount(digits ? Number(digits).toLocaleString('ko-KR') : '');
  };

  const handleSubmit = async () => {
    setError('');
    const amt = parseInt(amount.replace(/,/g, ''), 10);
    if (isNaN(amt) || amt <= 0) { setError('유효한 금액을 입력해주세요.'); return; }
    if (!description.trim())   { setError('적요를 입력해주세요.'); return; }
    if (!accountId)            { setError('계좌를 선택해주세요.'); return; }

    setSubmitting(true);
    try {
      await apiClient('/api/v1/finance/transactions', {
        method: 'POST',
        body: JSON.stringify({
          transaction_date: txDate,
          transaction_type: txType,
          account_id: Number(accountId),
          amount: amt,
          description: description.trim(),
          ...(category   ? { category }                     : {}),
          ...(offeringId ? { offering_id: Number(offeringId) } : {}),
        }),
      });
      router.replace('/finance/transactions');
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .fi-input:focus { border-color:#c9a84c !important; box-shadow:0 0 0 3px rgba(201,168,76,0.12) !important; }
        .type-btn { flex:1; padding:12px; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; fontFamily:inherit; border:2px solid transparent; transition:all 0.2s; }
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      <div style={{ padding: '36px 40px', maxWidth: '720px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '30px' }}>
          <button
            onClick={() => router.push('/finance')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '10px',
              background: '#f1f5f9', border: '1.5px solid #e5e7eb',
              cursor: 'pointer', color: '#374151', flexShrink: 0, transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#e0e7ff'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', letterSpacing: '-0.04em', margin: '0 0 4px' }}>거래 입력</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>수입 또는 지출 거래를 기록하세요</p>
          </div>
        </div>

        <div style={{
          background: '#fff', borderRadius: '16px', padding: '28px 32px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          border: '1px solid #f1f5f9',
        }}>

          {/* 거래 유형 토글 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelSt}>거래 유형</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="type-btn"
                onClick={() => setTxType('income')}
                style={{
                  background: txType === 'income' ? 'linear-gradient(135deg,#fdf8e8,#ddd6fe)' : '#f8fafc',
                  borderColor: txType === 'income' ? '#c9a84c' : '#e5e7eb',
                  color: txType === 'income' ? '#7d6324' : '#6b7280',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }}>
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                </svg>
                수입
              </button>
              <button
                type="button"
                className="type-btn"
                onClick={() => setTxType('expense')}
                style={{
                  background: txType === 'expense' ? 'linear-gradient(135deg,#fff1f2,#fecdd3)' : '#f8fafc',
                  borderColor: txType === 'expense' ? '#e11d48' : '#e5e7eb',
                  color: txType === 'expense' ? '#be123c' : '#6b7280',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }}>
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
                </svg>
                지출
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* 거래 날짜 */}
            <div>
              <label style={labelSt}>거래 날짜</label>
              <input className="fi-input" type="date" value={txDate} onChange={e => setTxDate(e.target.value)} style={inputSt} />
            </div>

            {/* 계좌 선택 */}
            <div>
              <label style={labelSt}>계좌</label>
              <select className="fi-input" value={accountId} onChange={e => setAccountId(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                <option value="">계좌 선택</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}{a.bank_name ? ` (${a.bank_name})` : ''}</option>
                ))}
              </select>
            </div>

            {/* 금액 */}
            <div>
              <label style={labelSt}>금액</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="fi-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={amount}
                  onChange={e => handleAmountChange(e.target.value)}
                  style={{ ...inputSt, paddingRight: '28px' }}
                />
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#9ca3af', pointerEvents: 'none' }}>원</span>
              </div>
            </div>

            {/* 항목 분류 */}
            <div>
              <label style={labelSt}>항목 분류</label>
              <select className="fi-input" value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                <option value="">선택 (선택사항)</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* 적요 */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelSt}>적요 (거래 설명)</label>
              <input
                className="fi-input"
                type="text"
                placeholder="거래 내용을 간략히 입력하세요"
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={inputSt}
              />
            </div>

            {/* 헌금 연결 (수입 시에만) */}
            {txType === 'income' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelSt}>헌금 연결 (선택사항)</label>
                <select className="fi-input" value={offeringId} onChange={e => setOfferingId(e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                  <option value="">연결하지 않음</option>
                  {offerings.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.offering_date} · {o.offering_type_name ?? '헌금'} · {formatKRW(o.total_amount)}
                    </option>
                  ))}
                </select>
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#9ca3af' }}>확정된 헌금만 표시됩니다</div>
              </div>
            )}

          </div>

          {/* 에러 */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '14px 18px', borderRadius: '12px',
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', fontSize: '13px', fontWeight: 500, marginTop: '20px',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              onClick={() => router.push('/finance')}
              disabled={submitting}
              style={{
                padding: '12px 20px', borderRadius: '12px',
                border: '1.5px solid #e5e7eb', background: '#fff',
                color: '#374151', fontSize: '14px', fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', opacity: submitting ? 0.5 : 1, transition: 'all 0.15s',
              }}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 28px', borderRadius: '12px',
                background: submitting ? '#f0d88a' : txType === 'income'
                  ? 'linear-gradient(135deg,#c9a84c,#c9a84c)'
                  : 'linear-gradient(135deg,#dc2626,#ef4444)',
                border: 'none',
                color: submitting ? '#d4b85c' : '#fff',
                fontSize: '14px', fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: submitting ? 'none' : '0 4px 12px rgba(201,168,76,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {submitting ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  저장 중...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  거래 저장
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

// ─── 상수 ───────────────────────────────────────────────
const ACCOUNT_TYPES = [
  { value: 'savings',  label: '보통예금', desc: '일반 입출금 통장' },
  { value: 'checking', label: '당좌예금', desc: '수표 발행 가능 계좌' },
  { value: 'cash',     label: '현금',     desc: '실물 현금 보관' },
];

const inputSt: React.CSSProperties = {
  width: '100%', padding: '11px 13px', borderRadius: '10px',
  border: '1.5px solid #e5e7eb', fontSize: '14px', color: '#1a1a1a',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  background: '#fff', transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelSt: React.CSSProperties = {
  fontSize: '12px', fontWeight: 700, color: '#6b7280',
  letterSpacing: '0.04em', textTransform: 'uppercase',
  marginBottom: '7px', display: 'block',
};

// ─── 메인 ───────────────────────────────────────────────
export default function AccountNewPage() {
  const router = useRouter();

  const [name,            setName]            = useState('');
  const [accountType,     setAccountType]     = useState('savings');
  const [initialBalance,  setInitialBalance]  = useState('');
  const [bankName,        setBankName]        = useState('');
  const [accountNumber,   setAccountNumber]   = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  // 금액 입력 자동 콤마
  const handleBalanceChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    setInitialBalance(digits ? Number(digits).toLocaleString('ko-KR') : '');
  };

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) { setError('계좌 이름을 입력해주세요.'); return; }

    setSubmitting(true);
    try {
      await apiClient('/api/v1/finance/accounts', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          account_type: accountType,
          initial_balance: parseInt(initialBalance.replace(/,/g, ''), 10) || 0,
          ...(bankName.trim()      ? { bank_name:       bankName.trim() }      : {}),
          ...(accountNumber.trim() ? { account_number:  accountNumber.trim() } : {}),
        }),
      });
      router.replace('/finance');
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .acc-input:focus { border-color:#c9a84c !important; box-shadow:0 0 0 3px rgba(201,168,76,0.12) !important; }
        .type-card { border-radius:12px; border:2px solid #e5e7eb; padding:14px 16px; cursor:pointer; transition:all 0.2s; background:#fff; text-align:left; width:100%; font-family:inherit; }
        .type-card:hover { border-color:#f0d88a; background:#fafbff; }
        .type-card.selected { border-color:#c9a84c; background:linear-gradient(135deg,#fdf8e8,#e0e7ff); }
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      <div style={{ padding: '36px 40px', maxWidth: '640px' }}>

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
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.04em', margin: '0 0 4px' }}>계좌 등록</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>교회 운영 계좌를 추가하세요</p>
          </div>
        </div>

        <div style={{
          background: '#fff', borderRadius: '16px', padding: '28px 32px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          border: '1px solid #f1f5f9',
        }}>

          {/* 계좌 이름 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelSt}>
              계좌 이름 <span style={{ color: '#ef4444', fontSize: '13px' }}>*</span>
            </label>
            <input
              className="acc-input"
              type="text"
              placeholder="예: 주일헌금 통장, 운영비 통장"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputSt}
              autoFocus
            />
          </div>

          {/* 계좌 유형 카드 선택 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelSt}>계좌 유형</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {ACCOUNT_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  className={`type-card${accountType === t.value ? ' selected' : ''}`}
                  onClick={() => setAccountType(t.value)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    {accountType === t.value ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '1.5px solid #d1d5db' }} />
                    )}
                    <span style={{ fontSize: '14px', fontWeight: 700, color: accountType === t.value ? '#7d6324' : '#374151' }}>
                      {t.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400, paddingLeft: '20px' }}>
                    {t.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 초기 잔액 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelSt}>초기 잔액</label>
            <div style={{ position: 'relative' }}>
              <input
                className="acc-input"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={initialBalance}
                onChange={e => handleBalanceChange(e.target.value)}
                style={{ ...inputSt, paddingRight: '28px' }}
              />
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#9ca3af', pointerEvents: 'none' }}>원</span>
            </div>
            <div style={{ marginTop: '6px', fontSize: '12px', color: '#9ca3af' }}>계좌 개설 시 초기 보유 금액 (기본값: 0원)</div>
          </div>

          {/* 은행명 · 계좌번호 (선택) */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '14px' }}>
              추가 정보 (선택사항)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelSt}>은행명</label>
                <input
                  className="acc-input"
                  type="text"
                  placeholder="예: 국민은행"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  style={inputSt}
                />
              </div>
              <div>
                <label style={labelSt}>계좌번호</label>
                <input
                  className="acc-input"
                  type="text"
                  placeholder="예: 123-456-789012"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  style={inputSt}
                />
              </div>
            </div>
          </div>

          {/* 에러 */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '14px 18px', borderRadius: '12px',
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', fontSize: '13px', fontWeight: 500, marginBottom: '20px',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* 미리보기 */}
          {name.trim() && (
            <div style={{
              background: 'linear-gradient(135deg,#fdf8e8,#e0e7ff)',
              borderRadius: '12px', padding: '14px 18px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>미리보기</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e1e2e' }}>{name}</span>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                    ...({
                      savings:  { color: '#166534', background: '#dcfce7' },
                      checking: { color: '#1e40af', background: '#dbeafe' },
                      cash:     { color: '#7c3aed', background: '#ede9fe' },
                    }[accountType] ?? { color: '#374151', background: '#f3f4f6' }),
                  }}>
                    {ACCOUNT_TYPES.find(t => t.value === accountType)?.label}
                  </span>
                </div>
                {bankName && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{bankName}{accountNumber ? ` · ${accountNumber}` : ''}</div>}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e40af' }}>
                {initialBalance ? `${initialBalance}원` : '0원'}
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
                background: submitting ? '#f0d88a' : 'linear-gradient(135deg,#c9a84c,#c9a84c)',
                border: 'none',
                color: submitting ? '#d4b85c' : '#fff',
                fontSize: '14px', fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: submitting ? 'none' : '0 4px 12px rgba(201,168,76,0.35)',
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
                  계좌 등록
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

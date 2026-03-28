'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/** HTTP 상태코드별 한국어 에러 메시지 */
function getErrorMessage(status: number): string {
  if (status === 401 || status === 400) return '이메일 또는 비밀번호가 올바르지 않습니다.';
  if (status === 403) return '접근 권한이 없습니다. 관리자에게 문의하세요.';
  if (status === 429) return '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.';
  if (status >= 500) return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  return '로그인 처리 중 오류가 발생했습니다.';
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [hasError, setHasError] = useState(false);
  const [mounted, setMounted]   = useState(false);
  const emailRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    emailRef.current?.focus();
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setHasError(false);

    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError(getErrorMessage(res.status));
        setHasError(true);
        return;
      }

      const data = await res.json();
      const token = data.access_token ?? data.token ?? data.accessToken;

      if (!token) {
        setError('로그인 처리 중 오류가 발생했습니다.');
        setHasError(true);
        return;
      }

      localStorage.setItem('access_token', token);
      router.replace('/dashboard');
    } catch {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: `1.5px solid ${hasError ? 'rgba(239,68,68,0.5)' : 'rgba(99,102,241,0.3)'}`,
    fontSize: '15px',
    color: '#e2e8f0',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    background: 'rgba(255,255,255,0.06)',
    boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.15)' : 'none',
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-8px); }
          40%     { transform: translateX(8px); }
          60%     { transform: translateX(-5px); }
          80%     { transform: translateX(5px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatParticle {
          0%,100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50%     { transform: translateY(-30px) scale(1.1); opacity: 0.5; }
        }
        .login-card-enter { animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        .login-card-hidden { opacity: 0; transform: translateY(24px); }
        .login-card-shake  { animation: shake 0.4s ease; }
        .pw-toggle-btn {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; padding: 4px;
          color: #7b7b9d; display: flex; align-items: center;
          border-radius: 6px; transition: color 0.15s; line-height: 0;
        }
        .pw-toggle-btn:hover { color: #a5b4fc; }
        .login-submit-btn { transition: all 0.2s ease; }
        .login-submit-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(99,102,241,0.5) !important;
        }
        .login-submit-btn:not(:disabled):active { transform: translateY(0); }
        .login-input:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important;
        }
        .login-input::placeholder { color: #7b7b9d; }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(-45deg, #0a0a1a, #0f0f2d, #1a1040, #0d1b3e)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 12s ease infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 배경 글로우 장식 */}
        <div style={{
          position: 'absolute', top: '-200px', right: '-150px',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
          pointerEvents: 'none', animation: 'floatParticle 10s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-150px', left: '-100px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
          pointerEvents: 'none', animation: 'floatParticle 14s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '60%',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)',
          pointerEvents: 'none', animation: 'floatParticle 8s ease-in-out infinite',
        }} />
        {/* 격자 패턴 */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }} />

        {/* 로그인 카드 – glassmorphism */}
        <div
          className={
            !mounted
              ? 'login-card-hidden'
              : `login-card-enter${hasError && error ? ' login-card-shake' : ''}`
          }
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: '24px',
            padding: '48px 44px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* 카드 상단 글로우 */}
          <div style={{
            position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
            width: '60%', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent)',
          }} />

          {/* 로고 */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '18px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 8px 28px rgba(99,102,241,0.5)',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" fillOpacity="0.95"/>
                <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.65"/>
              </svg>
            </div>
            <h1 style={{
              fontSize: '28px', fontWeight: 800, margin: '0 0 6px',
              letterSpacing: '-0.04em',
              background: 'linear-gradient(135deg, #e2e8f0, #ffffff)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              J-SheepFold
            </h1>
            <p style={{ color: '#7b7b9d', fontSize: '13px', margin: 0, fontWeight: 500, letterSpacing: '0.01em' }}>
              J-SHEEPFOLD · 교회 통합 관리 시스템
            </p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* 이메일 */}
            <div>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#c0c0d0', marginBottom: '8px' }}>
                이메일
              </label>
              <input
                id="login-email"
                ref={emailRef}
                type="email"
                autoComplete="email"
                className="login-input"
                value={email}
                onChange={e => { setEmail(e.target.value); if (hasError) setHasError(false); }}
                placeholder="admin@church.com"
                required
                disabled={loading}
                style={inputStyle}
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="login-password" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#c0c0d0', marginBottom: '8px' }}>
                비밀번호
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="login-input"
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (hasError) setHasError(false); }}
                  placeholder="비밀번호를 입력하세요"
                  required
                  disabled={loading}
                  style={{ ...inputStyle, paddingRight: '48px' }}
                />
                <button type="button" className="pw-toggle-btn" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                  {showPw ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* 에러 */}
            {error && (
              <div role="alert" style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', borderRadius: '10px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#fca5a5', fontSize: '13px', fontWeight: 500, marginTop: '-4px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn"
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: loading
                  ? 'rgba(99,102,241,0.4)'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                border: 'none', color: '#ffffff',
                fontSize: '15px', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.4)',
                letterSpacing: '-0.01em', marginTop: '4px',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  로그인 중...
                </>
              ) : '로그인'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '28px', marginBottom: 0, fontSize: '12px', color: '#4b4b6b' }}>
            © {new Date().getFullYear()} J-SheepFold. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}

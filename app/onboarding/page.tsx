'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

// ─── 타입 ───────────────────────────────────────────────
interface ChurchForm {
  name:          string;
  address:       string;
  addressDetail: string;
  zipCode:       string;
  phone:         string;
  founded_at:    string;
  denomination:  string;
}

interface AdminForm {
  full_name: string;
  email:     string;
  password:  string;
  passwordConfirm: string;
  role:      string;
}

// ─── 상수 ───────────────────────────────────────────────
const ROLES = [
  { value: 'senior_pastor',  label: '담임목사' },
  { value: 'associate_pastor', label: '부목사'  },
  { value: 'admin_staff',    label: '사무 담당자' },
];

const DENOMINATIONS = [
  '예장합동', '예장통합', '기감', '기장', '기성', '순복음', '침례교', '루터교', '성공회', '기타',
];

// ─── 공통 스타일 ─────────────────────────────────────────
const inputSt: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: '10px',
  border: '1.5px solid #e5e7eb', fontSize: '14px', color: '#111827',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  background: '#fff', transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelSt: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: '#374151',
  marginBottom: '6px', display: 'block',
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelSt}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── 진행 바 ─────────────────────────────────────────────
function StepBar({ step }: { step: number }) {
  const steps = ['교회 정보', '관리자 계정', '완료'];
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {steps.map((s, i) => {
          const done    = i + 1 < step;
          const current = i + 1 === step;
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : undefined }}>
              {/* 원 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '14px', flexShrink: 0,
                  transition: 'all 0.3s',
                  background: done
                    ? 'linear-gradient(135deg,#4f46e5,#6366f1)'
                    : current
                      ? 'linear-gradient(135deg,#4f46e5,#6366f1)'
                      : '#f1f5f9',
                  color: (done || current) ? '#fff' : '#9ca3af',
                  boxShadow: current ? '0 0 0 4px rgba(99,102,241,0.2)' : 'none',
                }}>
                  {done
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : i + 1}
                </div>
                <span style={{ fontSize: '11px', fontWeight: current ? 700 : 500, color: current ? '#4f46e5' : done ? '#6b7280' : '#9ca3af', whiteSpace: 'nowrap' }}>
                  {s}
                </span>
              </div>
              {/* 연결선 */}
              {i < steps.length - 1 && (
                <div style={{
                  flex: 1, height: '2px', marginBottom: '18px', marginLeft: '6px', marginRight: '6px',
                  background: done ? '#4f46e5' : '#e5e7eb',
                  transition: 'background 0.4s',
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 메인 ───────────────────────────────────────────────
export default function OnboardingPage() {
  const router  = useRouter();
  const [step,  setStep]  = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [church, setChurch] = useState<ChurchForm>({
    name: '', address: '', addressDetail: '', zipCode: '',
    phone: '', founded_at: '', denomination: '',
  });

  const [admin, setAdmin] = useState<AdminForm>({
    full_name: '', email: '', password: '', passwordConfirm: '', role: 'senior_pastor',
  });

  const [showPw,    setShowPw]    = useState(false);
  const [showPwC,   setShowPwC]   = useState(false);

  // 카카오 주소 검색
  const openDaumPostcode = () => {
    if (typeof window === 'undefined' || !window.daum?.Postcode) return;
    new window.daum.Postcode({
      oncomplete: (data: { zonecode: string; roadAddress: string; jibunAddress?: string }) => {
        setChurch(prev => ({
          ...prev,
          zipCode: data.zonecode,
          address: data.roadAddress || data.jibunAddress || '',
        }));
      },
    }).open();
  };

  // ── 1단계 유효성 ──
  const validateStep1 = () => {
    if (!church.name.trim()) { setError('교회 이름은 필수입니다.'); return false; }
    return true;
  };

  // ── 2단계 유효성 ──
  const validateStep2 = () => {
    if (!admin.full_name.trim()) { setError('담당자 이름은 필수입니다.'); return false; }
    if (!admin.email.trim() || !admin.email.includes('@')) { setError('올바른 이메일을 입력해주세요.'); return false; }
    if (admin.password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다.'); return false; }
    if (admin.password !== admin.passwordConfirm) { setError('비밀번호가 일치하지 않습니다.'); return false; }
    return true;
  };

  const goNext = () => {
    setError('');
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step < 3) setStep(s => s + 1);
  };

  const goPrev = () => { setError(''); setStep(s => s - 1); };

  // ── 제출 ──
  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setSubmitting(true); setError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/auth/setup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            church: {
              name:         church.name,
              address:      church.address
                ? `${church.address}${church.addressDetail ? ' ' + church.addressDetail : ''}`
                : undefined,
              zip_code:     church.zipCode    || undefined,
              phone:        church.phone      || undefined,
              founded_at:   church.founded_at || undefined,
              denomination: church.denomination || undefined,
            },
            admin: {
              full_name: admin.full_name,
              email:     admin.email,
              password:  admin.password,
              role:      admin.role,
            },
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail ?? '설정에 실패했습니다.');
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const phoneFormat = (v: string) =>
    v.replace(/\D/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3');

  return (
    <>
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        * { font-family: 'Pretendard', -apple-system, sans-serif; box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .inp:focus { border-color:#4f46e5 !important; box-shadow:0 0 0 3px rgba(79,70,229,0.14) !important; }
        .role-card { padding:12px 14px;border:2px solid #e5e7eb;border-radius:12px;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:10px; }
        .role-card.sel { border-color:#4f46e5;background:#eef2ff; }
        .role-card:hover { border-color:#a5b4fc; }
        select.inp { cursor:pointer; }
      `}</style>

      {/* 배경 */}
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 16px', position: 'relative', overflow: 'hidden',
      }}>
        {/* 배경 도형 */}
        {[
          { w:260, h:260, top:'-60px', left:'-80px',  bg:'rgba(99,102,241,0.15)', r:'50%' },
          { w:200, h:200, bottom:'-40px', right:'-60px', bg:'rgba(129,140,248,0.1)', r:'50%' },
          { w:140, h:140, top:'40%', right:'5%', bg:'rgba(165,180,252,0.08)', r:'30px' },
        ].map((s, i) => (
          <div key={i} style={{ position:'absolute', width:s.w, height:s.h,
            top:s.top, left:(s as { left?: string }).left, bottom:(s as { bottom?: string }).bottom,
            right:(s as { right?: string }).right,
            background:s.bg, borderRadius:s.r, pointerEvents:'none' }} />
        ))}

        {/* 카드 */}
        <div style={{
          width: '100%', maxWidth: '520px',
          background: 'rgba(255,255,255,0.98)',
          borderRadius: '24px',
          padding: '40px 40px 36px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
          animation: 'fadeUp 0.4s ease',
          position: 'relative', zIndex: 1,
        }}>
          {/* 로고 */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'28px' }}>
            <div style={{ width:'40px',height:'40px',borderRadius:'12px',background:'linear-gradient(135deg,#818cf8,#4f46e5)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <div style={{ fontSize:'18px', fontWeight:800, color:'#1e1b4b', letterSpacing:'-0.02em' }}>샬레누</div>
              <div style={{ fontSize:'11px', color:'#9ca3af', letterSpacing:'0.04em' }}>교회 초기 설정</div>
            </div>
          </div>

          {/* 진행 바 */}
          <StepBar step={step} />

          {/* 에러 */}
          {error && (
            <div style={{ display:'flex',alignItems:'center',gap:'8px',padding:'11px 14px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',color:'#dc2626',fontSize:'13px',marginBottom:'18px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* ══ 1단계 ══ */}
          {step === 1 && (
            <div style={{ animation:'fadeUp 0.25s ease' }}>
              <h2 style={{ fontSize:'20px',fontWeight:800,color:'#111827',marginBottom:'6px',letterSpacing:'-0.03em' }}>교회 기본 정보</h2>
              <p style={{ fontSize:'13px',color:'#9ca3af',marginBottom:'24px' }}>교회의 기본 정보를 입력해주세요.</p>

              <Field label="교회 이름" required>
                <input className="inp" style={inputSt} value={church.name}
                  onChange={e => setChurch(p => ({ ...p, name: e.target.value }))}
                  placeholder="예: 샬레누 교회" />
              </Field>

              <Field label="교회 주소">
                <div style={{ display:'flex',gap:'8px',marginBottom:'8px' }}>
                  <input className="inp" style={{ ...inputSt, flex:1 }} readOnly value={church.zipCode}
                    placeholder="우편번호" />
                  <button type="button" onClick={openDaumPostcode}
                    style={{ padding:'0 16px',borderRadius:'10px',border:'1.5px solid #4f46e5',background:'#eef2ff',color:'#4f46e5',fontSize:'13px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',transition:'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background='#4f46e5'; (e.currentTarget as HTMLButtonElement).style.color='#fff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background='#eef2ff'; (e.currentTarget as HTMLButtonElement).style.color='#4f46e5'; }}
                  >주소 검색</button>
                </div>
                <input className="inp" style={{ ...inputSt, marginBottom:'8px' }} readOnly value={church.address} placeholder="기본 주소" />
                <input className="inp" style={inputSt} value={church.addressDetail}
                  onChange={e => setChurch(p => ({ ...p, addressDetail: e.target.value }))}
                  placeholder="상세 주소 (동/호수 등)" />
              </Field>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <Field label="전화번호">
                  <input className="inp" style={inputSt} value={church.phone} type="tel"
                    onChange={e => setChurch(p => ({ ...p, phone: phoneFormat(e.target.value) }))}
                    placeholder="02-000-0000" />
                </Field>
                <Field label="설립일">
                  <input className="inp" style={inputSt} type="date" value={church.founded_at}
                    onChange={e => setChurch(p => ({ ...p, founded_at: e.target.value }))} />
                </Field>
              </div>

              <Field label="교단">
                <select className="inp" style={inputSt} value={church.denomination}
                  onChange={e => setChurch(p => ({ ...p, denomination: e.target.value }))}>
                  <option value="">교단 선택 (선택사항)</option>
                  {DENOMINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
            </div>
          )}

          {/* ══ 2단계 ══ */}
          {step === 2 && (
            <div style={{ animation:'fadeUp 0.25s ease' }}>
              <h2 style={{ fontSize:'20px',fontWeight:800,color:'#111827',marginBottom:'6px',letterSpacing:'-0.03em' }}>관리자 계정 설정</h2>
              <p style={{ fontSize:'13px',color:'#9ca3af',marginBottom:'24px' }}>샬레누에 로그인할 관리자 정보를 입력해주세요.</p>

              <Field label="역할">
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px' }}>
                  {ROLES.map(r => (
                    <div key={r.value} className={`role-card${admin.role === r.value ? ' sel' : ''}`}
                      onClick={() => setAdmin(p => ({ ...p, role: r.value }))}>
                      <div style={{ width:'16px',height:'16px',borderRadius:'50%',border:`2px solid ${admin.role === r.value ? '#4f46e5' : '#d1d5db'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s' }}>
                        {admin.role === r.value && <div style={{ width:'8px',height:'8px',borderRadius:'50%',background:'#4f46e5' }} />}
                      </div>
                      <span style={{ fontSize:'13px',fontWeight:admin.role === r.value ? 700 : 500,color:admin.role === r.value ? '#3730a3' : '#374151' }}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </Field>

              <Field label="담당자 이름" required>
                <input className="inp" style={inputSt} value={admin.full_name}
                  onChange={e => setAdmin(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="홍길동" />
              </Field>

              <Field label="이메일 (로그인 ID)" required>
                <input className="inp" style={inputSt} type="email" value={admin.email}
                  onChange={e => setAdmin(p => ({ ...p, email: e.target.value }))}
                  placeholder="admin@church.kr" autoComplete="email" />
              </Field>

              <Field label="비밀번호" required>
                <div style={{ position:'relative' }}>
                  <input className="inp" style={{ ...inputSt, paddingRight:'44px' }}
                    type={showPw ? 'text' : 'password'} value={admin.password}
                    onChange={e => setAdmin(p => ({ ...p, password: e.target.value }))}
                    placeholder="8자 이상" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:0 }}>
                    {showPw
                      ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
                {/* 강도 표시 */}
                {admin.password && (
                  <div style={{ marginTop:'6px',display:'flex',gap:'4px' }}>
                    {[1,2,3,4].map(i => {
                      const len = admin.password.length;
                      const has = /[A-Z]/.test(admin.password) || /[^a-zA-Z0-9]/.test(admin.password);
                      const strength = len < 8 ? 1 : len < 12 && !has ? 2 : len >= 12 && has ? 4 : 3;
                      return <div key={i} style={{ flex:1,height:'3px',borderRadius:'99px',background:i<=strength?['#ef4444','#f59e0b','#10b981','#059669'][strength-1]:'#e5e7eb',transition:'background 0.2s' }} />;
                    })}
                    <span style={{ fontSize:'11px',color:'#6b7280',marginLeft:'4px',flexShrink:0 }}>
                      {['','약함','보통','강함','매우 강함'][Math.min(4, admin.password.length < 8 ? 1 : /[A-Z]/.test(admin.password)||/[^a-zA-Z0-9]/.test(admin.password)?admin.password.length>=12?4:3:2)]}
                    </span>
                  </div>
                )}
              </Field>

              <Field label="비밀번호 확인" required>
                <div style={{ position:'relative' }}>
                  <input className="inp" style={{ ...inputSt, paddingRight:'44px',
                    borderColor: admin.passwordConfirm && admin.password !== admin.passwordConfirm ? '#ef4444' : undefined }}
                    type={showPwC ? 'text' : 'password'} value={admin.passwordConfirm}
                    onChange={e => setAdmin(p => ({ ...p, passwordConfirm: e.target.value }))}
                    placeholder="비밀번호 재입력" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPwC(v => !v)}
                    style={{ position:'absolute',right:'12px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#9ca3af',padding:0 }}>
                    {showPwC
                      ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
                {admin.passwordConfirm && admin.password !== admin.passwordConfirm && (
                  <div style={{ fontSize:'12px',color:'#ef4444',marginTop:'4px' }}>비밀번호가 일치하지 않습니다</div>
                )}
                {admin.passwordConfirm && admin.password === admin.passwordConfirm && (
                  <div style={{ fontSize:'12px',color:'#059669',marginTop:'4px' }}>✓ 비밀번호가 일치합니다</div>
                )}
              </Field>
            </div>
          )}

          {/* ══ 3단계 — 완료 ══ */}
          {step === 3 && (
            <div style={{ textAlign:'center', padding:'20px 0 10px', animation:'fadeUp 0.3s ease' }}>
              {/* 체크 원 */}
              <div style={{
                width:'80px', height:'80px', borderRadius:'50%',
                background:'linear-gradient(135deg,#4f46e5,#6366f1)',
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 20px',
                boxShadow:'0 8px 30px rgba(79,70,229,0.4)',
                animation:'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 style={{ fontSize:'22px',fontWeight:800,color:'#111827',marginBottom:'10px',letterSpacing:'-0.03em' }}>
                설정이 완료되었습니다! 🎉
              </h2>
              <p style={{ fontSize:'14px',color:'#6b7280',lineHeight:'1.7',marginBottom:'8px' }}>
                <strong style={{ color:'#1e1b4b' }}>{church.name}</strong>의<br />
                샬레누 교회 관리 시스템이 준비되었습니다.
              </p>
              <p style={{ fontSize:'13px',color:'#9ca3af',marginBottom:'32px' }}>
                지금 바로 교인을 등록하고 헌금·재정을 관리해보세요.
              </p>
              <button
                onClick={() => router.replace('/dashboard')}
                style={{
                  width: '100%', padding:'14px',
                  borderRadius:'12px', border:'none',
                  background:'linear-gradient(135deg,#4f46e5,#6366f1)',
                  color:'#fff', fontSize:'15px', fontWeight:700,
                  cursor:'pointer', fontFamily:'inherit',
                  boxShadow:'0 6px 20px rgba(79,70,229,0.4)',
                  transition:'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow='0 10px 26px rgba(79,70,229,0.45)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform='none'; (e.currentTarget as HTMLButtonElement).style.boxShadow='0 6px 20px rgba(79,70,229,0.4)'; }}
              >
                샬레누 시작하기 →
              </button>
            </div>
          )}

          {/* ── 이전/다음 버튼 ── */}
          {step < 3 && (
            <div style={{ display:'flex', gap:'10px', marginTop:'28px' }}>
              {step > 1 && (
                <button
                  onClick={goPrev}
                  style={{ flex:1, padding:'13px', borderRadius:'11px', border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='#6366f1'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='#e5e7eb'; }}
                >← 이전</button>
              )}
              <button
                onClick={step === 2 ? handleSubmit : goNext}
                disabled={submitting}
                style={{
                  flex:2, padding:'13px', borderRadius:'11px',
                  border:'none',
                  background: submitting ? '#c7d2fe' : 'linear-gradient(135deg,#4f46e5,#6366f1)',
                  color: submitting ? '#818cf8' : '#fff',
                  fontSize:'14px', fontWeight:700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily:'inherit',
                  boxShadow: submitting ? 'none' : '0 4px 14px rgba(79,70,229,0.35)',
                  transition:'all 0.2s',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                }}
                onMouseEnter={e => { if (!submitting) { (e.currentTarget as HTMLButtonElement).style.opacity='0.9'; (e.currentTarget as HTMLButtonElement).style.transform='translateY(-1px)'; } }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity='1'; (e.currentTarget as HTMLButtonElement).style.transform='none'; }}
              >
                {submitting ? (
                  <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>저장 중...</>
                ) : step === 2 ? '설정 완료' : '다음 →'}
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes popIn { 0%{transform:scale(0)} 60%{transform:scale(1.1)} 100%{transform:scale(1)} }
      `}</style>
    </>
  );
}

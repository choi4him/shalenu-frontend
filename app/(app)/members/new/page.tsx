'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { apiClient } from '@/lib/api';



// ─── 타입 ──────────────────────────────────────────────
interface MemberForm {
  name: string;
  gender: 'M' | 'F' | '';
  birth_date: string;
  phone: string;
  email: string;
  zipcode: string;       // 우편번호
  road_address: string;  // 기본주소 (자동 입력)
  detail_address: string;// 상세주소 (수동 입력)
  registered_date: string;
  baptism_date: string;
  status: 'active' | 'inactive' | 'completed' | 'withdrawn' | '';
}

interface MemberCreated {
  id: number;
  name: string;
}

const INITIAL: MemberForm = {
  name: '',
  gender: '',
  birth_date: '',
  phone: '',
  email: '',
  zipcode: '',
  road_address: '',
  detail_address: '',
  registered_date: new Date().toISOString().slice(0, 10), // 오늘 날짜 기본값
  baptism_date: '',
  status: 'active',
};

// ─── 공통 입력 섹션 타이틀 ─────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '12px', fontWeight: 700, color: '#c9a84c',
      letterSpacing: '0.06em', textTransform: 'uppercase',
      marginBottom: '16px', paddingBottom: '10px',
      borderBottom: '1px solid #ede9fe',
    }}>
      {children}
    </div>
  );
}

// ─── 공통 라벨+입력 레이아웃 ──────────────────────────
function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '10px',
  border: '1.5px solid #e5e7eb',
  fontSize: '14px',
  color: '#1e1e2e',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  boxSizing: 'border-box',
  background: '#fff',
};

// ─── 메인 컴포넌트 ─────────────────────────────────────
export default function MemberNewPage() {
  const router = useRouter();
  const [form, setForm]         = useState<MemberForm>(INITIAL);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [fieldErr, setFieldErr] = useState<Partial<Record<keyof MemberForm, string>>>({});

  const set = (key: keyof MemberForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    if (fieldErr[key]) setFieldErr(prev => ({ ...prev, [key]: '' }));
  };

  // 카카오 우편번호 팝업 오픈
  const openAddressSearch = () => {
    if (!window.daum?.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data) => {
        const road = data.roadAddress || data.jibunAddress || '';
        setForm(prev => ({
          ...prev,
          zipcode: data.zonecode,
          road_address: road,
          detail_address: '',   // 주소 변경 시 상세주소 초기화
        }));
      },
    }).open();
  };

  // 전화번호 자동 포매팅 010-XXXX-XXXX
  const handlePhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 7) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    setForm(prev => ({ ...prev, phone: formatted }));
    if (fieldErr.phone) setFieldErr(prev => ({ ...prev, phone: '' }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof MemberForm, string>> = {};
    if (!form.name.trim()) errs.name = '이름은 필수 항목입니다.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = '유효한 이메일 주소를 입력해주세요.';
    }
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');

    // null 처리: 빈 문자열은 undefined로 전송
    // 주소: 기본주소 + 상세주소 합산
    const combinedAddress = [form.road_address, form.detail_address]
      .map(s => s.trim()).filter(Boolean).join(' ');

    type Payload = Record<string, string | undefined>;
    const payload: Payload = {
      name: form.name.trim(),
      ...(form.gender      ? { gender: form.gender }         : {}),
      ...(form.birth_date  ? { birth_date: form.birth_date } : {}),
      ...(form.phone       ? { phone: form.phone }           : {}),
      ...(form.email       ? { email: form.email }           : {}),
      ...(combinedAddress  ? { address: combinedAddress }    : {}),
      ...(form.registered_date ? { registered_date: form.registered_date } : {}),
      ...(form.baptism_date ? { baptism_date: form.baptism_date }          : {}),
      ...(form.status      ? { status: form.status }         : {}),
    };

    try {
      const created = await apiClient<MemberCreated>('/api/v1/members', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      router.replace(`/members/${created.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const focusStyle = (hasErr: boolean): React.CSSProperties => ({
    borderColor: hasErr ? '#f87171' : '#c9a84c',
    boxShadow: hasErr ? '0 0 0 3px rgba(248,113,113,0.15)' : '0 0 0 3px rgba(201,168,76,0.12)',
  });
  const blurStyle = (hasErr: boolean): React.CSSProperties => ({
    borderColor: hasErr ? '#f87171' : '#e5e7eb',
    boxShadow: hasErr ? '0 0 0 3px rgba(248,113,113,0.15)' : 'none',
  });
  const calcStyle = (key: keyof MemberForm): React.CSSProperties => ({
    ...inputStyle,
    ...(fieldErr[key] ? { borderColor: '#f87171', boxShadow: '0 0 0 3px rgba(248,113,113,0.15)' } : {}),
  });

  return (
    <>
      {/* 카카오 우편번호 스크립트 */}
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
      <style>{`
        .form-input:focus { border-color: #c9a84c !important; box-shadow: 0 0 0 3px rgba(201,168,76,0.12) !important; }
        .form-input.err:focus { border-color: #f87171 !important; box-shadow: 0 0 0 3px rgba(248,113,113,0.15) !important; }
        .radio-group label { cursor: pointer; }
        .radio-group input[type="radio"] { accent-color: #c9a84c; }
        .addr-search-btn:hover { background: #4338ca !important; }
        .addr-readonly { background: #f8fafc !important; color: #6b7280 !important; cursor: default !important; }
      `}</style>

      <div style={{ padding: '36px 40px', maxWidth: '760px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <button
            onClick={() => router.push('/members')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '10px',
              background: '#f1f5f9', border: '1.5px solid #e5e7eb',
              cursor: 'pointer', color: '#374151', flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e0e7ff')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
            title="목록으로"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.04em', margin: '0 0 4px' }}>
              교인 등록
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>
              새 교인 정보를 입력해주세요
            </p>
          </div>
        </div>

        {/* 폼 카드 */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{
            background: '#fff', borderRadius: '20px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            border: '1px solid #f1f5f9', overflow: 'hidden',
          }}>

            {/* 섹션 1: 기본 정보 */}
            <div style={{ padding: '28px 32px', borderBottom: '1px solid #f1f5f9' }}>
              <SectionTitle>기본 정보</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>

                {/* 이름 */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="이름" required>
                    <input
                      className={`form-input${fieldErr.name ? ' err' : ''}`}
                      type="text"
                      placeholder="홍길동"
                      value={form.name}
                      onChange={set('name')}
                      style={calcStyle('name')}
                    />
                    {fieldErr.name && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '2px' }}>{fieldErr.name}</span>}
                  </Field>
                </div>

                {/* 성별 */}
                <Field label="성별">
                  <div className="radio-group" style={{ display: 'flex', gap: '20px', paddingTop: '8px' }}>
                    {[{ val: 'M', label: '남자' }, { val: 'F', label: '여자' }].map(g => (
                      <label key={g.val} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '14px', color: '#374151', fontWeight: 500 }}>
                        <input
                          type="radio"
                          name="gender"
                          value={g.val}
                          checked={form.gender === g.val}
                          onChange={set('gender')}
                          style={{ width: '16px', height: '16px' }}
                        />
                        {g.label}
                      </label>
                    ))}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '14px', color: '#9ca3af', fontWeight: 500 }}>
                      <input
                        type="radio"
                        name="gender"
                        value=""
                        checked={form.gender === ''}
                        onChange={set('gender')}
                        style={{ width: '16px', height: '16px' }}
                      />
                      미입력
                    </label>
                  </div>
                </Field>

                {/* 생년월일 */}
                <Field label="생년월일">
                  <input
                    className="form-input"
                    type="date"
                    value={form.birth_date}
                    onChange={set('birth_date')}
                    style={inputStyle}
                  />
                </Field>

              </div>
            </div>

            {/* 섹션 2: 연락처 */}
            <div style={{ padding: '28px 32px', borderBottom: '1px solid #f1f5f9' }}>
              <SectionTitle>연락처</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>

                {/* 전화번호 */}
                <Field label="전화번호">
                  <input
                    className="form-input"
                    type="tel"
                    placeholder="010-0000-0000"
                    value={form.phone}
                    onChange={handlePhone}
                    style={inputStyle}
                  />
                </Field>

                {/* 이메일 */}
                <Field label="이메일">
                  <input
                    className={`form-input${fieldErr.email ? ' err' : ''}`}
                    type="email"
                    placeholder="example@church.com"
                    value={form.email}
                    onChange={set('email')}
                    style={calcStyle('email')}
                  />
                  {fieldErr.email && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '2px' }}>{fieldErr.email}</span>}
                </Field>

                {/* 주소 — 카카오 우편번호 */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="주소">
                    {/* 우편번호 행 */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        readOnly
                        className="form-input addr-readonly"
                        type="text"
                        placeholder="우편번호"
                        value={form.zipcode}
                        style={{ ...inputStyle, width: '120px', flexShrink: 0, background: '#f8fafc', color: '#6b7280', cursor: 'default' }}
                      />
                      <button
                        type="button"
                        className="addr-search-btn"
                        onClick={openAddressSearch}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '11px 16px', borderRadius: '10px',
                          background: '#c9a84c', border: 'none', color: '#fff',
                          fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                          fontFamily: 'inherit', whiteSpace: 'nowrap',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        주소 검색
                      </button>
                    </div>
                    {/* 기본주소 (자동 입력) */}
                    <input
                      readOnly
                      className="form-input addr-readonly"
                      type="text"
                      placeholder="주소 검색 버튼을 눌러주세요"
                      value={form.road_address}
                      style={{ ...inputStyle, background: '#f8fafc', color: form.road_address ? '#1e1e2e' : '#9ca3af', cursor: 'default' }}
                    />
                    {/* 상세주소 (직접 입력) */}
                    <input
                      className="form-input"
                      type="text"
                      placeholder="동/호수, 건물명 등 상세주소 입력"
                      value={form.detail_address}
                      onChange={e => setForm(prev => ({ ...prev, detail_address: e.target.value }))}
                      disabled={!form.road_address}
                      style={{
                        ...inputStyle,
                        ...(form.road_address ? {} : { background: '#f8fafc', color: '#9ca3af', cursor: 'not-allowed' }),
                      }}
                    />
                  </Field>
                </div>

              </div>
            </div>

            {/* 섹션 3: 교회 정보 */}
            <div style={{ padding: '28px 32px' }}>
              <SectionTitle>교회 정보</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>

                {/* 등록일 */}
                <Field label="등록일">
                  <input
                    className="form-input"
                    type="date"
                    value={form.registered_date}
                    onChange={set('registered_date')}
                    style={inputStyle}
                  />
                </Field>

                {/* 세례일 */}
                <Field label="세례일">
                  <input
                    className="form-input"
                    type="date"
                    value={form.baptism_date}
                    onChange={set('baptism_date')}
                    style={inputStyle}
                  />
                </Field>

                {/* 상태 */}
                <Field label="상태">
                  <select
                    className="form-input"
                    value={form.status}
                    onChange={set('status')}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="">선택 안 함</option>
                    <option value="active">활동중</option>
                    <option value="inactive">휴면</option>
                    <option value="completed">수료</option>
                    <option value="withdrawn">탈퇴</option>
                  </select>
                </Field>

              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '14px 18px', borderRadius: '12px',
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', fontSize: '13px', fontWeight: 500,
              marginTop: '16px',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* 버튼 그룹 */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => router.push('/members')}
              disabled={loading}
              style={{
                padding: '12px 24px', borderRadius: '12px',
                border: '1.5px solid #e5e7eb', background: '#fff',
                color: '#374151', fontSize: '14px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s ease',
                opacity: loading ? 0.5 : 1,
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget.style.borderColor = '#c9a84c'); }}
              onMouseLeave={e => { (e.currentTarget.style.borderColor = '#e5e7eb'); }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 28px', borderRadius: '12px',
                background: loading ? '#f0d88a' : 'linear-gradient(135deg, #c9a84c, #c9a84c)',
                border: 'none',
                color: loading ? '#d4b85c' : '#fff',
                fontSize: '14px', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(201,168,76,0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  저장 중...
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  교인 등록
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

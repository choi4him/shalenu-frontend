'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';

// ─── 타입 ──────────────────────────────────────────────────
interface Facility {
  id:           string;
  name:         string;
  capacity?:    number;
  description?: string;
  is_active:    boolean;
}

// 백엔드 BookingResponse 필드명 그대로 사용
interface Booking {
  id:              string;
  facility_id:     string;
  facility_name?:  string;
  title:           string;
  booked_by:       string;
  booked_by_name?: string;
  start_time:      string; // ISO 8601 datetime
  end_time:        string; // ISO 8601 datetime
  status:          'pending' | 'approved' | 'cancelled';
  note?:           string;
  created_at:      string;
}

function extractList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && 'items' in res && Array.isArray((res as any).items))
    return (res as any).items as T[];
  return [];
}

// datetime 문자열에서 "HH:MM" 추출
function toTimeStr(dtStr: string): string {
  if (!dtStr) return '';
  const d = new Date(dtStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const KO_DAYS   = ['일','월','화','수','목','금','토'];
const KO_MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y: number, m: number)    { return new Date(y, m, 1).getDay(); }

// ─── 상태 설정 ──────────────────────────────────────────────
const STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: '승인대기', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  approved:  { label: '승인',    color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  cancelled: { label: '취소',    color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' },
};

// ─── 예약 신청 모달 ─────────────────────────────────────────
function BookingModal({
  facility,
  facilities,
  onClose,
  onDone,
}: {
  facility:   Facility | null;
  facilities: Facility[];
  onClose:    () => void;
  onDone:     () => void;
}) {
  const [selectedFacId, setSelectedFacId] = useState<string | ''>(facility?.id ?? '');
  const [form, setForm] = useState({
    title:       '',
    booked_date: new Date().toISOString().slice(0, 10),
    start_time:  '09:00',
    end_time:    '10:00',
    note:        '',
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  const save = async () => {
    if (!selectedFacId)       { setErr('시설을 선택해주세요.'); return; }
    if (!form.title.trim())   { setErr('예약 제목을 입력해주세요.'); return; }
    if (form.start_time >= form.end_time) { setErr('종료 시간은 시작 시간 이후여야 합니다.'); return; }
    setSaving(true); setErr('');
    try {
      // 날짜 + 시간을 ISO datetime으로 결합해서 백엔드로 전송
      await apiClient(`/api/v1/facilities/${selectedFacId}/bookings`, {
        method: 'POST',
        body: JSON.stringify({
          title:      form.title,
          start_time: `${form.booked_date}T${form.start_time}:00`,
          end_time:   `${form.booked_date}T${form.end_time}:00`,
          note:       form.note || null,
        }),
      });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '예약 신청에 실패했습니다.');
    } finally { setSaving(false); }
  };

  const inputStyle = { width: '100%', padding: '10px 13px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, color: '#111827' };
  const labelStyle = { fontSize: '11px', fontWeight: 700 as const, color: '#9ca3af', display: 'block' as const, marginBottom: '5px', letterSpacing: '0.04em', textTransform: 'uppercase' as const };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '480px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111827' }}>시설 예약 신청</h3>
          <button onClick={onClose} style={{ border: 'none', background: '#f3f4f6', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {err && <div style={{ padding: '10px 14px', borderRadius: '9px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', fontSize: '13px', marginBottom: '14px', fontWeight: 600 }}>✕ {err}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* 시설 선택 */}
          <div>
            <label style={labelStyle}>시설</label>
            <select value={selectedFacId} onChange={e => setSelectedFacId(e.target.value || '')}
              style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}>
              <option value="">시설을 선택하세요</option>
              {facilities.filter(f => f.is_active).map(f => (
                <option key={f.id} value={f.id}>{f.name}{f.capacity ? ` (수용 ${f.capacity}명)` : ''}</option>
              ))}
            </select>
          </div>

          {/* 예약 제목 */}
          <div>
            <label style={labelStyle}>예약 제목</label>
            <input style={inputStyle} placeholder="예: 청년부 예배, 소그룹 모임" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>

          {/* 날짜 */}
          <div>
            <label style={labelStyle}>날짜</label>
            <input type="date" style={inputStyle} value={form.booked_date}
              onChange={e => setForm(p => ({ ...p, booked_date: e.target.value }))} />
          </div>

          {/* 시간 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle}>시작 시간</label>
              <input type="time" style={inputStyle} value={form.start_time}
                onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>종료 시간</label>
              <input type="time" style={inputStyle} value={form.end_time}
                onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} />
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label style={labelStyle}>사용 목적 / 메모</label>
            <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="사용 목적이나 추가 요청사항을 입력하세요"
              value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
          </div>

          <div style={{ background: '#f0fdf4', borderRadius: '9px', padding: '10px 12px', border: '1px solid #86efac' }}>
            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>ℹ️ 신청 후 관리자 승인이 필요합니다</span>
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
            <button onClick={save} disabled={saving}
              style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: saving ? '#c7d2fe' : 'linear-gradient(135deg,#4f46e5,#6366f1)', color: saving ? '#818cf8' : '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: saving ? 'none' : '0 4px 12px rgba(79,70,229,0.28)' }}>
              {saving ? '신청 중...' : '예약 신청'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 시설 등록 모달 ─────────────────────────────────────────
function FacilityModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ name: '', capacity: '', description: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [err, setErr]    = useState('');
  const inputStyle = { width: '100%', padding: '10px 13px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, color: '#111827' };
  const labelStyle = { fontSize: '11px', fontWeight: 700 as const, color: '#9ca3af', display: 'block' as const, marginBottom: '5px', letterSpacing: '0.04em', textTransform: 'uppercase' as const };

  const save = async () => {
    if (!form.name.trim()) { setErr('시설명을 입력해주세요.'); return; }
    setSaving(true); setErr('');
    try {
      await apiClient('/api/v1/facilities', {
        method: 'POST',
        body: JSON.stringify({ ...form, capacity: form.capacity ? Number(form.capacity) : null }),
      });
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : '등록 실패'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '420px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#111827' }}>시설 등록</h3>
          <button onClick={onClose} style={{ border: 'none', background: '#f3f4f6', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {err && <div style={{ padding: '10px 14px', borderRadius: '9px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', fontSize: '13px', marginBottom: '14px', fontWeight: 600 }}>✕ {err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div><label style={labelStyle}>시설명 *</label><input style={inputStyle} placeholder="예: 본당, 세미나실" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label style={labelStyle}>수용인원</label><input type="number" style={inputStyle} placeholder="인원 수" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} /></div>
          <div><label style={labelStyle}>설명</label><textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} placeholder="시설 설명" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: '9px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
            <button onClick={save} disabled={saving} style={{ padding: '9px 20px', borderRadius: '9px', border: 'none', background: saving ? '#c7d2fe' : '#4f46e5', color: saving ? '#818cf8' : '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{saving ? '등록 중...' : '등록'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ────────────────────────────────────────────
export default function FacilitiesPage() {
  const now = new Date();
  const [facilities,  setFacilities]  = useState<Facility[]>([]);
  const [bookings,    setBookings]    = useState<Booking[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [calYear,     setCalYear]     = useState(now.getFullYear());
  const [calMonth,    setCalMonth]    = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [showBook,    setShowBook]    = useState(false);
  const [bookTarget,  setBookTarget]  = useState<Facility | null>(null);
  const [showFacForm, setShowFacForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [facRes, bkRes] = await Promise.allSettled([
        apiClient<unknown>('/api/v1/facilities'),
        apiClient<unknown>(`/api/v1/facilities/bookings?year=${calYear}&month=${calMonth + 1}&limit=200`),
      ]);
      if (facRes.status === 'fulfilled') setFacilities(extractList<Facility>(facRes.value).filter(f => f.is_active));
      if (bkRes.status  === 'fulfilled') setBookings(extractList<Booking>(bkRes.value));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [calYear, calMonth]);

  useEffect(() => { load(); }, [load]);

  // start_time에서 날짜를 추출해 달력 날짜별로 그룹화
  const bookingsByDay: Record<number, Booking[]> = bookings.reduce((acc, b) => {
    const d = new Date(b.start_time);
    if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
      const day = d.getDate();
      if (!acc[day]) acc[day] = [];
      acc[day].push(b);
    }
    return acc;
  }, {} as Record<number, Booking[]>);

  // 선택된 날짜 예약
  const dayBookings   = selectedDay ? (bookingsByDay[selectedDay] ?? []) : [];
  // 오늘 예약 (같은 연월인 경우만)
  const todayBookings = (calYear === now.getFullYear() && calMonth === now.getMonth())
    ? (bookingsByDay[now.getDate()] ?? [])
    : [];

  // 캘린더
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay    = getFirstDay(calYear, calMonth);

  const FAC_ICONS = ['🏛️','📚','🎵','🌸','⛪','🏠','🎓','🏋️'];

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .fac-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(79,70,229,0.12) !important; border-color:#c7d2fe !important; }
        .cal-day-btn:hover { background:#eef2ff !important; }
        .bk-row:hover { background:#f8faff !important; }
      `}</style>

      <div style={{ padding: '36px 40px', maxWidth: '960px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#111827', letterSpacing: '-0.04em' }}>예약 현황</h1>
            <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#9ca3af' }}>시설을 선택하고 예약을 신청하세요</p>
          </div>
          <button onClick={() => setShowFacForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            시설 등록
          </button>
        </div>

        {/* ════════ 캘린더 ════════ */}
        <div style={{ background: '#fff', borderRadius: '18px', padding: '22px 24px', border: '1px solid #f1f5f9', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
          {/* 월 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '18px', background: 'linear-gradient(#4f46e5,#6366f1)', borderRadius: '99px' }} />
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>월별 예약 캘린더</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => { if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11); } else setCalMonth(m => m-1); }}
                style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827', minWidth: '90px', textAlign: 'center' }}>{calYear}년 {KO_MONTHS[calMonth]}</span>
              <button onClick={() => { if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0); } else setCalMonth(m => m+1); }}
                style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>

          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '4px' }}>
            {KO_DAYS.map((d, i) => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: i === 0 ? '#ef4444' : i === 6 ? '#2563eb' : '#9ca3af', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px' }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day     = i + 1;
              const isToday = calYear === now.getFullYear() && calMonth === now.getMonth() && day === now.getDate();
              const isSel   = selectedDay === day;
              const dayBks  = bookingsByDay[day] ?? [];
              const pendingCount  = dayBks.filter(b => b.status === 'pending').length;
              const approvedCount = dayBks.filter(b => b.status === 'approved').length;
              return (
                <div key={day} className="cal-day-btn"
                  onClick={() => setSelectedDay(isSel ? null : day)}
                  style={{ minHeight: '52px', borderRadius: '9px', padding: '4px 6px', cursor: 'pointer', transition: 'all 0.12s',
                    background: isSel ? '#4f46e5' : isToday ? '#eef2ff' : 'transparent',
                    border: isSel ? '2px solid #4f46e5' : isToday ? '1.5px solid #c7d2fe' : '1.5px solid transparent' }}>
                  <div style={{ fontSize: '12px', fontWeight: isToday || isSel ? 800 : 500, color: isSel ? '#fff' : isToday ? '#4f46e5' : '#374151', marginBottom: '3px' }}>{day}</div>
                  {approvedCount > 0 && <div style={{ fontSize: '9px', fontWeight: 700, padding: '1px 4px', borderRadius: '4px', background: isSel ? 'rgba(255,255,255,0.25)' : '#f0fdf4', color: isSel ? '#fff' : '#16a34a', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>✓ {approvedCount}건</div>}
                  {pendingCount  > 0 && <div style={{ fontSize: '9px', fontWeight: 700, padding: '1px 4px', borderRadius: '4px', background: isSel ? 'rgba(255,255,255,0.25)' : '#fffbeb', color: isSel ? '#fff' : '#d97706', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>⏳ {pendingCount}건</div>}
                </div>
              );
            })}
          </div>

          {/* 선택된 날짜 예약 목록 */}
          {selectedDay && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', animation: 'fadeIn 0.2s' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>
                {calMonth + 1}월 {selectedDay}일 예약 ({dayBookings.length}건)
              </div>
              {dayBookings.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#9ca3af', padding: '8px 0' }}>이 날 예약이 없습니다</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {dayBookings.map(b => {
                    const st = STATUS[b.status] ?? STATUS.pending;
                    const fac = facilities.find(f => f.id === b.facility_id);
                    return (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '9px', background: '#f9fafb', border: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '90px' }}>{toTimeStr(b.start_time)} – {toTimeStr(b.end_time)}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', flex: 1 }}>{b.title}</span>
                        {fac && <span style={{ fontSize: '11px', color: '#9ca3af' }}>{fac.name}</span>}
                        <span style={{ padding: '2px 8px', borderRadius: '10px', background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontSize: '11px', fontWeight: 700 }}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ════════ 시설 카드 ════════ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div style={{ width: '4px', height: '18px', background: 'linear-gradient(#f59e0b,#fcd34d)', borderRadius: '99px' }} />
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>시설 목록</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', fontSize: '14px' }}>불러오는 중...</div>
        ) : facilities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px', background: '#f9fafb', borderRadius: '16px', border: '1.5px dashed #e5e7eb' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏛️</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>등록된 시설이 없습니다</div>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>우측 상단 "시설 등록" 버튼을 눌러 시설을 추가하세요</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '14px', animation: 'fadeIn 0.2s' }}>
            {facilities.map((fac, idx) => {
              const todayFacBk = todayBookings.filter(b => b.facility_id === fac.id);
              const icon       = FAC_ICONS[idx % FAC_ICONS.length];
              return (
                <div key={fac.id} className="fac-card"
                  style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.18s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{icon}</div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{fac.name}</div>
                        {fac.capacity && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>수용 {fac.capacity}명</div>}
                      </div>
                    </div>
                  </div>
                  {fac.description && <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.55, marginBottom: '12px' }}>{fac.description}</div>}

                  {/* 오늘 예약 */}
                  <div style={{ padding: '8px 10px', borderRadius: '8px', background: '#f8fafc', marginBottom: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', marginBottom: '4px' }}>오늘 예약</div>
                    {todayFacBk.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>예약 없음</div>
                    ) : todayFacBk.slice(0, 2).map(b => {
                      const st = STATUS[b.status] ?? STATUS.pending;
                      return (
                        <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151', marginBottom: '2px' }}>
                          <span style={{ color: '#9ca3af' }}>{toTimeStr(b.start_time)}–{toTimeStr(b.end_time)}</span>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</span>
                          <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '6px', background: st.bg, color: st.color, fontWeight: 700 }}>{st.label}</span>
                        </div>
                      );
                    })}
                    {todayFacBk.length > 2 && <div style={{ fontSize: '11px', color: '#9ca3af' }}>+{todayFacBk.length - 2}건 더</div>}
                  </div>

                  <button onClick={() => { setBookTarget(fac); setShowBook(true); }}
                    style={{ width: '100%', padding: '9px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg,#4f46e5,#6366f1)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(79,70,229,0.25)' }}>
                    예약하기
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showBook    && <BookingModal facility={bookTarget} facilities={facilities} onClose={() => setShowBook(false)} onDone={() => { setShowBook(false); load(); }} />}
      {showFacForm && <FacilityModal onClose={() => setShowFacForm(false)} onDone={() => { setShowFacForm(false); load(); }} />}
    </>
  );
}

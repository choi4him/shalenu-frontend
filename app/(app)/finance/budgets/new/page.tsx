'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, formatKRW } from '@/lib/api';

// ─── 타입 ───────────────────────────────────────────────
interface CategoryOption {
  value: string;
  label: string;
}

interface TemplateOption {
  value: string;
  label: string;
}

interface BudgetLine {
  id:             string;
  category:       string;
  description:    string;
  planned_amount: number;
  amountText:     string;
  freeInput:      boolean;  // true = 자유 입력 모드
  templates:      TemplateOption[];
  templatesLoaded: boolean;
}

// ─── 기본 카테고리 (룩업 실패 대비) ─────────────────────
const DEFAULT_CATEGORIES: CategoryOption[] = [
  { value: 'worship',   label: '예배'   },
  { value: 'mission',   label: '선교'   },
  { value: 'education', label: '교육'   },
  { value: 'admin',     label: '행정'   },
  { value: 'facility',  label: '시설'   },
  { value: 'etc',       label: '기타'   },
];

const CATEGORY_ICONS: Record<string, string> = {
  worship:'🕊️', mission:'🌍', education:'📚', admin:'📋', facility:'🏢', etc:'📦',
};

// ─── 유틸 ───────────────────────────────────────────────
let _uid = 0;
const uid = () => `bl_${++_uid}`;

const parseAmount = (v: string) => {
  const n = parseInt(v.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? 0 : n;
};

// ─── 공통 스타일 ─────────────────────────────────────────
const inputSt: React.CSSProperties = {
  width:'100%', padding:'10px 12px', borderRadius:'9px',
  border:'1.5px solid #e5e7eb', fontSize:'14px', color:'#1a1a1a',
  outline:'none', fontFamily:'inherit', boxSizing:'border-box',
  background:'#fff', transition:'border-color 0.2s, box-shadow 0.2s',
};

const labelSt: React.CSSProperties = {
  fontSize:'11px', fontWeight:700, color:'#9ca3af',
  letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:'5px', display:'block',
};

// ─── 작은 아이콘 버튼 ────────────────────────────────────
function IconBtn({
  onClick, title, children, color = '#c9a84c', bg = '#fdf8e8', border = '#f0d88a',
}: {
  onClick: () => void; title: string; children: React.ReactNode;
  color?: string; bg?: string; border?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        display:'flex', alignItems:'center', justifyContent:'center',
        width:'30px', height:'30px', borderRadius:'8px', flexShrink:0,
        border:`1.5px solid ${border}`, background:bg, color, cursor:'pointer',
        transition:'all 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity='0.8'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity='1'; }}
    >{children}</button>
  );
}

// ─── 추가 모달 ──────────────────────────────────────────
function AddModal({
  title, placeholder, onSave, onClose, saving,
}: {
  title: string; placeholder: string;
  onSave: (label: string) => Promise<void>;
  onClose: () => void; saving: boolean;
}) {
  const [val, setVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSave = async () => {
    if (!val.trim()) return;
    await onSave(val.trim());
  };

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', animation:'fadeIn 0.18s' }}
      onClick={() => !saving && onClose()}
    >
      <div
        style={{ background:'#fff', borderRadius:'18px', padding:'28px 28px 22px', width:'360px', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', animation:'popUp 0.2s' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize:'16px', fontWeight:800, color:'#1a1a1a', marginBottom:'18px' }}>{title}</div>
        <input
          ref={inputRef}
          type="text"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !saving) handleSave(); if (e.key === 'Escape') onClose(); }}
          placeholder={placeholder}
          style={{ ...inputSt, marginBottom:'16px' }}
          className="mi-input"
        />
        <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
          <button
            type="button" onClick={onClose} disabled={saving}
            style={{ padding:'9px 16px', borderRadius:'9px', border:'1.5px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity:saving?0.5:1 }}
          >취소</button>
          <button
            type="button" onClick={handleSave} disabled={saving || !val.trim()}
            style={{
              padding:'9px 18px', borderRadius:'9px', border:'none',
              background: (saving || !val.trim()) ? '#f0d88a' : 'linear-gradient(135deg,#c9a84c,#c9a84c)',
              color: (saving || !val.trim()) ? '#d4b85c' : '#fff',
              fontSize:'13px', fontWeight:700, cursor:(saving || !val.trim())?'not-allowed':'pointer',
              fontFamily:'inherit', display:'flex', alignItems:'center', gap:'6px',
            }}
          >
            {saving
              ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>저장 중</>
              : '+ 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 ───────────────────────────────────────────────
export default function BudgetNewPage() {
  const router      = useRouter();
  const currentYear = new Date().getFullYear();

  const [year,       setYear]       = useState(currentYear);
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORIES);
  const [lines,      setLines]      = useState<BudgetLine[]>([
    { id: uid(), category: DEFAULT_CATEGORIES[0].value, description: '', planned_amount: 0, amountText: '', freeInput: false, templates: [], templatesLoaded: false },
  ]);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [newLineId, setNewLineId] = useState<string | null>(null);

  // 모달 상태
  const [catModal,  setCatModal]  = useState(false);
  const [catSaving, setCatSaving] = useState(false);
  // 템플릿 추가 모달 (어떤 라인의 것인지)
  const [tmplModal,   setTmplModal]   = useState<string | null>(null); // lineId
  const [tmplSaving,  setTmplSaving]  = useState(false);

  const scrollBoxRef = useRef<HTMLDivElement>(null);

  // ── 분류 목록 로드 ──
  const loadCategories = useCallback(() => {
    apiClient<CategoryOption[]>('/api/v1/lookup/budget_category')
      .then(data => { if (data?.length) setCategories(data); })
      .catch(() => { /* 기본값 유지 */ });
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  // ── 초기 라인 템플릿 로드 ──
  useEffect(() => {
    lines.forEach(line => {
      if (!line.templatesLoaded) {
        loadTemplates(line.id, line.category);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 템플릿 로드 (분류별) ──
  const loadTemplates = useCallback(async (lineId: string, category: string) => {
    try {
      const data = await apiClient<TemplateOption[]>(
        `/api/v1/lookup/budget_item_template?parent=${category}`
      );
      setLines(prev => prev.map(l =>
        l.id !== lineId ? l : { ...l, templates: data ?? [], templatesLoaded: true }
      ));
    } catch {
      setLines(prev => prev.map(l =>
        l.id !== lineId ? l : { ...l, templates: [], templatesLoaded: true }
      ));
    }
  }, []);

  // ── 분류 변경 시 템플릿 재로딩 ──
  const handleCategoryChange = (lineId: string, category: string) => {
    setLines(prev => prev.map(l =>
      l.id !== lineId ? l : { ...l, category, description: '', templates: [], templatesLoaded: false, freeInput: false }
    ));
    loadTemplates(lineId, category);
  };

  // ── 항목 추가 ──
  const addLine = () => {
    const newId   = uid();
    const defCat  = categories[0]?.value ?? 'etc';
    setNewLineId(newId);
    setLines(prev => [...prev, {
      id: newId, category: defCat, description: '',
      planned_amount: 0, amountText: '', freeInput: false,
      templates: [], templatesLoaded: false,
    }]);
    loadTemplates(newId, defCat);
  };

  // ── 항목 추가 후 스크롤 + 포커스 ──
  useEffect(() => {
    if (!newLineId) return;
    const frame = requestAnimationFrame(() => {
      scrollBoxRef.current?.scrollTo({ top: scrollBoxRef.current.scrollHeight, behavior: 'smooth' });
      document.querySelector<HTMLInputElement>(`[data-lineid="${newLineId}"]`)?.focus();
      setNewLineId(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [newLineId]);

  // ── 항목 삭제 ──
  const removeLine = (id: string) => {
    setLines(prev => prev.filter(l => l.id !== id));
  };

  // ── 필드 변경 ──
  const updateLine = (id: string, field: keyof BudgetLine, value: string | number | boolean | TemplateOption[]) => {
    setLines(prev => prev.map(l => {
      if (l.id !== id) return l;
      if (field === 'amountText') {
        const num = parseAmount(value as string);
        return { ...l, amountText: value as string, planned_amount: num };
      }
      return { ...l, [field]: value };
    }));
  };

  // ── 금액 포매팅 (blur) ──
  const formatAmountOnBlur = (id: string, raw: string) => {
    const num = parseAmount(raw);
    setLines(prev => prev.map(l =>
      l.id !== id ? l : { ...l, planned_amount: num, amountText: num > 0 ? num.toLocaleString('ko-KR') : '' }
    ));
  };

  // ── 분류 추가 저장 ──
  const handleAddCategory = async (label: string) => {
    setCatSaving(true);
    try {
      await apiClient('/api/v1/lookup', {
        method: 'POST',
        body: JSON.stringify({ type: 'budget_category', label }),
      });
      loadCategories();
      setCatModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '분류 추가에 실패했습니다.');
    } finally {
      setCatSaving(false);
    }
  };

  // ── 템플릿 추가 저장 ──
  const handleAddTemplate = async (label: string, lineId: string) => {
    const line = lines.find(l => l.id === lineId);
    if (!line) return;
    setTmplSaving(true);
    try {
      await apiClient('/api/v1/lookup', {
        method: 'POST',
        body: JSON.stringify({ type: 'budget_item_template', parent: line.category, label }),
      });
      // 목록 새로고침 후 방금 추가한 항목 자동 선택
      await loadTemplates(lineId, line.category);
      setLines(prev => prev.map(l => l.id !== lineId ? l : { ...l, description: label }));
      setTmplModal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '템플릿 추가에 실패했습니다.');
    } finally {
      setTmplSaving(false);
    }
  };

  // ── 합계 ──
  const total = lines.reduce((s, l) => s + l.planned_amount, 0);

  // ── 저장 ──
  const handleSave = async () => {
    setError('');
    if (!lines.length) { setError('예산 항목을 최소 1개 추가해주세요.'); return; }
    if (lines.some(l => l.planned_amount <= 0)) { setError('모든 항목의 계획 금액을 입력해주세요.'); return; }

    setSaving(true);
    try {
      await apiClient('/api/v1/finance/budgets', {
        method: 'POST',
        body: JSON.stringify({
          year,
          items: lines.map(l => ({
            category:       l.category,
            description:    l.description || undefined,
            planned_amount: l.planned_amount,
          })),
        }),
      });
      router.push('/finance/budgets');
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // ═══════════════════════════ RENDER ═════════════════════
  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes popUp  { from{opacity:0;transform:scale(0.94) translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes slotIn { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
        .mi-input:focus { border-color:#c9a84c !important; box-shadow:0 0 0 3px rgba(201,168,76,0.12) !important; }
        .line-card { background:#fff;border:1.5px solid #f1f5f9;border-radius:14px;padding:16px 18px;transition:border-color 0.15s;animation:slotIn 0.2s; }
        .line-card:hover { border-color:#e0e7ff; }
        .add-btn { display:inline-flex;align-items:center;gap:7px;padding:11px 18px;border-radius:11px;border:1.5px dashed #f0d88a;background:#f5f7ff;color:#c9a84c;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;width:100%;justify-content:center;transition:all 0.15s; }
        .add-btn:hover { border-color:#c9a84c;background:#fdf8e8; }
        .del-btn { display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;border:1.5px solid #fecaca;background:#fff;color:#dc2626;cursor:pointer;flex-shrink:0;transition:all 0.15s; }
        .del-btn:hover { background:#fef2f2;border-color:#dc2626; }
        .tmpl-select { width:100%;padding:10px 12px;border-radius:9px;border:1.5px solid #e5e7eb;font-size:14px;color:#111827;background:#fff;font-family:inherit;outline:none;cursor:pointer;transition:border-color 0.2s; }
        .tmpl-select:focus { border-color:#c9a84c;box-shadow:0 0 0 3px rgba(201,168,76,0.12); }
        .yr-btn { display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;border:1.5px solid #e5e7eb;background:#fff;cursor:pointer;color:#374151;transition:all 0.15s;font-size:18px; }
        .yr-btn:hover { border-color:#c9a84c;color:#c9a84c; }
        .free-toggle { font-size:11px;color:#c9a84c;background:none;border:none;cursor:pointer;font-family:inherit;font-weight:700;padding:0;text-decoration:underline;white-space:nowrap; }
        .free-toggle:hover { color:#4338ca; }
      `}</style>

      <div style={{ padding:'36px 40px', maxWidth:'820px' }}>

        {/* ── 헤더 ── */}
        <div style={{ display:'flex',alignItems:'center',gap:'14px',marginBottom:'28px' }}>
          <button
            onClick={() => router.push('/finance/budgets')}
            style={{ display:'flex',alignItems:'center',justifyContent:'center',width:'36px',height:'36px',borderRadius:'10px',background:'#f1f5f9',border:'1.5px solid #e5e7eb',cursor:'pointer',color:'#374151',flexShrink:0,transition:'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background='#e0e7ff'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background='#f1f5f9'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <h1 style={{ fontSize:'24px',fontWeight:800,color:'#1a1a1a',letterSpacing:'-0.04em',margin:'0 0 4px' }}>예산 편성</h1>
            <p style={{ margin:0,fontSize:'13px',color:'#9ca3af',fontWeight:500 }}>연도별 항목 예산을 입력하세요</p>
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <div style={{ display:'flex',alignItems:'center',gap:'10px',padding:'13px 16px',borderRadius:'11px',background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:'13px',fontWeight:500,marginBottom:'20px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
            <button onClick={() => setError('')} style={{ marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'#dc2626',fontWeight:700,fontFamily:'inherit',fontSize:'13px' }}>✕</button>
          </div>
        )}

        {/* ── 회계 연도 ── */}
        <div style={{ background:'#fff',borderRadius:'16px',padding:'20px 24px',border:'1px solid #f1f5f9',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',marginBottom:'16px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px' }}>
            <div style={{ width:'4px',height:'18px',background:'linear-gradient(#c9a84c,#c9a84c)',borderRadius:'99px' }} />
            <span style={{ fontSize:'15px',fontWeight:700,color:'#1a1a1a' }}>기본 정보</span>
          </div>
          <div style={{ maxWidth:'210px' }}>
            <label style={labelSt}>회계 연도 <span style={{ color:'#ef4444' }}>*</span></label>
            <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
              <button className="yr-btn" onClick={() => setYear(y => y - 1)}>‹</button>
              <div style={{ ...inputSt,textAlign:'center',fontWeight:800,fontSize:'16px',width:'88px',flex:'none',color:'#7d6324',padding:'9px' }}>{year}년</div>
              <button className="yr-btn" onClick={() => setYear(y => y + 1)}>›</button>
            </div>
          </div>
        </div>

        {/* ── 예산 항목 카드 ── */}
        <div style={{ background:'#fff',borderRadius:'16px',padding:'20px 24px',border:'1px solid #f1f5f9',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',marginBottom:'16px' }}>
          {/* 헤더 */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
              <div style={{ width:'4px',height:'18px',background:'linear-gradient(#c9a84c,#c9a84c)',borderRadius:'99px' }} />
              <span style={{ fontSize:'15px',fontWeight:700,color:'#1a1a1a' }}>예산 항목</span>
              <span style={{ fontSize:'12px',color:'#9ca3af',fontWeight:500 }}>{lines.length}개</span>
            </div>
            {total > 0 && (
              <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
                <span style={{ fontSize:'12px',color:'#6b7280' }}>총 계획</span>
                <span style={{ fontSize:'16px',fontWeight:900,color:'#7d6324',letterSpacing:'-0.02em' }}>{formatKRW(total)}</span>
              </div>
            )}
          </div>

          {/* 스크롤 박스 */}
          <div
            ref={scrollBoxRef}
            style={{ maxHeight:'500px',overflowY:'auto',marginBottom:'12px',paddingRight:'2px',scrollbarWidth:'thin',scrollbarColor:'#f0d88a #f1f5f9' }}
          >
            <div style={{ display:'flex',flexDirection:'column',gap:'10px',paddingBottom:'4px' }}>
              {lines.map((line, idx) => (
                <div key={line.id} className="line-card">
                  {/* 라인 헤더 */}
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:'8px' }}>
                      <div style={{ width:'24px',height:'24px',borderRadius:'7px',background:'linear-gradient(135deg,#fdf8e8,#f0d88a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:800,color:'#c9a84c' }}>
                        {idx + 1}
                      </div>
                      <span style={{ fontSize:'18px' }}>{CATEGORY_ICONS[line.category] ?? '📌'}</span>
                      <span style={{ fontSize:'13px',fontWeight:600,color:'#374151' }}>
                        {categories.find(c => c.value === line.category)?.label ?? line.category}
                      </span>
                    </div>
                    {lines.length > 1 && (
                      <button className="del-btn" onClick={() => removeLine(line.id)} title="항목 삭제">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    )}
                  </div>

                  {/* 3칼럼 그리드 */}
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 2fr 1fr',gap:'10px' }}>

                    {/* ① 분류 */}
                    <div>
                      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'5px' }}>
                        <label style={{ ...labelSt,marginBottom:0 }}>분류 <span style={{ color:'#ef4444' }}>*</span></label>
                        <IconBtn
                          onClick={() => setCatModal(true)}
                          title="새 분류 추가"
                          color="#c9a84c" bg="#fdf8e8" border="#f0d88a"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </IconBtn>
                      </div>
                      <select
                        className="tmpl-select mi-input"
                        value={line.category}
                        onChange={e => handleCategoryChange(line.id, e.target.value)}
                      >
                        {categories.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* ② 항목 설명 */}
                    <div>
                      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'5px' }}>
                        <label style={{ ...labelSt,marginBottom:0 }}>항목 설명</label>
                        <div style={{ display:'flex',alignItems:'center',gap:'6px' }}>
                          {/* 자유 입력 전환 */}
                          <button className="free-toggle" onClick={() => updateLine(line.id, 'freeInput', !line.freeInput)}>
                            {line.freeInput ? '📋 목록 선택' : '✏️ 직접 입력'}
                          </button>
                          {/* 템플릿 추가 */}
                          <IconBtn
                            onClick={() => setTmplModal(line.id)}
                            title="항목 설명 템플릿 추가"
                            color="#059669" bg="#f0fdf4" border="#bbf7d0"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </IconBtn>
                        </div>
                      </div>

                      {/* 드롭다운 or 자유 입력 */}
                      {!line.freeInput ? (
                        !line.templatesLoaded ? (
                          // 로딩 중
                          <div style={{ ...inputSt, color:'#9ca3af', display:'flex', alignItems:'center', gap:'8px' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" style={{ animation:'spin 0.8s linear infinite', flexShrink:0 }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                            <span style={{ fontSize:'13px' }}>목록 불러오는 중...</span>
                          </div>
                        ) : line.templates.length === 0 ? (
                          // 템플릿 없음 → 자동 전환
                          <input
                            className="mi-input"
                            type="text"
                            data-lineid={line.id}
                            value={line.description}
                            onChange={e => updateLine(line.id, 'description', e.target.value)}
                            placeholder="항목 설명 입력 (템플릿 없음)"
                            style={{ ...inputSt, borderStyle:'dashed' }}
                          />
                        ) : (
                          <select
                            className="tmpl-select mi-input"
                            value={line.description}
                            onChange={e => updateLine(line.id, 'description', e.target.value)}
                            data-lineid={line.id}
                          >
                            <option value="">항목 설명 선택...</option>
                            {line.templates.map(t => (
                              <option key={t.value} value={t.label}>{t.label}</option>
                            ))}
                          </select>
                        )
                      ) : (
                        <input
                          className="mi-input"
                          type="text"
                          data-lineid={line.id}
                          value={line.description}
                          onChange={e => updateLine(line.id, 'description', e.target.value)}
                          placeholder="직접 입력..."
                          style={inputSt}
                        />
                      )}
                    </div>

                    {/* ③ 계획 금액 */}
                    <div>
                      <label style={labelSt}>계획 금액 <span style={{ color:'#ef4444' }}>*</span></label>
                      <div style={{ position:'relative' }}>
                        <input
                          className="mi-input"
                          type="text"
                          inputMode="numeric"
                          value={line.amountText}
                          onChange={e => updateLine(line.id, 'amountText', e.target.value)}
                          onBlur={e => formatAmountOnBlur(line.id, e.target.value)}
                          onFocus={e => {
                            updateLine(line.id, 'amountText', line.planned_amount > 0 ? String(line.planned_amount) : '');
                            e.target.select();
                          }}
                          placeholder="0"
                          style={{ ...inputSt, paddingRight:'28px', textAlign:'right' }}
                        />
                        <span style={{ position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',fontSize:'12px',color:'#9ca3af',pointerEvents:'none' }}>원</span>
                      </div>
                      {line.planned_amount > 0 && (
                        <div style={{ fontSize:'11px',color:'#c9a84c',fontWeight:600,marginTop:'3px',textAlign:'right' }}>
                          {formatKRW(line.planned_amount)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* + 항목 추가 버튼 */}
          <button className="add-btn" onClick={addLine}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            항목 추가
          </button>
        </div>

        {/* ── 합계 요약 (sticky) ── */}
        <div style={{
          position:'sticky', bottom:'0', zIndex:10,
          background:'linear-gradient(135deg,#f5f7ff,#fdf8e8)',
          borderRadius:'14px', padding:'14px 22px', border:'1.5px solid #f0d88a',
          marginBottom:'20px', display:'flex', alignItems:'center',
          justifyContent:'space-between', gap:'16px', flexWrap:'wrap',
          boxShadow:'0 -4px 20px rgba(201,168,76,0.1)', backdropFilter:'blur(8px)',
        }}>
          <div>
            <div style={{ fontSize:'11px',fontWeight:700,color:'#c9a84c',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:'3px' }}>총 예산 합계</div>
            <div style={{ fontSize:'26px',fontWeight:900,color:'#7d6324',letterSpacing:'-0.04em' }}>{formatKRW(total)}</div>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:'4px',alignItems:'flex-end',maxHeight:'80px',overflowY:'auto' }}>
            {lines.filter(l => l.planned_amount > 0).map(l => (
              <div key={l.id} style={{ display:'flex',alignItems:'center',gap:'8px',fontSize:'12px' }}>
                <span style={{ color:'#6b7280' }}>
                  {categories.find(c => c.value === l.category)?.label ?? l.category}
                  {l.description ? ` · ${l.description}` : ''}
                </span>
                <span style={{ fontWeight:700,color:'#7d6324' }}>{formatKRW(l.planned_amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 저장/취소 ── */}
        <div style={{ display:'flex',gap:'12px',justifyContent:'flex-end' }}>
          <button
            onClick={() => router.push('/finance/budgets')} disabled={saving}
            style={{ padding:'12px 20px',borderRadius:'11px',border:'1.5px solid #e5e7eb',background:'#fff',color:'#374151',fontSize:'14px',fontWeight:600,cursor:saving?'not-allowed':'pointer',fontFamily:'inherit',opacity:saving?0.5:1 }}
          >취소</button>
          <button
            onClick={handleSave} disabled={saving}
            style={{
              display:'inline-flex',alignItems:'center',gap:'8px',
              padding:'12px 28px',borderRadius:'11px',
              background:saving?'#f0d88a':'linear-gradient(135deg,#c9a84c,#c9a84c)',
              border:'none',color:saving?'#d4b85c':'#fff',
              fontSize:'14px',fontWeight:700,cursor:saving?'not-allowed':'pointer',
              fontFamily:'inherit',boxShadow:saving?'none':'0 4px 14px rgba(201,168,76,0.3)',
            }}
            onMouseEnter={e => { if (!saving) { (e.currentTarget as HTMLButtonElement).style.opacity='0.9'; (e.currentTarget as HTMLButtonElement).style.transform='translateY(-1px)'; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity='1'; (e.currentTarget as HTMLButtonElement).style.transform='none'; }}
          >
            {saving ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation:'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>저장 중...</>
            ) : (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>예산 저장</>
            )}
          </button>
        </div>
      </div>

      {/* ── 분류 추가 모달 ── */}
      {catModal && (
        <AddModal
          title="새 분류 추가"
          placeholder="예: 건축헌금, 구제비..."
          onSave={handleAddCategory}
          onClose={() => !catSaving && setCatModal(false)}
          saving={catSaving}
        />
      )}

      {/* ── 템플릿(항목 설명) 추가 모달 ── */}
      {tmplModal && (
        <AddModal
          title="항목 설명 템플릿 추가"
          placeholder="예: 주일예배 음향 장비, 선교 지원금..."
          onSave={label => handleAddTemplate(label, tmplModal)}
          onClose={() => !tmplSaving && setTmplModal(null)}
          saving={tmplSaving}
        />
      )}
    </>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

// ─── 타입 ──────────────────────────────────────────────────
interface Group { id: number; name: string; }
interface Member { id: number; full_name?: string; name?: string; }
interface MessageRecord {
  id:             number;
  title:          string;
  content:        string;
  message_type:   'sms' | 'email';
  recipient_type: 'all' | 'group' | 'individual';
  status:         'draft' | 'sent' | 'failed' | 'scheduled';
  created_at:     string;
  sent_at?:       string;
  recipient_count?: number;
}

type RecipientType = 'all' | 'group' | 'individual';
type MsgType       = 'sms' | 'email';

interface SelectedRecipient {
  id:    string;
  label: string;
  type:  'all' | 'group' | 'member';
  refId?: number;
}

function extractList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (res && typeof res === 'object' && 'items' in res && Array.isArray((res as any).items))
    return (res as any).items as T[];
  return [];
}

const getMemberName = (m: Member) => m.full_name || m.name || '';

function byteLen(str: string) {
  let b = 0;
  for (const c of str) { b += c.charCodeAt(0) > 127 ? 2 : 1; }
  return b;
}

// ─── 발송 이력 상세 모달 ──────────────────────────────────
function DetailModal({ msg, onClose }: { msg: MessageRecord; onClose: () => void }) {
  const { t } = useTranslation();
  const typeColor = msg.message_type === 'sms'
    ? { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' }
    : { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' };

  const statusLabels = t.messages.statusLabels as Record<string, string>;
  const statusColors: Record<string, { color: string; bg: string }> = {
    draft:     { color: '#9ca3af', bg: '#f9fafb' },
    sent:      { color: '#16a34a', bg: '#f0fdf4' },
    failed:    { color: '#dc2626', bg: '#fef2f2' },
    scheduled: { color: '#d97706', bg: '#fffbeb' },
  };
  const stColor = statusColors[msg.status] ?? statusColors.draft;
  const stLabel = statusLabels[msg.status] ?? msg.status;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '520px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 10px', borderRadius: '12px', background: typeColor.bg, color: typeColor.color, border: `1px solid ${typeColor.border}`, fontSize: '11px', fontWeight: 700 }}>
              {msg.message_type === 'sms' ? t.messages.smsLabel : t.messages.emailLabel}
            </span>
            <span style={{ padding: '3px 10px', borderRadius: '12px', background: stColor.bg, color: stColor.color, fontSize: '11px', fontWeight: 700 }}>
              {stLabel}
            </span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f3f4f6', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {msg.title && <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 800, color: '#1a1a1a' }}>{msg.title}</h3>}
        <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: '#f9fafb', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' }}>
          {msg.content}
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#9ca3af' }}>
          <span>📅 {new Date(msg.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          {msg.recipient_count && <span>👥 {msg.recipient_count}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ────────────────────────────────────────────
export default function MessagesPage() {
  const { t } = useTranslation();
  const [tab,      setTab]      = useState<'compose' | 'history'>('compose');

  const [msgType,       setMsgType]       = useState<MsgType>('sms');
  const [recipientType, setRecipientType] = useState<RecipientType>('all');
  const [recipients,    setRecipients]    = useState<SelectedRecipient[]>([
    { id: 'all', label: t.messages.allMembers, type: 'all' }
  ]);
  const [title,    setTitle]    = useState('');
  const [content,  setContent]  = useState('');
  const [sending,  setSending]  = useState(false);
  const [sendAlert, setSendAlert] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const [groups,       setGroups]       = useState<Group[]>([]);
  const [groupsLoaded, setGroupsLoaded] = useState(false);

  const [memberSearch,  setMemberSearch]  = useState('');
  const [memberResults, setMemberResults] = useState<Member[]>([]);

  const [history,      setHistory]      = useState<MessageRecord[]>([]);
  const [histLoading,  setHistLoading]  = useState(false);
  const [detailMsg,    setDetailMsg]    = useState<MessageRecord | null>(null);

  useEffect(() => {
    if (recipientType !== 'group' || groupsLoaded) return;
    apiClient<unknown>('/api/v1/groups').then(res => {
      setGroups(extractList<Group>(res)); setGroupsLoaded(true);
    }).catch(() => {});
  }, [recipientType, groupsLoaded]);

  useEffect(() => {
    if (!memberSearch.trim()) { setMemberResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await apiClient<unknown>(`/api/v1/members?search=${encodeURIComponent(memberSearch)}&limit=8`);
        setMemberResults(extractList<Member>(res));
      } catch { setMemberResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [memberSearch]);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const res = await apiClient<unknown>('/api/v1/messages?limit=50');
      setHistory(extractList<MessageRecord>(res));
    } catch { setHistory([]); }
    finally { setHistLoading(false); }
  }, []);

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, loadHistory]);

  const changeRecipientType = (type: RecipientType) => {
    setRecipientType(type);
    if (type === 'all') setRecipients([{ id: 'all', label: t.messages.allMembers, type: 'all' }]);
    else setRecipients([]);
    setMemberSearch('');
  };

  const removeRecipient = (id: string) =>
    setRecipients(p => p.filter(r => r.id !== id));

  const toggleGroup = (g: Group) => {
    const existing = recipients.find(r => r.id === `group-${g.id}`);
    if (existing) removeRecipient(`group-${g.id}`);
    else setRecipients(p => [...p, { id: `group-${g.id}`, label: g.name, type: 'group', refId: g.id }]);
  };

  const addMember = (m: Member) => {
    const nm = getMemberName(m);
    if (!recipients.find(r => r.id === `member-${m.id}`))
      setRecipients(p => [...p, { id: `member-${m.id}`, label: nm, type: 'member', refId: m.id }]);
    setMemberSearch(''); setMemberResults([]);
  };

  const send = async (status: 'draft' | 'scheduled') => {
    if (!content.trim()) { setSendAlert({ type: 'err', msg: t.messages.errContent }); return; }
    if (recipients.length === 0) { setSendAlert({ type: 'err', msg: t.messages.errRecipient }); return; }
    setSending(true); setSendAlert(null);
    try {
      const individualIds = recipients.filter(r => r.type === 'member').map(r => r.refId);
      const groupIds      = recipients.filter(r => r.type === 'group').map(r => r.refId);
      await apiClient('/api/v1/messages', {
        method: 'POST',
        body: JSON.stringify({
          title:          title || content.slice(0, 30),
          content,
          message_type:   msgType,
          recipient_type: recipientType,
          recipient_ids:  [...individualIds, ...groupIds].filter(Boolean),
          status,
        }),
      });
      setSendAlert({ type: 'ok', msg: status === 'draft' ? t.messages.draftSaved : t.messages.scheduledSaved });
      if (status !== 'draft') { setContent(''); setTitle(''); }
      setTimeout(() => setSendAlert(null), 3000);
    } catch (e) {
      setSendAlert({ type: 'err', msg: e instanceof Error ? e.message : t.common.saveError });
    } finally { setSending(false); }
  };

  const contentBytes = byteLen(content);
  const SMS_LIMIT    = 90 * 2;
  const bytePercent  = Math.min(100, Math.round(contentBytes / SMS_LIMIT * 100));

  const statusLabels = t.messages.statusLabels as Record<string, string>;
  const statusColors: Record<string, { color: string; bg: string }> = {
    draft:     { color: '#9ca3af', bg: '#f9fafb' },
    sent:      { color: '#16a34a', bg: '#f0fdf4' },
    failed:    { color: '#dc2626', bg: '#fef2f2' },
    scheduled: { color: '#d97706', bg: '#fffbeb' },
  };

  const historyHeaders = t.messages.historyHeaders as string[];

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes slideIn { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:none} }
        .hist-row:hover { background:#f8faff !important; }
        .inp-msg:focus { border-color:#c9a84c !important; box-shadow:0 0 0 3px rgba(201,168,76,0.1); }
      `}</style>

      <div className="page-content" style={{ maxWidth: '800px' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.04em' }}>{t.messages.title}</h1>
          <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#9ca3af' }}>{t.messages.subtitle}</p>
        </div>

        {/* 탭 */}
        <div className="tab-scroll" style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: '#f1f5f9', padding: '4px', borderRadius: '11px', width: 'fit-content' }}>
          {[{ key: 'compose', label: t.messages.composeTab }, { key: 'history', label: t.messages.historyTab }].map(tabItem => (
            <button key={tabItem.key} onClick={() => setTab(tabItem.key as 'compose' | 'history')}
              style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', fontFamily: 'inherit', fontSize: '13px', fontWeight: tab === tabItem.key ? 700 : 500, cursor: 'pointer', background: tab === tabItem.key ? '#fff' : 'transparent', color: tab === tabItem.key ? '#c9a84c' : '#6b7280', boxShadow: tab === tabItem.key ? '0 1px 5px rgba(0,0,0,0.09)' : 'none', transition: 'all 0.15s' }}>
              {tabItem.label}
            </button>
          ))}
        </div>

        {/* ══════ 새 메시지 탭 ══════ */}
        {tab === 'compose' && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            {/* 안내 배너 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fcd34d', marginBottom: '20px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize: '13px', color: '#92400e', fontWeight: 500 }}>
                {t.messages.notice} <strong>{t.messages.noticeStrong}</strong>.
              </span>
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              {/* 알림 */}
              {sendAlert && (
                <div style={{ padding: '10px 14px', borderRadius: '9px', background: sendAlert.type === 'ok' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${sendAlert.type === 'ok' ? '#86efac' : '#fca5a5'}`, color: sendAlert.type === 'ok' ? '#16a34a' : '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: '16px', animation: 'slideIn 0.2s' }}>
                  {sendAlert.type === 'ok' ? '✓' : '✕'} {sendAlert.msg}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                {/* 메시지 유형 */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>{t.messages.msgTypeLabel}</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { key: 'sms',   label: t.messages.smsLabel,   color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
                      { key: 'email', label: t.messages.emailLabel,  color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
                    ].map(msgTypeItem => {
                      const sel = msgType === msgTypeItem.key;
                      return (
                        <button key={msgTypeItem.key} onClick={() => setMsgType(msgTypeItem.key as MsgType)}
                          style={{ padding: '9px 22px', borderRadius: '20px', border: `1.5px solid ${sel ? msgTypeItem.border : '#e5e7eb'}`, background: sel ? msgTypeItem.bg : '#fff', color: sel ? msgTypeItem.color : '#6b7280', fontSize: '13px', fontWeight: sel ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                          {msgTypeItem.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 수신자 선택 */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>{t.messages.recipientLabel}</label>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {[
                      { key: 'all',        label: t.messages.allMembers },
                      { key: 'group',      label: t.messages.byGroup },
                      { key: 'individual', label: t.messages.individual },
                    ].map(rtype => {
                      const sel = recipientType === rtype.key;
                      return (
                        <button key={rtype.key} onClick={() => changeRecipientType(rtype.key as RecipientType)}
                          style={{ padding: '6px 14px', borderRadius: '16px', border: `1.5px solid ${sel ? '#c9a84c' : '#e5e7eb'}`, background: sel ? '#fdf8e8' : '#fff', color: sel ? '#c9a84c' : '#6b7280', fontSize: '12px', fontWeight: sel ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.13s' }}>
                          {rtype.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* 소그룹 선택 */}
                  {recipientType === 'group' && (
                    <div style={{ marginBottom: '10px' }}>
                      {groups.length === 0 && !groupsLoaded ? (
                        <div style={{ fontSize: '12px', color: '#9ca3af', padding: '8px' }}>{t.common.loading}</div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {groups.map(g => {
                            const sel = !!recipients.find(r => r.id === `group-${g.id}`);
                            return (
                              <button key={g.id} onClick={() => toggleGroup(g)}
                                style={{ padding: '5px 12px', borderRadius: '14px', border: `1.5px solid ${sel ? '#c9a84c' : '#e5e7eb'}`, background: sel ? '#c9a84c' : '#f9fafb', color: sel ? '#fff' : '#374151', fontSize: '12px', fontWeight: sel ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.13s' }}>
                                {sel ? '✓ ' : ''}{g.name}
                              </button>
                            );
                          })}
                          {groups.length === 0 && <span style={{ fontSize: '12px', color: '#9ca3af' }}>{t.messages.noGroups}</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 개별 교인 검색 */}
                  {recipientType === 'individual' && (
                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                      <input className="inp-msg"
                        style={{ width: '100%', padding: '10px 13px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1a1a1a' }}
                        placeholder={t.messages.memberSearchPlaceholder} value={memberSearch}
                        onChange={e => setMemberSearch(e.target.value)} />
                      {memberResults.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '9px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginTop: '2px', overflow: 'hidden' }}>
                          {memberResults.map(m => {
                            const nm = getMemberName(m);
                            const already = !!recipients.find(r => r.id === `member-${m.id}`);
                            return (
                              <div key={m.id} onClick={() => !already && addMember(m)}
                                style={{ padding: '10px 14px', cursor: already ? 'not-allowed' : 'pointer', fontSize: '13px', borderBottom: '1px solid #f1f5f9', color: already ? '#9ca3af' : '#111827', background: '#fff' }}
                                onMouseEnter={e => { if (!already) (e.currentTarget as HTMLDivElement).style.background = '#f8faff'; }}
                                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#fff'}>
                                {nm} {already && <span style={{ fontSize: '11px', color: '#9ca3af' }}>{t.messages.alreadyAdded}</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 선택된 수신자 태그 */}
                  {recipients.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {recipients.map(r => (
                        <span key={r.id}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '14px', background: '#fdf8e8', border: '1px solid #f0d88a', color: '#c9a84c', fontSize: '12px', fontWeight: 600 }}>
                          {r.type === 'all' ? '👥' : r.type === 'group' ? '🏠' : '👤'} {r.label}
                          {r.type !== 'all' && (
                            <button onClick={() => removeRecipient(r.id)}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d4b85c', padding: '0', display: 'flex', fontSize: '12px', lineHeight: 1, fontFamily: 'inherit', fontWeight: 700 }}>✕</button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 제목 (이메일만) */}
                {msgType === 'email' && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>{t.messages.subjectLabel}</label>
                    <input className="inp-msg" value={title} onChange={e => setTitle(e.target.value)}
                      placeholder={t.messages.subjectPlaceholder}
                      style={{ width: '100%', padding: '10px 13px', borderRadius: '9px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1a1a1a' }} />
                  </div>
                )}

                {/* 내용 */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{t.messages.contentLabel}</label>
                    {msgType === 'sms' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '60px', height: '4px', borderRadius: '99px', background: '#f1f5f9', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${bytePercent}%`, background: bytePercent >= 100 ? '#ef4444' : bytePercent >= 80 ? '#f59e0b' : '#c9a84c', borderRadius: '99px', transition: 'width 0.2s' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: contentBytes > SMS_LIMIT ? '#ef4444' : '#6b7280' }}>
                          {Math.ceil(contentBytes / 2)} {t.messages.smsCharUnit}
                        </span>
                      </div>
                    )}
                  </div>
                  <textarea className="inp-msg" value={content} onChange={e => setContent(e.target.value)}
                    placeholder={msgType === 'sms' ? t.messages.smsPlaceholder : t.messages.emailContentPlaceholder}
                    style={{ width: '100%', minHeight: msgType === 'sms' ? '120px' : '180px', padding: '12px 14px', borderRadius: '9px', border: `1.5px solid ${contentBytes > SMS_LIMIT ? '#fca5a5' : '#e5e7eb'}`, fontSize: '14px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', color: '#1a1a1a', lineHeight: 1.65 }} />
                  {msgType === 'sms' && contentBytes > SMS_LIMIT && (
                    <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{t.messages.smsLimitWarning}</div>
                  )}
                </div>

                {/* 버튼 */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                  <button onClick={() => send('draft')} disabled={sending}
                    style={{ padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: sending ? 0.6 : 1 }}>
                    {t.messages.saveDraft}
                  </button>
                  <button onClick={() => send('scheduled')} disabled={sending}
                    style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: sending ? '#f0d88a' : 'linear-gradient(135deg,#c9a84c,#c9a84c)', color: sending ? '#d4b85c' : '#fff', fontSize: '13px', fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: sending ? 'none' : '0 4px 12px rgba(201,168,76,0.3)' }}>
                    {sending ? t.messages.processing : t.messages.sendBtn}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════ 발송 이력 탭 ══════ */}
        {tab === 'history' && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 80px 1fr 70px 80px', gap: '0', padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                {historyHeaders.map((h: string) => (
                  <span key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.03em', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>

              {histLoading ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', fontSize: '14px' }}>{t.common.loading}</div>
              ) : history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '56px' }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>📬</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>{t.messages.noHistory}</div>
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>{t.messages.noHistoryHint}</div>
                </div>
              ) : (
                history.map(msg => {
                  const stColor = statusColors[msg.status] ?? statusColors.draft;
                  const stLabel = statusLabels[msg.status] ?? msg.status;
                  const typeLabel = msg.message_type === 'sms' ? t.messages.smsLabel : t.messages.emailLabel;
                  const typeColor = msg.message_type === 'sms' ? '#2563eb' : '#7c3aed';
                  return (
                    <div key={msg.id} className="hist-row" onClick={() => setDetailMsg(msg)}
                      style={{ display: 'grid', gridTemplateColumns: '100px 80px 1fr 70px 80px', gap: '0', padding: '14px 20px', borderBottom: '1px solid #f9fafb', alignItems: 'center', cursor: 'pointer', transition: 'background 0.12s' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {new Date(msg.created_at).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: typeColor }}>{typeLabel}</span>
                      <div style={{ overflow: 'hidden' }}>
                        {msg.title && <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.title}</div>}
                        <div style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.content}</div>
                      </div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{msg.recipient_count ?? '—'}</span>
                      <span style={{ padding: '3px 8px', borderRadius: '10px', background: stColor.bg, color: stColor.color, fontSize: '11px', fontWeight: 700, display: 'inline-block' }}>{stLabel}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {detailMsg && <DetailModal msg={detailMsg} onClose={() => setDetailMsg(null)} />}
    </>
  );
}

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquare,
  X,
  CheckCircle2,
  Check,
  Clock,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import { SharedButton } from '../../../components/shared';

export interface BusinessOwnerCommentItem {
  id: string;
  authorName: string;
  authorInitials: string;
  authorRole: 'Accountable Contact' | 'Supporting Business Contact';
  authorTitle?: string;
  commentText: string;
  commentedAt: string;
  isDone: boolean;
  doneBy?: string;
  doneAt?: string;
}

interface BusinessOwnerCommentsDrawerProps {
  open: boolean;
  onClose: () => void;
  issueTitle?: string;
  issueRef?: string;
  comments: BusinessOwnerCommentItem[];
  onToggleDone: (commentId: string) => void;
  onMarkAllDone?: () => void;
}

export const BusinessOwnerCommentsDrawer: React.FC<BusinessOwnerCommentsDrawerProps> = ({
  open,
  onClose,
  issueTitle,
  issueRef,
  comments,
  onToggleDone,
  onMarkAllDone,
}) => {
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');

  if (!open) return null;

  const openCount = comments.filter((c) => !c.isDone).length;
  const doneCount = comments.filter((c) => c.isDone).length;

  const filteredComments = comments.filter((c) => {
    if (filter === 'open') return !c.isDone;
    if (filter === 'done') return c.isDone;
    return true;
  });

  const drawerContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(15, 23, 42, 0.35)',
        backdropFilter: 'blur(1px)',
        fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '480px',
          maxWidth: '92vw',
          height: '100vh',
          backgroundColor: '#F8FAFC',
          boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderLeft: '1px solid #CBD5E1',
          animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            backgroundColor: '#000099',
            color: '#FFFFFF',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '1px',
              }}
            >
              <MessageSquare size={18} color="#FFFFFF" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                  Business Owner Comments
                </span>
                {openCount > 0 ? (
                  <span
                    style={{
                      backgroundColor: '#eb1700',
                      color: '#FFFFFF',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '1px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    {openCount} Open
                  </span>
                ) : (
                  <span
                    style={{
                      backgroundColor: '#16A34A',
                      color: '#FFFFFF',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '1px 8px',
                      borderRadius: '999px',
                    }}
                  >
                    All Done
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: '11.5px',
                  color: 'rgba(255, 255, 255, 0.82)',
                  marginTop: '3px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={issueTitle}
              >
                {issueRef ? `${issueRef} • ` : ''}
                {issueTitle || 'Issue-Level Business Response & Feedback'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              flexShrink: 0,
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
            title="Close Business Owner Comments"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sub-Header Filter & Bulk Action Bar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {(
              [
                { key: 'all', label: `All (${comments.length})` },
                { key: 'open', label: `Open (${openCount})` },
                { key: 'done', label: `Done (${doneCount})` },
              ] as const
            ).map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: active ? 700 : 500,
                    border: active ? '1px solid #000099' : '1px solid #E2E8F0',
                    backgroundColor: active ? '#EFF6FF' : '#FFFFFF',
                    color: active ? '#000099' : '#64748B',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {openCount > 1 && onMarkAllDone && (
            <button
              type="button"
              onClick={onMarkAllDone}
              style={{
                background: 'none',
                border: 'none',
                color: '#000099',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 6px',
                borderRadius: '4px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EFF6FF')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <CheckCircle2 size={13} />
              <span>Mark All as Done</span>
            </button>
          )}
        </div>

        {/* Comments List Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {filteredComments.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 20px',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px dashed #CBD5E1',
                color: '#64748B',
                fontSize: '12.5px',
              }}
            >
              No comments match the selected filter.
            </div>
          ) : (
            filteredComments.map((item) => {
              const isAccountable = item.authorRole === 'Accountable Contact';
              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: item.isDone ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                    borderLeft: item.isDone
                      ? '3.5px solid #16A34A'
                      : isAccountable
                      ? '3.5px solid #000099'
                      : '3.5px solid #64748B',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Top Row: Who Commented & What Time */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: item.isDone ? '#DCFCE7' : '#EFF6FF',
                          color: item.isDone ? '#166534' : '#000099',
                          border: item.isDone ? '1px solid #86EFAC' : '1px solid #BFDBFE',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {item.authorInitials}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                            {item.authorName}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '1px 7px',
                              borderRadius: '4px',
                              backgroundColor: isAccountable ? '#EFF6FF' : '#F1F5F9',
                              color: isAccountable ? '#000099' : '#475569',
                              border: isAccountable ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                            }}
                          >
                            {item.authorRole}
                          </span>
                        </div>
                        {item.authorTitle && (
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                            {item.authorTitle}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: '#64748B',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                      title="Time commented"
                    >
                      <Clock size={11} style={{ color: '#94A3B8' }} />
                      <span>{item.commentedAt}</span>
                    </div>
                  </div>

                  {/* Middle Row: What Commented */}
                  <div
                    style={{
                      fontSize: '12.5px',
                      lineHeight: 1.55,
                      color: item.isDone ? '#475569' : '#1E293B',
                      backgroundColor: item.isDone ? '#F8FAFC' : '#FAFAFA',
                      border: '1px solid #F1F5F9',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      wordBreak: 'break-word',
                    }}
                  >
                    {item.commentText}
                  </div>

                  {/* Bottom Row: Mark as Done Action / Status */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '4px',
                      borderTop: '1px dashed #E2E8F0',
                      gap: '8px',
                    }}
                  >
                    {item.isDone ? (
                      <>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#166534',
                          }}
                        >
                          <CheckCircle2 size={13} style={{ color: '#16A34A', flexShrink: 0 }} />
                          <span>
                            Marked as Done{item.doneBy ? ` by ${item.doneBy}` : ''}
                            {item.doneAt ? ` • ${item.doneAt}` : ''}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onToggleDone(item.id)}
                          style={{
                            background: 'none',
                            border: '1px solid #CBD5E1',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            color: '#64748B',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Reopen comment"
                        >
                          <RotateCcw size={10} />
                          <span>Reopen</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '11px',
                            color: '#64748B',
                          }}
                        >
                          <UserCheck size={12} style={{ color: '#94A3B8' }} />
                          <span>Awaiting audit review acknowledgement</span>
                        </div>

                        <SharedButton
                          variant="success"
                          size="small"
                          startIcon={<Check size={11} />}
                          onClick={() => onToggleDone(item.id)}
                          style={{
                            minHeight: '26px',
                            padding: '2px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          Mark as Done
                        </SharedButton>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '11.5px', color: '#64748B' }}>
            Showing {filteredComments.length} of {comments.length} business owner comment(s)
          </span>
          <SharedButton variant="secondary" size="small" onClick={onClose}>
            Close
          </SharedButton>
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};


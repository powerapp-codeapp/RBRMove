import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import type { IssueComment } from '../../../types/dataverse.types';
import { MessageSquare, CheckCircle, Send, Lock, X } from 'lucide-react';
import { SharedButton } from '../../../components/shared/buttons/SharedButton';
import { SharedTextArea } from '../../../components/shared/inputs/SharedTextArea';

interface FieldCommentDialogProps {
  open: boolean;
  onClose: () => void;
  fieldKey: string;
  fieldLabel: string;
  comments: IssueComment[];
  currentUserId: string;
  currentUserName?: string;
  onAddComment: (content: string, taggedUserId?: string, taggedUserName?: string) => void;
  onResolveComment: (commentId: string) => void;
}

export const FieldCommentDialog: React.FC<FieldCommentDialogProps> = ({
  open,
  onClose,
  fieldKey,
  fieldLabel,
  comments,
  currentUserId,
  onAddComment,
  onResolveComment,
}) => {
  const [newCommentText, setNewCommentText] = useState('');
  const fieldComments = comments.filter((c) => c.fieldKey === fieldKey);

  const handlePost = () => {
    if (!newCommentText.trim()) return;

    // Detect @mentions e.g. @Marcus or @Sarah
    let taggedName: string | undefined;
    if (newCommentText.includes('@Marcus')) taggedName = 'Marcus Vance';
    if (newCommentText.includes('@Sarah')) taggedName = 'Sarah Jenkins';

    onAddComment(newCommentText.trim(), taggedName ? 'USR-TAGGED' : undefined, taggedName);
    setNewCommentText('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ p: '20px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#f1f4ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #c5dbfc',
              }}
            >
              <MessageSquare size={18} color="#000099" />
            </div>
            <div>
              <h2
                className="type-modal-title"
                style={{
                  fontSize: 'var(--type-modal-title-size, 15px)',
                  fontWeight: 800,
                  color: '#212121',
                  margin: 0,
                  fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                }}
              >
                Comments: {fieldLabel}
              </h2>
              <span
                className="type-caption"
                style={{
                  fontSize: 'var(--type-caption-size, 11px)',
                  color: '#63666a',
                  fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                }}
              >
                Field-level collaboration and review notes
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comments dialog"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#000099';
              e.currentTarget.style.backgroundColor = '#F1F5F9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </DialogTitle>

      <DialogContent sx={{ p: '20px 24px', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Thread of Comments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto' }}>
            {fieldComments.length === 0 ? (
              <div
                className="type-caption"
                style={{
                  textAlign: 'center',
                  padding: '24px 0',
                  color: '#888b8d',
                  fontSize: 'var(--type-table-header-size, 12px)',
                  fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                }}
              >
                No review comments yet on this field. Type below to start discussion or @mention a reviewer.
              </div>
            ) : (
              fieldComments.map((c) => {
                const canResolve = !c.taggedUserId || c.taggedUserId === currentUserId || c.authorId === currentUserId;

                return (
                  <div
                    key={c.commentId}
                    style={{
                      backgroundColor: c.isResolved ? '#f8fafc' : '#ffffff',
                      border: c.isResolved ? '1px solid #e2e8f0' : '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '12px 14px',
                      opacity: c.isResolved ? 0.7 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          className="type-table-row-title"
                          style={{
                            fontSize: 'var(--type-table-header-size, 12px)',
                            fontWeight: 700,
                            color: '#0f172a',
                            fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                          }}
                        >
                          {c.authorName}
                        </span>
                        {c.taggedUserName && (
                          <span
                            className="type-badge"
                            style={{
                              fontSize: 'var(--type-caption-size, 10px)',
                              fontWeight: 700,
                              color: '#000099',
                              backgroundColor: '#f1f4ff',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                            }}
                          >
                            @{c.taggedUserName}
                          </span>
                        )}
                      </div>

                      <span
                        className="type-caption"
                        style={{
                          fontSize: 'var(--type-caption-size, 10px)',
                          color: '#94a3b8',
                          fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                        }}
                      >
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p
                      className="type-body"
                      style={{
                        fontSize: 'var(--type-table-row-size, 12px)',
                        color: '#334155',
                        margin: '0 0 8px 0',
                        lineHeight: '1.5',
                        fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                      }}
                    >
                      {c.content}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      {c.isResolved ? (
                        <span
                          className="type-caption"
                          style={{
                            fontSize: 'var(--type-caption-size, 11px)',
                            color: '#0f8f4d',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                          }}
                        >
                          <CheckCircle size={14} /> Resolved by {c.resolvedByName || 'Reviewer'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!canResolve}
                          onClick={() => onResolveComment(c.commentId)}
                          style={{
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: canResolve ? '#000099' : '#94a3b8',
                            fontSize: 'var(--type-caption-size, 11px)',
                            fontWeight: 700,
                            cursor: canResolve ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (canResolve) e.currentTarget.style.backgroundColor = '#EFF6FF';
                          }}
                          onMouseLeave={(e) => {
                            if (canResolve) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title={!canResolve ? 'Only tagged user or comment author can resolve this thread' : undefined}
                        >
                          {!canResolve && <Lock size={12} />}
                          <span>Mark as Resolved</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* New Comment Input */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <SharedTextArea
              label="Add Comment or Review Note"
              value={newCommentText}
              onChange={setNewCommentText}
              placeholder="Provide constructive review comments. Use @Marcus or @Sarah to tag..."
              rows={2}
            />
          </div>
        </div>
      </DialogContent>

      <DialogActions sx={{ p: '14px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <SharedButton variant="outline" size="small" onClick={onClose}>
          Close
        </SharedButton>
        <SharedButton
          variant="primary"
          size="small"
          startIcon={<Send size={14} />}
          onClick={handlePost}
          disabled={!newCommentText.trim()}
        >
          Post Comment
        </SharedButton>
      </DialogActions>
    </Dialog>
  );
};

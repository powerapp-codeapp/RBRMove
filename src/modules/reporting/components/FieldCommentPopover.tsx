import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquare,
  X,
  Send,
  CheckCircle2,
  Lock,
  Tag,
  Check,
  ChevronDown,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-react';
import type { IssueComment } from '../../../types/dataverse.types';
import { SharedButton, SharedTooltip } from '../../../components/shared';

export interface CommentUser {
  userId: string;
  name: string;
  role?: string;
  avatar?: string;
  avatarBg?: string;
}

interface FieldCommentPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  targetType?: string;
  engagementId: string;
  fieldKey: string;
  fieldLabel: string;
  comments: IssueComment[];
  currentUser: CommentUser;
  availableUsers?: CommentUser[];
  placement?: 'up' | 'down';
  onAddComment: (text: string, taggedUser?: CommentUser) => void;
  onResolveComment: (commentId: string) => void;
}

export const FieldCommentPopover: React.FC<FieldCommentPopoverProps> = ({
  isOpen,
  onClose,
  fieldKey: _fieldKey,
  fieldLabel,
  comments = [],
  currentUser,
  availableUsers = [],
  placement = 'down',
  onAddComment,
  onResolveComment,
}) => {
  const [commentText, setCommentText] = useState('');
  const [selectedTaggedUser, setSelectedTaggedUser] = useState<CommentUser | null>(null);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [isDrawerMode, setIsDrawerMode] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close tag dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Group available users by role categories with clean names
  const groupedUsers = useMemo(() => {
    const groups: { groupName: string; users: CommentUser[] }[] = [
      { groupName: 'Audit Team', users: [] },
      { groupName: 'Audit Leadership', users: [] },
      { groupName: 'Business Stakeholders', users: [] },
      { groupName: 'Other Assignees', users: [] },
    ];

    availableUsers.forEach((u) => {
      const role = (u.role || '').toLowerCase();
      if (role.includes('vp') || role.includes('director')) {
        groups[1].users.push(u);
      } else if (
        role.includes('business') ||
        role.includes('owner') ||
        role.includes('controller') ||
        role.includes('finops')
      ) {
        groups[2].users.push(u);
      } else if (
        role.includes('auditor') ||
        role.includes('manager') ||
        role.includes('coordinator') ||
        role.includes('tc') ||
        role.includes('contributor') ||
        role.includes('it')
      ) {
        groups[0].users.push(u);
      } else {
        groups[3].users.push(u);
      }
    });

    return groups.filter((g) => g.users.length > 0);
  }, [availableUsers]);

  if (!isOpen) return null;

  const handlePost = () => {
    if (!commentText.trim()) return;
    onAddComment(commentText.trim(), selectedTaggedUser || undefined);
    setCommentText('');
    setSelectedTaggedUser(null);
    setIsTagDropdownOpen(false);
  };

  const unresolvedCount = comments.filter((c) => !c.isResolved).length;

  const renderInnerContent = () => (
    <>
      {/* Popover / Drawer Header */}
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: '#0F172A',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, marginRight: '8px' }}>
          <MessageSquare style={{ width: '13px', height: '13px', color: '#60A5FA', flexShrink: 0 }} />
          <SharedTooltip title={fieldLabel} placement="top">
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                letterSpacing: '0.1px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {fieldLabel}
            </span>
          </SharedTooltip>
          {unresolvedCount > 0 && (
            <span
              style={{
                backgroundColor: '#DC2626',
                color: '#ffffff',
                fontSize: '9.5px',
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: '8px',
                flexShrink: 0,
              }}
            >
              {unresolvedCount} Open
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {/* Pop-out / Dock button */}
          <SharedTooltip
            title={isDrawerMode ? 'Dock back to field popover' : 'Open in side drawer'}
            placement="top"
          >
            <button
              type="button"
              onClick={() => setIsDrawerMode(!isDrawerMode)}
              aria-label={isDrawerMode ? 'Dock to field popover' : 'Pop out to side drawer'}
              style={{
                border: 'none',
                background: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '3px',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              {isDrawerMode ? (
                <PanelRightClose style={{ width: '14px', height: '14px' }} />
              ) : (
                <PanelRightOpen style={{ width: '14px', height: '14px' }} />
              )}
            </button>
          </SharedTooltip>

          {/* Close button */}
          <SharedTooltip title="Close" placement="top">
            <button
              type="button"
              onClick={() => {
                setIsDrawerMode(false);
                onClose();
              }}
              aria-label="Close Popover"
              style={{
                border: 'none',
                background: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '3px',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          </SharedTooltip>
        </div>
      </div>

      {/* Comments List */}
      <div
        className="slim-light-scrollbar"
        style={{
          maxHeight: isDrawerMode ? 'none' : '260px',
          flex: isDrawerMode ? 1 : 'unset',
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: '#F8FAFC',
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 transparent',
        }}
      >
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: isDrawerMode ? '48px 12px' : '24px 8px', color: '#94A3B8', fontSize: '11px' }}>
            No comments yet on this field.
            <br />
            Tag a team member or leave a review note below!
          </div>
        ) : (
          comments.map((c) => {
            const isTaggedToCurrentUser =
              c.taggedUserId && (c.taggedUserId === currentUser.userId || c.taggedUserName === currentUser.name);
            const canResolve = !c.taggedUserId || isTaggedToCurrentUser;

            return (
              <div
                key={c.commentId}
                style={{
                  backgroundColor: c.isResolved ? '#F0FDF4' : '#ffffff',
                  border: c.isResolved ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                  borderRadius: '6px',
                  padding: '9px 11px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                {/* Author & Header: Row 1 = Name, Row 2 = Role + Date/Time */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', lineHeight: 1.25 }}>
                    {c.authorName || 'Reviewer'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>Audit Contributor</span>
                    <span style={{ color: '#CBD5E1' }}>•</span>
                    <span>
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) +
                          ', ' +
                          new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Recently'}
                    </span>
                  </div>
                </div>

                {/* Tagged User Pill */}
                {c.taggedUserName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 500,
                        color: '#4338CA',
                        backgroundColor: '#EEF2FF',
                        border: '1px solid #C7D2FE',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Tag style={{ width: '9px', height: '9px', color: '#6366F1' }} />
                      <span>Assigned to @{c.taggedUserName}</span>
                    </span>
                  </div>
                )}

                {/* Comment Text */}
                <p
                  style={{
                    fontSize: '11.5px',
                    color: '#1E293B',
                    margin: '2px 0 0 0',
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                  }}
                >
                  {c.content}
                </p>

                {/* Resolution Footer Row */}
                <div
                  style={{
                    marginTop: '3px',
                    paddingTop: '5px',
                    borderTop: '1px dashed #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  {c.isResolved ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#166534', fontSize: '10.5px', fontWeight: 600 }}>
                      <CheckCircle2 style={{ width: '12px', height: '12px', color: '#166534' }} />
                      <span>Resolved by {c.resolvedByName || 'Reviewer'}</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      {c.taggedUserName && !canResolve ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#B45309', fontSize: '10px' }}>
                          <Lock style={{ width: '10px', height: '10px' }} />
                          <span>Requires @{c.taggedUserName} to resolve</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '10px', color: '#64748B' }}>
                          {c.taggedUserName ? 'You are assigned' : 'Generic thread (anyone can resolve)'}
                        </div>
                      )}

                      <SharedTooltip
                        title={canResolve ? 'Click to mark this comment as done' : `Only @${c.taggedUserName} can resolve`}
                        placement="top"
                      >
                        <SharedButton
                          variant={canResolve ? 'success' : 'secondary'}
                          size="small"
                          disabled={!canResolve}
                          onClick={() => onResolveComment(c.commentId)}
                          startIcon={<Check style={{ width: '10px', height: '10px' }} />}
                          style={{
                            padding: '2px 8px',
                            minHeight: '24px',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            backgroundColor: canResolve ? '#16A34A' : '#E2E8F0',
                            color: canResolve ? '#FFFFFF' : '#94A3B8',
                            border: canResolve ? '1px solid #15803D' : '1px solid #CBD5E1',
                            borderRadius: '4px',
                          }}
                        >
                          Mark Done
                        </SharedButton>
                      </SharedTooltip>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Comment Box */}
      <div
        style={{
          padding: '10px 12px',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '7px',
        }}
      >
        {/* Tag Picker Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }} ref={tagDropdownRef}>
          {selectedTaggedUser ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#EEF2FF',
                border: '1px solid #C7D2FE',
                borderRadius: '4px',
                padding: '1px 6px',
                fontSize: '10.5px',
                color: '#3730A3',
                fontWeight: 600,
              }}
            >
              <Tag style={{ width: '10px', height: '10px', color: '#6366F1' }} />
              <span>Tagging: @{selectedTaggedUser.name}</span>
              <button
                type="button"
                onClick={() => setSelectedTaggedUser(null)}
                aria-label="Remove tagged user"
                style={{ border: 'none', background: 'none', color: '#6366F1', cursor: 'pointer', padding: '0 2px', fontSize: '13px', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          ) : (
            <SharedButton
              variant="secondary"
              size="small"
              onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
              startIcon={<Tag style={{ width: '10px', height: '10px', color: '#64748B' }} />}
              endIcon={<ChevronDown style={{ width: '10px', height: '10px' }} />}
              style={{
                fontSize: '10.5px',
                padding: '2px 7px',
                minHeight: '24px',
                fontWeight: 500,
              }}
            >
              @Tag a Person (Strict Resolution)
            </SharedButton>
          )}

          {/* Tag Dropdown Menu (Grouped with clean names only) */}
          {isTagDropdownOpen && availableUsers.length > 0 && (
            <div
              className="slim-light-scrollbar"
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 4px)',
                left: 0,
                width: '230px',
                backgroundColor: '#ffffff',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                zIndex: 600,
                maxHeight: '220px',
                overflowY: 'auto',
                padding: '3px 0',
                scrollbarWidth: 'thin',
                scrollbarColor: '#CBD5E1 transparent',
              }}
            >
              {groupedUsers.map((group) => (
                <div key={group.groupName}>
                  <div
                    style={{
                      padding: '4px 10px 2px 10px',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      backgroundColor: '#F8FAFC',
                      borderTop: '1px solid #F1F5F9',
                      borderBottom: '1px solid #F1F5F9',
                    }}
                  >
                    {group.groupName}
                  </div>
                  {group.users.map((u) => (
                    <button
                      key={u.userId}
                      type="button"
                      onClick={() => {
                        setSelectedTaggedUser(u);
                        setIsTagDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '4px 12px',
                        border: 'none',
                        background: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#1E293B',
                        display: 'block',
                        transition: 'background-color 0.1s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#EEF2FF';
                        e.currentTarget.style.color = '#000099';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#1E293B';
                      }}
                    >
                      {u.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Text Input with Send Button */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <textarea
              className="slim-light-scrollbar"
              rows={isDrawerMode ? 3 : 2}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handlePost();
                }
              }}
              placeholder={
                selectedTaggedUser
                  ? `Write note for @${selectedTaggedUser.name}...`
                  : 'Add a comment or observation... (Ctrl+Enter)'
              }
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '6px 8px',
                fontSize: '11.5px',
                fontWeight: 400,
                lineHeight: 1.4,
                color: '#1E293B',
                backgroundColor: '#ffffff',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                display: 'block',
                transition: 'border-color 0.15s ease',
                scrollbarWidth: 'thin',
                scrollbarColor: '#CBD5E1 transparent',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#000099')}
              onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
            />
          </div>
          <SharedTooltip title="Post comment (Ctrl+Enter)" placement="top">
            <SharedButton
              variant="primary"
              size="small"
              onClick={handlePost}
              disabled={!commentText.trim()}
              aria-label="Post comment"
              style={{
                height: isDrawerMode ? '60px' : '44px',
                padding: '0 10px',
                minWidth: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send style={{ width: '12px', height: '12px' }} />
            </SharedButton>
          </SharedTooltip>
        </div>
      </div>
    </>
  );

  // When in Drawer Mode, render directly to document.body via Portal starting at top: 0
  // so it sits entirely on top of the global header and page title bar!
  if (isDrawerMode) {
    return createPortal(
      <div
        ref={popoverRef}
        className="slim-light-scrollbar"
        data-field-comment-drawer="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          right: 0,
          width: '390px',
          maxWidth: '92vw',
          backgroundColor: '#ffffff',
          borderLeft: '1px solid #CBD5E1',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.18)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          textAlign: 'left',
          animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {renderInnerContent()}
      </div>,
      document.body
    );
  }

  // Normal in-situ popover mode
  return (
    <div
      ref={popoverRef}
      className="slim-light-scrollbar"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: placement === 'up' ? 'auto' : 'calc(100% + 6px)',
        bottom: placement === 'up' ? 'calc(100% + 6px)' : 'auto',
        right: 0,
        width: '360px',
        maxWidth: '92vw',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #CBD5E1',
        boxShadow: '0 16px 36px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.06)',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        textAlign: 'left',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      {renderInnerContent()}
    </div>
  );
};

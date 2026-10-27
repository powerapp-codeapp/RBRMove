import React, { useState, useEffect, useMemo } from 'react';
import { Send, X, CheckCircle2 } from 'lucide-react';
import type { Issue } from '../../../types/dataverse.types';
import { SharedButton } from '../../../components/shared/buttons/SharedButton';
import { SharedTextArea } from '../../../components/shared/inputs/SharedTextArea';
import { deriveTargetStatusForRole } from '../../../services/dataverseReportingService';

export interface AssignedTeamMember {
  id?: string;
  userId?: string;
  name: string;
  displayName?: string;
  email?: string;
  initials?: string;
  roleId?: string;
  roleName?: string;
  roleAbbr?: string;
}

interface SendToModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  assignedUsers?: AssignedTeamMember[];
  currentUser?: { name?: string; role?: string; email?: string; userId?: string };
  onConfirmSendTo: (issueId: string, recipient: AssignedTeamMember, remarks: string) => Promise<void> | void;
}

export const SendToModal: React.FC<SendToModalProps> = ({
  isOpen,
  onClose,
  issue,
  assignedUsers = [],
  currentUser,
  onConfirmSendTo,
}) => {
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fallback roster if engagement has no populated assignees
  const defaultRoster: AssignedTeamMember[] = useMemo(() => [
    {
      id: 'USR-001',
      userId: 'USR-001',
      name: 'Tamilselvan Natarajan',
      displayName: 'Tamilselvan',
      email: 'tamil@conversedatasolution.onmicrosoft.com',
      roleId: 'it-auditor',
      roleName: 'Staff Auditor',
      roleAbbr: 'IT AUD',
      initials: 'TN'
    },
    {
      id: 'USR-002',
      userId: 'USR-002',
      name: 'Gowri P',
      displayName: 'Gowri P',
      email: 'gowrip@conversedatasolution.onmicrosoft.com',
      roleId: 'team-coordinator',
      roleName: 'Team Coordinator',
      roleAbbr: 'TC',
      initials: 'GP'
    },
    {
      id: 'USR-003',
      userId: 'USR-003',
      name: 'Amanda Palmer',
      displayName: 'Amanda Palmer',
      email: 'amanda.palmer@jnj.com',
      roleId: 'it-manager',
      roleName: 'Audit Manager',
      roleAbbr: 'IT MGR',
      initials: 'AP'
    },
    {
      id: 'USR-004',
      userId: 'USR-004',
      name: 'Marcus Vance',
      displayName: 'Marcus Vance',
      email: 'marcus.vance@jnj.com',
      roleId: 'director',
      roleName: 'Audit Director',
      roleAbbr: 'IT DIR',
      initials: 'MV'
    }
  ], []);

  // Compute available peers (only users assigned to this engagement)
  const peerList = useMemo(() => {
    const source = (Array.isArray(assignedUsers) && assignedUsers.length > 0)
      ? assignedUsers
      : defaultRoster;

    const currentEmail = (currentUser?.email || '').toLowerCase().trim();
    const currentName = (currentUser?.name || '').toLowerCase().trim();
    const currentId = (currentUser?.userId || '').toLowerCase().trim();

    return source.map((u) => {
      const uEmail = (u.email || '').toLowerCase().trim();
      const uName = (u.displayName || u.name || '').toLowerCase().trim();
      const uId = (u.id || u.userId || '').toLowerCase().trim();

      const isCurrent = Boolean(
        (currentEmail && uEmail && currentEmail === uEmail) ||
        (currentId && uId && currentId === uId) ||
        (currentName && uName && (currentName === uName || currentName.includes(uName.split(' ')[0])))
      );

      const targetInfo = deriveTargetStatusForRole(u.roleName || u.roleId);

      return {
        ...u,
        isCurrent,
        targetStatus: targetInfo.statusText,
      };
    });
  }, [assignedUsers, defaultRoster, currentUser]);

  useEffect(() => {
    if (isOpen) {
      setRemarks('');
      setError('');
      setIsSubmitting(false);

      // Auto-select first non-current peer
      const firstAvailable = peerList.find(p => !p.isCurrent);
      if (firstAvailable) {
        setSelectedRecipientId(firstAvailable.id || firstAvailable.userId || firstAvailable.email || '');
      } else {
        setSelectedRecipientId('');
      }
    }
  }, [isOpen, peerList]);

  if (!isOpen || !issue) return null;

  const selectedPeer = peerList.find(
    p => (p.id && p.id === selectedRecipientId) || (p.userId && p.userId === selectedRecipientId) || (p.email && p.email === selectedRecipientId)
  );

  const handleConfirm = async () => {
    if (!selectedPeer) {
      setError('Please select an engagement peer to route this issue to.');
      return;
    }
    if (!remarks.trim()) {
      setError('Please enter mandatory handover instructions / remarks.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmSendTo(issue.id, selectedPeer, remarks.trim());
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to send issue to peer reviewer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          maxWidth: '580px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          border: '1px solid #D8D8D8',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000099',
                flexShrink: 0,
              }}
            >
              <Send style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h3
                className="type-modal-title"
                style={{
                  margin: 0,
                  fontSize: 'var(--type-modal-title-size, 15px)',
                  fontWeight: 800,
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Send To Peer Reviewer
                <span
                  className="type-badge"
                  style={{
                    fontSize: 'var(--type-badge-size, 11px)',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#EFF6FF',
                    color: '#000099',
                    border: '1px solid #BFDBFE',
                  }}
                >
                  {issue.testProcedureCode || issue.id}
                </span>
              </h3>
              <p className="type-caption" style={{ margin: '2px 0 0', fontSize: 'var(--type-caption-size, 11.5px)', color: '#64748B' }}>
                Hand over active finding review to another assigned team member on this audit engagement.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Send To dialog"
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
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
              e.currentTarget.style.backgroundColor = '#E2E8F0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94A3B8';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Close"
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Finding Context Card */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                Current Finding
              </div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {issue.title || 'Untitled Finding'}
              </div>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                Current Status
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#92400E',
                  backgroundColor: '#FEF3C7',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid #FDE68A',
                  display: 'inline-block',
                }}
              >
                {issue.status || 'In Review'}
              </span>
            </div>
          </div>

          {/* Assigned Engagement Peers Selection */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Select Recipient (Assigned to Engagement) *
              </label>
              <span style={{ fontSize: '11px', color: '#64748B' }}>
                {peerList.length} Team Members
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {peerList.map((peer) => {
                const pKey = peer.id || peer.userId || peer.email || peer.name;
                const isSelected = selectedRecipientId === pKey;
                const isCurrent = peer.isCurrent;

                return (
                  <div
                    key={pKey}
                    onClick={() => {
                      if (!isCurrent) {
                        setSelectedRecipientId(pKey);
                        if (error) setError('');
                      }
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: isSelected ? '1.5px solid #000099' : '1px solid #E2E8F0',
                      backgroundColor: isSelected ? '#EFF6FF' : isCurrent ? '#F8FAFC' : '#FFFFFF',
                      cursor: isCurrent ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      transition: 'all 0.15s ease',
                      opacity: isCurrent ? 0.6 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      {/* Avatar */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? '#000099' : '#E2E8F0',
                          color: isSelected ? '#FFFFFF' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {peer.initials || peer.name.slice(0, 2).toUpperCase()}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                            {peer.displayName || peer.name}
                          </span>
                          {isCurrent && (
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', backgroundColor: '#E2E8F0', padding: '1px 6px', borderRadius: '4px' }}>
                              You
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#E0E7FF',
                              color: '#3730A3',
                            }}
                          >
                            {peer.roleName || peer.roleAbbr || 'Auditor'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {peer.email || 'No email registered'}
                        </div>
                      </div>
                    </div>

                    {/* Destination Transition Preview Badge */}
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '9.5px', color: '#64748B' }}>Target Review Stage</div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#000099',
                            backgroundColor: isSelected ? '#DBEAFE' : '#F1F5F9',
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          {peer.targetStatus}
                        </span>
                      </div>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: isSelected ? '5px solid #000099' : '1.5px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Handover Transition Summary */}
          {selectedPeer && (
            <div
              style={{
                backgroundColor: '#EFF6FF',
                borderRadius: '6px',
                border: '1px solid #BFDBFE',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11.5px',
                color: '#1E3A8A',
              }}
            >
              <CheckCircle2 size={16} color="#000099" style={{ flexShrink: 0 }} />
              <div>
                Routing finding to <strong>{selectedPeer.displayName || selectedPeer.name}</strong> ({selectedPeer.roleName}).
                Issue status will automatically transition from <strong>{issue.status}</strong> to <strong>{selectedPeer.targetStatus}</strong>.
              </div>
            </div>
          )}

          {/* Mandatory Remarks */}
          <SharedTextArea
            label="Handover Notes & Instructions"
            required
            value={remarks}
            onChange={(val) => {
              setRemarks(val);
              if (error) setError('');
            }}
            placeholder="Enter instructions, notes on current review state, or specific sections the peer should examine..."
            rows={4}
            error={Boolean(error)}
            errorMessage={error || undefined}
            disabled={isSubmitting}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <SharedButton
            variant="outline"
            size="small"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </SharedButton>
          <SharedButton
            variant="primary"
            size="small"
            startIcon={<Send size={13} />}
            onClick={handleConfirm}
            disabled={isSubmitting || !selectedPeer}
          >
            {isSubmitting ? 'Routing...' : 'Confirm & Send'}
          </SharedButton>
        </div>
      </div>
    </div>
  );
};

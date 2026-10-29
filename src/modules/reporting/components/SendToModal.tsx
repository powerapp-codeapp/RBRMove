import React, { useState, useEffect, useMemo } from 'react';
import { Send } from 'lucide-react';
import type { Issue } from '../../../types/dataverse.types';
import { SharedButton } from '../../../components/shared/buttons/SharedButton';
import { SharedTextArea } from '../../../components/shared/inputs/SharedTextArea';
import { SharedRecipientSelect } from '../../../components/shared/inputs/SharedRecipientSelect';
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

  // Compute available peers (only users assigned to this engagement, excluding the logged-in user)
  const peerList = useMemo(() => {
    const source = (Array.isArray(assignedUsers) && assignedUsers.length > 0)
      ? assignedUsers
      : defaultRoster;

    const currentEmail = (currentUser?.email || '').toLowerCase().trim();
    const currentName = (currentUser?.name || '').toLowerCase().trim();
    const currentId = (currentUser?.userId || '').toLowerCase().trim();

    return source
      .map((u) => {
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
      })
      .filter((u) => !u.isCurrent);
  }, [assignedUsers, defaultRoster, currentUser]);

  useEffect(() => {
    if (isOpen) {
      setSelectedRecipientId('');
      setRemarks('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !issue) return null;

  const selectedPeer = peerList.find(
    p => (p.id && p.id === selectedRecipientId) || (p.userId && p.userId === selectedRecipientId) || (p.email && p.email === selectedRecipientId)
  );

  const handleConfirm = async () => {
    if (!selectedPeer) {
      setError('Please select an assigned team member to route this issue to.');
      return;
    }
    if (!remarks.trim()) {
      setError('Please enter handover notes.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirmSendTo(issue.id, selectedPeer, remarks.trim());
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to send issue. Please try again.');
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
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(2px)',
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
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.16)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          border: '1px solid #E2E8F0',
          padding: '20px 24px',
          gap: '18px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Icon + Issue Name + Current Status underneath, no background, no separator, no close icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000099',
              flexShrink: 0,
              marginTop: '2px',
            }}
          >
            <Send style={{ width: '16px', height: '16px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
            <h3
              className="type-modal-title"
              style={{
                margin: 0,
                fontSize: 'var(--type-modal-title-size, 15px)',
                fontWeight: 700,
                color: '#0F172A',
                lineHeight: 1.35,
              }}
            >
              {issue.title || 'Untitled Issue'}
            </h3>
            <div>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#334155',
                  backgroundColor: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid #E2E8F0',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {issue.status || 'In Review'}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="no-scrollbar" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Assigned To Selectable Dropdown */}
          <SharedRecipientSelect
            label="Assigned To"
            required
            value={selectedRecipientId}
            onChange={(val) => {
              setSelectedRecipientId(val);
              if (error) setError('');
            }}
            options={peerList.map((peer) => ({
              id: peer.id || peer.userId || peer.email || peer.name,
              name: peer.name,
              displayName: peer.displayName,
              email: peer.email,
              roleName: peer.roleName,
              roleAbbr: peer.roleAbbr,
              targetStatus: peer.targetStatus,
              isCurrent: peer.isCurrent,
            }))}
            disabled={isSubmitting}
          />

          {/* Routing & Target Workflow Stage Info Container */}
          {selectedPeer && (
            <div
              style={{
                backgroundColor: '#F0F7FF',
                borderRadius: '6px',
                border: '1px solid #DBEAFE',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#334155',
                lineHeight: 1.45,
                fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
              }}
            >
              Issue is routing to <strong>{selectedPeer.displayName || selectedPeer.name}</strong> and workflow stage is going to become <strong>{selectedPeer.targetStatus}</strong>.
            </div>
          )}

          {/* Hand over notes */}
          <SharedTextArea
            label="Hand over notes"
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

        {/* Footer: No background, no separator, two buttons */}
        <div
          style={{
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
            onClick={handleConfirm}
            disabled={isSubmitting || !selectedPeer}
          >
            {isSubmitting ? 'Sending...' : 'Send'}
          </SharedButton>
        </div>
      </div>
    </div>
  );
};

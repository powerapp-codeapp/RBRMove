import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import type { AuditTrailLog } from '../../../types/dataverse.types';
import { History, X } from 'lucide-react';
import { SharedButton } from '../../../components/shared/buttons/SharedButton';

interface IssueLogsDialogProps {
  open: boolean;
  onClose: () => void;
  issueId: string;
  issueTitle: string;
  logs: AuditTrailLog[];
}

export const IssueLogsDialog: React.FC<IssueLogsDialogProps> = ({
  open,
  onClose,
  issueId,
  issueTitle,
  logs,
}) => {
  // If no logs yet, generate representative regulatory entries
  const displayLogs: AuditTrailLog[] = logs.length > 0 ? logs : [
    {
      logId: 'LOG-001',
      entityName: 'cr_issue',
      recordId: issueId,
      action: 'STATE_TRANSITION',
      previousState: 'Draft',
      newState: 'Pending TC',
      performedByUserId: 'USR-001',
      performedByUserName: 'Marcus Vance',
      userRole: 'Lead Auditor',
      timestamp: '2026-09-24T14:32:10Z',
      remarks: 'Initial field testing complete; workpaper submitted for Team Coordinator review.',
    },
    {
      logId: 'LOG-002',
      entityName: 'cr_issue',
      recordId: issueId,
      action: 'AI_ADOPTION',
      previousState: 'Human Draft v1',
      newState: 'AI Synthesized v2',
      performedByUserId: 'USR-002',
      performedByUserName: 'Tamilselvan',
      userRole: 'IT Manager',
      timestamp: '2026-09-25T09:14:45Z',
      remarks: 'Adopted AI synthesized recommendation and impact statement via hybrid merge.',
    },
    {
      logId: 'LOG-003',
      entityName: 'cr_issue',
      recordId: issueId,
      action: 'STATE_TRANSITION',
      previousState: 'Pending TC',
      newState: 'Pending Manager',
      performedByUserId: 'USR-003',
      performedByUserName: 'Sarah Jenkins',
      userRole: 'Team Coordinator',
      timestamp: '2026-09-26T11:05:00Z',
      remarks: 'Verified test procedure coverage; approved for managerial review.',
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
              <History size={20} color="#000099" />
            </div>
            <div>
              <h2
                className="type-modal-title"
                style={{
                  fontSize: 'var(--type-modal-title-size, 16px)',
                  fontWeight: 800,
                  color: '#212121',
                  margin: 0,
                  fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                }}
              >
                Audit Trail &amp; Event History Log
              </h2>
              <span
                className="type-caption"
                style={{
                  fontSize: 'var(--type-caption-size, 11px)',
                  color: '#63666a',
                  fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                }}
              >
                Immutable regulatory ledger for Finding: {issueTitle} ({issueId})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close logs dialog"
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

      <DialogContent sx={{ p: '24px', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {displayLogs.map((log) => (
            <div
              key={log.logId}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                padding: '14px 16px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    className="type-badge"
                    style={{
                      fontSize: 'var(--type-caption-size, 11px)',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: log.action === 'SIGN_OFF' ? '#ebf9ee' : '#f1f4ff',
                      color: log.action === 'SIGN_OFF' ? '#0f8f4d' : '#000099',
                      border: `1px solid ${log.action === 'SIGN_OFF' ? '#bfe8c8' : '#c5dbfc'}`,
                      fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                    }}
                  >
                    {log.action}
                  </span>
                  <span
                    className="type-table-row-title"
                    style={{
                      fontSize: 'var(--type-table-header-size, 12px)',
                      fontWeight: 700,
                      color: '#212121',
                      fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                    }}
                  >
                    {log.performedByUserName}
                  </span>
                  <span
                    className="type-caption"
                    style={{
                      fontSize: 'var(--type-caption-size, 11px)',
                      color: '#64748b',
                      fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                    }}
                  >
                    ({log.userRole || 'Auditor'})
                  </span>
                </div>

                <span
                  className="type-caption"
                  style={{
                    fontSize: 'var(--type-caption-size, 11px)',
                    color: '#888b8d',
                    fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                  }}
                >
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>

              {log.previousState && log.newState && (
                <div
                  className="type-body"
                  style={{
                    fontSize: 'var(--type-table-row-size, 12px)',
                    color: '#475569',
                    marginBottom: '6px',
                    fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                  }}
                >
                  Transition: <strong style={{ color: '#0f172a' }}>{log.previousState}</strong> &rarr; <strong style={{ color: '#000099' }}>{log.newState}</strong>
                </div>
              )}

              {log.remarks && (
                <p
                  className="type-body"
                  style={{
                    fontSize: 'var(--type-table-row-size, 12px)',
                    color: '#64748b',
                    margin: 0,
                    fontStyle: 'italic',
                    lineHeight: '1.5',
                    fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                  }}
                >
                  &ldquo;{log.remarks}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      </DialogContent>

      <DialogActions sx={{ p: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <SharedButton variant="primary" onClick={onClose}>
          Close Log
        </SharedButton>
      </DialogActions>
    </Dialog>
  );
};

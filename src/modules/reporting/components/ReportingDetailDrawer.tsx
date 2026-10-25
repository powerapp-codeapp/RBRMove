import React, { useState } from 'react';
import Drawer from '@mui/material/Drawer';
import {
  MessageSquare,
  FileText,
  PlayCircle,
  Download,
  GitBranch,
  History,
  Users,
  Layers,
  Plus
} from 'lucide-react';
import { getEngagementWorkflowState, formatUSDateTime } from '../utils/reportingWorkflowEngine';
import { SharedButton, SharedSelectButton, BackButton } from '../../../components/shared';

interface ReportingDetailDrawerProps {
  isOpen: boolean;
  job: any;
  userRole?: string;
  onClose: () => void;
  onWorkOnReport: (job: any, type: 'audit' | 'executive') => void;
  onOpenCreateIssue: (job: any) => void;
  onOpenDiscussionPoints?: (job: any) => void;
  onOpenHistory?: (job: any) => void;
}

export const ReportingDetailDrawer: React.FC<ReportingDetailDrawerProps> = ({
  isOpen,
  job,
  onClose,
  onWorkOnReport,
  onOpenCreateIssue,
  onOpenHistory,
}) => {
  const [assignmentFilter, setAssignmentFilter] = useState<'All' | 'Auditors' | 'Reviewers'>('All');

  if (!job) return null;

  const wf = getEngagementWorkflowState(job);
  const { auditReport, executiveSummaryReport, discussionPoints, roster = [] } = job;

  const filteredRoster = roster.filter((m: any) => {
    if (assignmentFilter === 'All') return true;
    if (assignmentFilter === 'Auditors') return (m.role || '').toLowerCase().includes('auditor');
    if (assignmentFilter === 'Reviewers') return !(m.role || '').toLowerCase().includes('auditor');
    return true;
  });

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      slotProps={{
        backdrop: {
          style: { backgroundColor: 'rgba(15, 23, 42, 0.45)' }
        },
        paper: {
          style: {
            width: 'clamp(420px, 42vw, 580px)',
            maxWidth: '94vw',
            backgroundColor: '#f8fafc',
            boxShadow: '-6px 0 24px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
          }
        }
      }}
    >
      {/* Full-Width Dark Header Bar */}
      <div
        style={{
          backgroundColor: '#000099',
          color: '#ffffff',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 153, 0.25)',
          flexShrink: 0
        }}
      >
        <BackButton
          onClick={onClose}
          title="Back to Reporting Queue"
          ariaLabel="Back to Reporting Queue"
          size={16}
          width="32px"
          height="32px"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            borderColor: 'rgba(255, 255, 255, 0.3)',
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 'var(--type-studio-title-size, 15px)',
              fontWeight: 800,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
            }}
          >
            {job.fileName || job.engagement}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
            <span
              className="type-badge"
              style={{
                fontSize: 'var(--type-badge-size, 10px)',
                fontWeight: 700,
                color: '#c5dbfc',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid rgba(197, 219, 252, 0.3)'
              }}
            >
              {job.assessmentName || '2026 Internal Audit Assessments'}
            </span>
            <span
              className="type-badge"
              style={{
                fontSize: 'var(--type-badge-size, 10px)',
                fontWeight: 700,
                color: job.assessmentStatus === 'Closed' ? '#CBD5E1' : '#6EE7B7',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                padding: '2px 8px',
                borderRadius: '8px'
              }}
            >
              ● {job.assessmentStatus || 'Open'}
            </span>
            <span
              className="type-badge"
              style={{
                fontSize: 'var(--type-badge-size, 10px)',
                fontWeight: 700,
                color: '#ffffff',
                backgroundColor: wf.status === 'Completed' ? '#087d0d' : '#eb1700',
                padding: '2px 8px',
                borderRadius: '8px'
              }}
            >
              {wf.status}
            </span>
            <span
              className="type-badge"
              style={{
                fontSize: 'var(--type-badge-size, 10px)',
                fontWeight: 700,
                color: '#FEF08A',
                backgroundColor: 'rgba(254, 240, 138, 0.15)',
                padding: '2px 8px',
                borderRadius: '8px',
                border: '1px solid rgba(254, 240, 138, 0.3)'
              }}
            >
              Queue: {wf.queue}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Body Content */}
      <div
        className="slim-light-scrollbar"
        style={{
          padding: '20px',
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}
      >
        {/* SECTION 1: ISSUES */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={17} color="#eb1700" />
              <h3
                style={{
                  fontSize: 'var(--type-section-title-size, 14px)',
                  fontWeight: 800,
                  color: '#212121',
                  margin: 0,
                  fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                }}
              >
                Issues &amp; Findings ({job.issuesList?.length || 0})
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <SharedButton
                variant="outline"
                size="small"
                startIcon={<Plus size={13} />}
                onClick={() => onOpenCreateIssue(job)}
                style={{
                  borderColor: '#ffd0cc',
                  color: '#eb1700',
                  backgroundColor: '#fff1f0',
                  fontSize: 'var(--type-caption-size, 11.5px)',
                  fontWeight: 700
                }}
              >
                Add Issue
              </SharedButton>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--type-caption-size, 11.5px)', fontWeight: 600, color: '#63666a' }}>Started On</span>
              <strong style={{ fontSize: 'var(--type-table-row-size, 12px)', fontWeight: 700, color: '#212121' }}>
                {formatUSDateTime(discussionPoints?.startDateTime) || '2026-08-01, 8:30 AM'}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--type-caption-size, 11.5px)', fontWeight: 600, color: '#63666a' }}>Last Updated On</span>
              <strong style={{ fontSize: 'var(--type-table-row-size, 12px)', fontWeight: 700, color: '#212121' }}>
                {formatUSDateTime(discussionPoints?.endDateTime) || '2026-08-04, 2:30 PM'}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--type-caption-size, 11.5px)', fontWeight: 600, color: '#63666a' }}>Assigned Audit Team</span>
              <strong style={{ fontSize: 'var(--type-table-row-size, 12px)', fontWeight: 700, color: '#000099' }}>
                {job.leadOwner || 'Amanda Palmer'}
              </strong>
            </div>
          </div>
        </div>

        {/* SECTION 2: AUDIT REPORT */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={17} color="#000099" />
              <h3
                style={{
                  fontSize: 'var(--type-section-title-size, 14px)',
                  fontWeight: 800,
                  color: '#212121',
                  margin: 0,
                  fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                }}
              >
                Audit Report
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SharedButton
                variant="primary"
                size="small"
                startIcon={<PlayCircle size={14} />}
                onClick={() => onWorkOnReport(job, 'audit')}
                style={{
                  fontSize: 'var(--type-caption-size, 11.5px)',
                  fontWeight: 700
                }}
              >
                Work On Report
              </SharedButton>

              <SharedSelectButton
                label="Options"
                size="small"
                menuWidth="210px"
                items={[
                  {
                    label: 'Download Report',
                    icon: <Download size={14} color="#000099" />,
                    onClick: () => alert(`Exporting Audit Report for ${job.id || job.engagementId}`)
                  },
                  {
                    label: 'View Workflow',
                    icon: <GitBranch size={14} color="#000099" />,
                    onClick: () => onWorkOnReport(job, 'audit')
                  },
                  {
                    label: 'View Audit Trail',
                    icon: <History size={14} color="#63666a" />,
                    onClick: () => onOpenHistory && onOpenHistory(job)
                  }
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--type-caption-size, 11.5px)', fontWeight: 600, color: '#63666a' }}>Validation Status</span>
              <span
                className="type-badge"
                style={{
                  fontSize: 'var(--type-caption-size, 11px)',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: auditReport?.validationStatus === 'Approved' ? '#ecfdf5' : '#eff6ff',
                  color: auditReport?.validationStatus === 'Approved' ? '#087d0d' : '#000099',
                  border: `1px solid ${auditReport?.validationStatus === 'Approved' ? '#bbf7d0' : '#bfdbfe'}`
                }}
              >
                {auditReport?.validationStatus || 'In Progress'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--type-caption-size, 11.5px)', fontWeight: 600, color: '#63666a' }}>Validation Started</span>
              <strong style={{ fontSize: 'var(--type-table-row-size, 12px)', fontWeight: 700, color: '#212121' }}>
                {formatUSDateTime(auditReport?.validationStartDateTime) || '2026-08-01, 10:00 AM'}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--type-caption-size, 11.5px)', fontWeight: 600, color: '#63666a' }}>Validation Ended</span>
              <strong style={{ fontSize: 'var(--type-table-row-size, 12px)', fontWeight: 700, color: '#212121' }}>
                {formatUSDateTime(auditReport?.validationEndDateTime) || '2026-08-04, 2:00 PM'}
              </strong>
            </div>
          </div>
        </div>

        {/* SECTION 3: EXECUTIVE SUMMARY REPORT */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={17} color="#4338CA" />
              <h3
                style={{
                  fontSize: 'var(--type-section-title-size, 14px)',
                  fontWeight: 800,
                  color: '#212121',
                  margin: 0,
                  fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                }}
              >
                Executive Summary Report
              </h3>
            </div>

            <SharedButton
              variant="outline"
              size="small"
              startIcon={<PlayCircle size={14} />}
              onClick={() => onWorkOnReport(job, 'executive')}
              style={{
                borderColor: '#C7D2FE',
                color: '#4338CA',
                backgroundColor: '#EEF2FF',
                fontSize: 'var(--type-caption-size, 11.5px)',
                fontWeight: 700
              }}
            >
              Executive Summary
            </SharedButton>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--type-caption-size, 11.5px)', fontWeight: 600, color: '#63666a' }}>Status</span>
              <span
                className="type-badge"
                style={{
                  fontSize: 'var(--type-caption-size, 11px)',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: executiveSummaryReport?.validationStatus === 'Approved' ? '#ecfdf5' : '#f8fafc',
                  color: executiveSummaryReport?.validationStatus === 'Approved' ? '#087d0d' : '#63666a',
                  border: `1px solid ${executiveSummaryReport?.validationStatus === 'Approved' ? '#bbf7d0' : '#e2e8f0'}`
                }}
              >
                {executiveSummaryReport?.validationStatus || 'Pending'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--type-caption-size, 11.5px)', fontWeight: 600, color: '#63666a' }}>Validation Started</span>
              <strong style={{ fontSize: 'var(--type-table-row-size, 12px)', fontWeight: 700, color: '#212121' }}>
                {formatUSDateTime(executiveSummaryReport?.validationStartDateTime) || '2026-08-01, 10:30 AM'}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--type-caption-size, 11.5px)', fontWeight: 600, color: '#63666a' }}>Validation Ended</span>
              <strong style={{ fontSize: 'var(--type-table-row-size, 12px)', fontWeight: 700, color: '#212121' }}>
                {formatUSDateTime(executiveSummaryReport?.validationEndDateTime) || '2026-08-04, 2:15 PM'}
              </strong>
            </div>
          </div>
        </div>

        {/* SECTION 4: ENGAGEMENT TEAM ASSIGNMENTS */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={17} color="#000099" />
              <h3
                style={{
                  fontSize: 'var(--type-section-title-size, 14px)',
                  fontWeight: 800,
                  color: '#212121',
                  margin: 0,
                  fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                }}
              >
                Team Roster ({roster.length})
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
              {(['All', 'Auditors', 'Reviewers'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setAssignmentFilter(tab)}
                  style={{
                    padding: '3px 10px',
                    fontSize: 'var(--type-caption-size, 11px)',
                    fontWeight: assignmentFilter === tab ? 700 : 500,
                    backgroundColor: assignmentFilter === tab ? '#ffffff' : 'transparent',
                    color: assignmentFilter === tab ? '#000099' : '#64748b',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    boxShadow: assignmentFilter === tab ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div
            className="slim-light-scrollbar"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '240px',
              overflowY: 'auto'
            }}
          >
            {filteredRoster.length === 0 ? (
              <div
                style={{
                  fontSize: 'var(--type-table-row-size, 12px)',
                  color: '#94a3b8',
                  textAlign: 'center',
                  padding: '12px'
                }}
              >
                No team assignments matching filter.
              </div>
            ) : (
              filteredRoster.map((m: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #f1f5f9'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: '#f1f4ff',
                        color: '#000099',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 800,
                        border: '1px solid #c5dbfc'
                      }}
                    >
                      {m.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--type-table-row-size, 12px)', fontWeight: 700, color: '#212121' }}>{m.name}</div>
                      <div style={{ fontSize: 'var(--type-caption-size, 10.5px)', color: '#63666a' }}>{m.role}</div>
                    </div>
                  </div>

                  <span
                    className="type-badge"
                    style={{
                      fontSize: 'var(--type-badge-size, 10px)',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: m.status === 'Assigned' ? '#eff6ff' : '#f1f5f9',
                      color: m.status === 'Assigned' ? '#000099' : '#475569'
                    }}
                  >
                    {m.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
};

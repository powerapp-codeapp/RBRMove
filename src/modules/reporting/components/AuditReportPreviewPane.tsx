import React from 'react';
import { Ban, FileText } from 'lucide-react';
import type { Issue } from '../../../types/dataverse.types';
import { ReportPreviewRail } from './preview/ReportPreviewRail';
import { ReportPreviewDocumentHeader } from './preview/ReportPreviewDocumentHeader';
import { ReportPreviewBrandBanner } from './preview/ReportPreviewBrandBanner';
import { ReportPreviewIssueCard } from './preview/ReportPreviewIssueCard';
import { ReportPreviewExcludedNotice } from './preview/ReportPreviewExcludedNotice';
import { ReportPreviewFooter } from './preview/ReportPreviewFooter';

interface AuditReportPreviewPaneProps {
  issues: Issue[];
  selectedIssue: Issue | null;
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  onIncludeIssue: (issueId: string) => void;
  engagementFileName?: string;
  auditableEntityName?: string;
}

export const AuditReportPreviewPane: React.FC<AuditReportPreviewPaneProps> = ({
  issues,
  selectedIssue,
  isCollapsed,
  onToggleCollapse,
  onIncludeIssue,
  engagementFileName = 'Audit Report',
  auditableEntityName = 'GA&A Internal Audit',
}) => {
  // If collapsed, render 36px vertical rail
  if (isCollapsed) {
    return <ReportPreviewRail onExpand={() => onToggleCollapse(false)} />;
  }

  const activeIssues = issues.filter((item) => !item.isExcluded);

  const pageText = selectedIssue
    ? `Page ${issues.findIndex((i) => i.id === selectedIssue.id) + 1} of ${issues.length}`
    : `Page 1 of ${Math.max(1, activeIssues.length)}`;

  return (
    <div
      className="slim-light-scrollbar"
      style={{
        flex: 1,
        backgroundColor: '#E8EDF2',
        padding: '20px 20px 32px 20px',
        overflowY: 'auto',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
        position: 'relative',
        minWidth: '280px',
        scrollbarWidth: 'thin',
        scrollbarColor: '#CBD5E1 transparent',
      }}
    >
      {/* Centered White Document Sheet */}
      <div
        style={{
          width: '100%',
          maxWidth: '840px',
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          border: '1px solid #D8D8D8',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          marginBottom: '40px',
        }}
      >
        {/* Red PDF Document Header Bar */}
        <ReportPreviewDocumentHeader
          fileName={engagementFileName}
          onCollapse={() => onToggleCollapse(true)}
        />

        {/* Document Content Canvas */}
        <div
          style={{
            padding: '28px 32px',
            color: '#000000',
            minHeight: '840px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Brand & Auditable Entity Header */}
          <ReportPreviewBrandBanner
            auditableEntityName={selectedIssue?.auditableEntity || auditableEntityName}
          />

          {/* Render Selected Issue or All Issues in Sequence */}
          <div style={{ flex: 1 }}>
            {issues.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                <FileText
                  style={{
                    width: '36px',
                    height: '36px',
                    color: '#94A3B8',
                    margin: '0 auto 10px',
                  }}
                />
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>
                  Report Contains 0 Issues
                </div>
                <div style={{ fontSize: '12px' }}>
                  No findings or issues have been recorded for this audit.
                </div>
              </div>
            ) : selectedIssue ? (
              selectedIssue.isExcluded ? (
                <div>
                  <ReportPreviewExcludedNotice
                    onIncludeIssue={() => onIncludeIssue(selectedIssue.id)}
                  />
                  <div style={{ opacity: 0.55 }}>
                    <ReportPreviewIssueCard
                      item={selectedIssue}
                      idx={issues.findIndex((i) => i.id === selectedIssue.id)}
                    />
                  </div>
                </div>
              ) : (
                <ReportPreviewIssueCard
                  item={selectedIssue}
                  idx={issues.findIndex((i) => i.id === selectedIssue.id)}
                />
              )
            ) : activeIssues.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                <Ban
                  style={{
                    width: '36px',
                    height: '36px',
                    color: '#94A3B8',
                    margin: '0 auto 10px',
                  }}
                />
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>
                  All Findings Excluded
                </div>
                <div style={{ fontSize: '12px' }}>
                  All findings in this audit are currently marked as excluded and omitted from the report.
                </div>
              </div>
            ) : (
              activeIssues.map((item, idx) => (
                <ReportPreviewIssueCard key={item.id} item={item} idx={idx} />
              ))
            )}
          </div>

          {/* Footer Section */}
          <ReportPreviewFooter pageText={pageText} />
        </div>
      </div>
    </div>
  );
};

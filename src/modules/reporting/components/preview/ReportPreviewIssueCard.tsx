import React from 'react';
import type { Issue } from '../../../../types/dataverse.types';
import { parseDescriptionWithViolations } from '../../utils/violationParser';
import { isITIssue } from '../../utils/reportingWorkflowEngine';

interface ReportPreviewIssueCardProps {
  item: Issue;
  idx?: number;
}

export const ReportPreviewIssueCard: React.FC<ReportPreviewIssueCardProps> = ({
  item,
  idx = 0,
}) => {
  const reportRefNum = item.reportRef || idx + 1;
  const critBg =
    item.criticality === 'Critical'
      ? '#D8001D'
      : item.criticality === 'Minor'
        ? '#008000'
        : '#F1B500';
  const critTextColor = '#ffffff';

  const narrative = item.issueNarrative || item.description || item.issue || '';
  const parsedViolations = parseDescriptionWithViolations(narrative);

  const resolvedFunction =
    item.accountableFunction ||
    item.function ||
    (isITIssue(item) ? 'Information Technology' : 'Finance Operations');

  return (
    <div key={item.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '22px' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 'var(--type-table-row-size, 11px)',
          lineHeight: 1.45,
          border: '1px solid #000000',
          color: '#000000',
          fontFamily: 'Arial, Helvetica, sans-serif',
          tableLayout: 'fixed',
        }}
      >
        <tbody>
          {/* ROW 1 (3 Columns) */}
          <tr>
            {/* Col 1: Report Ref & Boxed Criticality Badge */}
            <td
              style={{
                width: '33.33%',
                padding: '6px 8px',
                border: '1px solid #000000',
                verticalAlign: 'top',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '6px' }}>
                Report Ref: {reportRefNum}
              </div>
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: critBg,
                  color: critTextColor,
                  fontWeight: 700,
                  fontSize: '11px',
                  padding: '4px 20px',
                  border: '1px solid #000000',
                  textAlign: 'center',
                }}
              >
                {item.criticality || 'Major'}
              </div>
            </td>

            {/* Col 2: Accountable Function(s) */}
            <td
              style={{
                width: '33.33%',
                padding: '6px 8px',
                border: '1px solid #000000',
                verticalAlign: 'top',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                Accountable Function(s):
              </div>
              <div style={{ color: '#000000' }}>
                {resolvedFunction}
              </div>
            </td>

            {/* Col 3: Process Area */}
            <td
              style={{
                width: '33.34%',
                padding: '6px 8px',
                border: '1px solid #000000',
                verticalAlign: 'top',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                Process Area:
              </div>
              <div style={{ color: '#000000' }}>
                {item.processArea || item.accountableProcessArea || 'Global Access Management'}
              </div>
            </td>
          </tr>

          {/* ROW 2 (3 Columns) */}
          <tr>
            {/* Col 1: Report Finding */}
            <td
              style={{
                padding: '6px 8px',
                border: '1px solid #000000',
                verticalAlign: 'top',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                Report Finding:
              </div>
              <div style={{ color: '#000000' }}>
                {item.repeatFinding || 'No'}
              </div>
            </td>

            {/* Col 2: Issue Cause Type */}
            <td
              style={{
                padding: '6px 8px',
                border: '1px solid #000000',
                verticalAlign: 'top',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                Issue Cause Type:
              </div>
              <div style={{ color: '#000000' }}>
                {item.issueCauseType || 'Operating Effectiveness'}
              </div>
            </td>

            {/* Col 3: SOX Reportable */}
            <td
              style={{
                padding: '6px 8px',
                border: '1px solid #000000',
                verticalAlign: 'top',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                SOX Reportable:
              </div>
              <div style={{ color: '#000000' }}>
                {item.soxReportable || (item.criticality === 'Critical' ? 'Yes' : 'No')}
              </div>
            </td>
          </tr>

          {/* ROW 3 (3 Columns: Issue, Root Cause, Impact) */}
          <tr>
            {/* Col 1: Issue */}
            <td
              style={{
                padding: '6px 8px',
                border: '1px solid #000000',
                verticalAlign: 'top',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                Issue:
              </div>
              <div style={{ fontWeight: 700, color: '#000000', marginBottom: '5px', lineHeight: '1.3' }}>
                {item.title}
              </div>
              {parsedViolations && parsedViolations.hasViolations ? (
                <div style={{ color: '#000000', lineHeight: '1.4' }}>
                  <div style={{ whiteSpace: 'pre-wrap', marginBottom: '8px' }}>
                    {parsedViolations.mainText}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '10.5px', marginBottom: '2px' }}>
                    Violation Reference
                  </div>
                  {parsedViolations.subTitle && (
                    <div style={{ fontSize: '10px', color: '#333333', marginBottom: '4px' }}>
                      {parsedViolations.subTitle}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '10px' }}>
                    {parsedViolations.items.map((vItem, vIdx) => (
                      <div key={vIdx}>
                        <span>{vItem.number}. </span>
                        <span style={{ color: '#1D4ED8', textDecoration: 'underline', fontWeight: 600 }}>
                          {vItem.linkText}
                        </span>
                        {vItem.title && <span> - {vItem.title}</span>}
                        {vItem.detail && <span> — {vItem.detail}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ color: '#000000', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                  {narrative}
                </div>
              )}
            </td>

            {/* Col 2: Root Cause */}
            <td
              style={{
                padding: '6px 8px',
                border: '1px solid #000000',
                verticalAlign: 'top',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                Root Cause:
              </div>
              <div style={{ color: '#000000', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                {item.rootCause || 'Process execution gap in automated synchronization and manual handoff between operational units and central monitoring systems.'}
              </div>
            </td>

            {/* Col 3: Impact */}
            <td
              style={{
                padding: '6px 8px',
                border: '1px solid #000000',
                verticalAlign: 'top',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                Impact:
              </div>
              <div style={{ color: '#000000', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                {item.impact || 'Heightened risk of unauthorized data modifications and non-compliance with regulatory and corporate security requirements.'}
              </div>
            </td>
          </tr>

          {/* ROW 4 (2 Columns: Recommendation & Management Response) */}
          <tr>
            {/* Col 1: Recommendation (50%) */}
            <td
              colSpan={1}
              style={{
                width: '50%',
                padding: '6px 8px',
                border: '1px solid #000000',
                verticalAlign: 'top',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                Recommendation:
              </div>
              <div style={{ color: '#000000', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                {item.recommendation || 'Standardize automated controls and implement periodic supervisory reviews to ensure continuous compliance.'}
              </div>
            </td>

            {/* Col 2: Management Response (50%) */}
            <td
              colSpan={2}
              style={{
                width: '50%',
                padding: '6px 8px',
                border: '1px solid #000000',
                verticalAlign: 'top',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                Management Response:
              </div>
              <div style={{ color: '#000000', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                {item.businessManagementResponse || item.managementResponse || item.managementActionPlan || 'Management acknowledges the finding and has scheduled targeted remediations with the responsible engineering leads.'}
              </div>
            </td>
          </tr>

          {/* ROW 5 (2 Columns: Accountable Contact & Agreed Remediation Date) */}
          <tr>
            {/* Col 1: Accountable Contact (50%) */}
            <td
              colSpan={1}
              style={{
                padding: '6px 8px',
                border: '1px solid #000000',
                verticalAlign: 'top',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '2px' }}>
                Accountable Contact:
              </div>
              <div style={{ color: '#000000' }}>
                {item.primaryBusinessOwnerName || item.businessContactName || item.accountableContact || 'Accountable Contact Pending'}
              </div>
            </td>

            {/* Col 2: Agreed Remediation Date (50%) */}
            <td
              colSpan={2}
              style={{
                padding: '6px 8px',
                border: '1px solid #000000',
                verticalAlign: 'top',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '2px' }}>
                Agreed Remediation Date:
              </div>
              <div style={{ color: '#000000' }}>
                {item.agreedRemediationDate || item.remediationTargetDate || 'Pending formal business response'}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};


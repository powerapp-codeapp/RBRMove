import { getEngagementWorkflowState } from '../../modules/reporting/utils/reportingWorkflowEngine';

/**
 * Standalone offline fallback engagements for local development when running outside Power Apps host.
 * Cleaned of hardcoded legacy names and structured to reflect standard Dataverse schema.
 */
export function getStandaloneOfflineJobs(): any[] {
  const sampleUsers = [
    {
      id: 'USR-001',
      name: 'Tamilselvan Natarajan',
      displayName: 'Tamilselvan',
      email: 'tamil@conversedatasolution.onmicrosoft.com',
      roleId: 'it-auditor',
      roleName: 'Staff Auditor',
      roleAbbr: 'IT AUD',
      initials: 'TN',
      isAlternateRole: false,
    },
    {
      id: 'USR-002',
      name: 'Gowri P',
      displayName: 'Gowri P',
      email: 'gowrip@conversedatasolution.onmicrosoft.com',
      roleId: 'team-coordinator',
      roleName: 'Team Coordinator',
      roleAbbr: 'TC',
      initials: 'GP',
      isAlternateRole: false,
    },
    {
      id: 'USR-003',
      name: 'Sarah Jenkins',
      displayName: 'Sarah Jenkins',
      email: 'sarah.jenkins@jnj.com',
      roleId: 'it-manager',
      roleName: 'Audit Manager',
      roleAbbr: 'IT MGR',
      initials: 'SJ',
      isAlternateRole: false,
    },
    {
      id: 'USR-004',
      name: 'Marcus Vance',
      displayName: 'Marcus Vance',
      email: 'marcus.vance@jnj.com',
      roleId: 'director',
      roleName: 'Audit Director',
      roleAbbr: 'IT DIR',
      initials: 'MV',
      isAlternateRole: false,
    },
  ];

  const sampleProcedures = [
    { id: 'PROC-01', code: 'PROC-IT-01', name: 'SOX 404 Access Control & Privilege Management', state: 'Active' },
    { id: 'PROC-02', code: 'PROC-IT-02', name: 'Infrastructure Firewall & Perimeter Monitoring', state: 'Active' },
  ];

  const sampleIssues: any[] = [
    {
      id: 'ISS-001',
      issueCode: 'ISS-001',
      title: 'Delayed SOX 404 Access Revocation for Terminated Personnel',
      observation: 'During testing of Q3-Q4 sample of terminated employees, 4 out of 25 active AD credentials remained enabled past the 24-hour SLA window.',
      description: 'During testing of Q3-Q4 sample of terminated employees, 4 out of 25 active AD credentials remained enabled past the 24-hour SLA window.',
      rootCause: 'Manual notification gap between Workday HR events and Active Directory offboarding workflow.',
      impact: 'Unauthorized logical access risk to sensitive financial and operational GxP data.',
      recommendation: 'Implement automated API webhook triggering immediate account deactivation upon termination.',
      mitigatingControls: 'Quarterly user access reviews (UAR) performed by department managers.',
      agreedManagementResponse: 'Management will implement automated offboarding flow via ServiceNow by Q2 2026.',
      remediationTargetDate: '2026-06-30',
      criticality: 'Major',
      status: 'Pending Manager',
      function: 'IT',
      currentOwner: sampleUsers[2].name,
      testProcedureCode: 'PROC-IT-01',
      testProcedureName: 'SOX 404 Access Control & Privilege Management',
      accountableFunction: 'IT Infrastructure & Security',
      accountableProcessArea: 'Access Control & IAM',
      isLocked: false,
      isExcluded: false,
      lastModified: new Date().toISOString(),
      activeAiVersionNumber: 1,
    },
    {
      id: 'ISS-002',
      issueCode: 'ISS-002',
      title: 'Missing Dual Approval on High-Value ERP Vendor Master Modifications',
      observation: 'Vendor bank account modifications exceeding $100K were processed without independent secondary review.',
      description: 'Vendor bank account modifications exceeding $100K were processed without independent secondary review.',
      rootCause: 'ERP role permission assignment did not enforce SOD dual-control threshold.',
      impact: 'Elevated fraud vulnerability and unauthorized disbursement risk.',
      recommendation: 'Configure SAP SOD rule matrix requiring mandatory secondary approver for all bank details updates.',
      criticality: 'Minor',
      status: 'Pending TC',
      function: 'FinOps',
      currentOwner: sampleUsers[1].name,
      testProcedureCode: 'PROC-IT-02',
      testProcedureName: 'Infrastructure Firewall & Perimeter Monitoring',
      accountableFunction: 'Financial Operations',
      accountableProcessArea: 'Financial Controls & SOX',
      isLocked: false,
      isExcluded: false,
      lastModified: new Date().toISOString(),
      activeAiVersionNumber: 1,
    },
  ];

  const job1: any = {
    id: 'ENG-1800',
    jobId: 'ENG-1800',
    reportId: 'ENG-1800',
    fileName: 'Commercial ERP Controls & Security Audit 2026',
    engagement: 'Commercial ERP Controls & Security Audit 2026',
    engagementName: 'Commercial ERP Controls & Security Audit 2026',
    plant: 'Enterprise Operations',
    year: 2026,
    assessmentYear: '2026',
    assessmentId: 'ASM-2026',
    assessmentName: '2026 Internal Audit Plan',
    assessmentStatus: 'Open',
    leadOwner: sampleUsers[0].name,
    status: 'In Progress',
    subStatus: 'Audit Report Inprogress',
    workflowStatus: 'Audit Report Inprogress',
    executionStatus: 'Running',
    issuesList: sampleIssues,
    testProcedures: sampleProcedures,
    assignedUsers: sampleUsers,
    roster: sampleUsers.map(u => ({ role: u.roleName, name: u.name, avatar: u.initials, status: 'Assigned', users: [u] })),
    lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };

  const wf: any = getEngagementWorkflowState(job1);
  job1.currentQueue = wf.queue;
  job1.currentQueueList = wf.queueList;
  job1.workflowBreakdown = wf.breakdown;
  job1.ownerText = wf.ownerText;

  return [job1];
}


// ==============================================================================
// Dataverse Reporting Service
// Johnson & Johnson Internal Audit Reporting (IAR)
// Connects live Dataverse tables to the Audit Queue & Reporting Modules
// ==============================================================================

import { Iar_assessmentsService } from '../generated/services/Iar_assessmentsService';
import { Iar_engagementsesService } from '../generated/services/Iar_engagementsesService';
import { Iar_securityassignmentsesService } from '../generated/services/Iar_securityassignmentsesService';
import { Iar_tmrolesesService } from '../generated/services/Iar_tmrolesesService';
import { SystemusersService } from '../generated/services/SystemusersService';
import { Iar_issuesesService } from '../generated/services/Iar_issuesesService';
import { Iar_proceduresesService } from '../generated/services/Iar_proceduresesService';

import {
  getInitialReportingJobs,
  assessments as fallbackAssessments,
  getEngagementWorkflowState,
  getRoleAbbreviation
} from '../modules/reporting/utils/reportingWorkflowEngine';

export interface DataverseReportingPayload {
  jobs: any[];
  assessments: any[];
  isLiveConnected: boolean;
  error?: any;
}

const ISSUE_STATUS_MAP: Record<number, string> = {
  822500000: 'Pending Staff',
  822500001: 'Pending TC',
  822500002: 'Pending Manager',
  822500003: 'Manager Completed (Waiting for Other Issues)',
  822500004: 'Ready for Director Submission',
  822500005: 'Pending Director',
  822500006: 'Pending Business',
  822500007: 'Pending VP',
  822500008: 'Completed',
  822500009: 'Excluded'
};

const REPORT_STATUS_MAP: Record<number, { status: string; workflowStatus: string }> = {
  822500000: { status: 'Not Started', workflowStatus: 'Not Started' },
  822500001: { status: 'In Progress', workflowStatus: 'Audit Report Inprogress' },
  822500002: { status: 'In Progress', workflowStatus: 'Executive Report Inprogress' },
  822500003: { status: 'Completed', workflowStatus: 'Completed' }
};

/**
 * Fetches all operational and master audit records directly from Microsoft Dataverse.
 * When running inside Power Apps host or Local Play, retrieves live Dataverse records.
 * If running standalone unauthenticated, cleanly falls back to seeded definitions.
 */
export async function fetchDataverseReportingData(): Promise<DataverseReportingPayload> {
  try {
    const [
      assessmentsRes,
      engagementsRes,
      assignmentsRes,
      tmRolesRes,
      usersRes,
      issuesRes,
      proceduresRes
    ] = await Promise.allSettled([
      Iar_assessmentsService.getAll(),
      Iar_engagementsesService.getAll(),
      Iar_securityassignmentsesService.getAll(),
      Iar_tmrolesesService.getAll(),
      SystemusersService.getAll(),
      Iar_issuesesService.getAll(),
      Iar_proceduresesService.getAll()
    ]);

    // Check if live engagements were retrieved from Dataverse
    const liveEngagements =
      engagementsRes.status === 'fulfilled' &&
      Array.isArray(engagementsRes.value?.data) &&
      engagementsRes.value.data.length > 0
        ? engagementsRes.value.data
        : null;

    if (!liveEngagements) {
      console.info(
        '[DataverseReportingService] No live engagements returned from Dataverse (likely standalone mode). Using fallback catalog.'
      );
      return {
        jobs: getInitialReportingJobs(),
        assessments: fallbackAssessments,
        isLiveConnected: false
      };
    }

    // Extract other Dataverse datasets
    const liveAssessments =
      assessmentsRes.status === 'fulfilled' && Array.isArray(assessmentsRes.value?.data)
        ? assessmentsRes.value.data
        : [];

    const liveAssignments =
      assignmentsRes.status === 'fulfilled' && Array.isArray(assignmentsRes.value?.data)
        ? assignmentsRes.value.data
        : [];

    const liveTmRoles =
      tmRolesRes.status === 'fulfilled' && Array.isArray(tmRolesRes.value?.data)
        ? tmRolesRes.value.data
        : [];

    const liveUsers =
      usersRes.status === 'fulfilled' && Array.isArray(usersRes.value?.data)
        ? usersRes.value.data
        : [];

    const liveIssues =
      issuesRes.status === 'fulfilled' && Array.isArray(issuesRes.value?.data)
        ? issuesRes.value.data
        : [];

    const liveProcedures =
      proceduresRes.status === 'fulfilled' && Array.isArray(proceduresRes.value?.data)
        ? proceduresRes.value.data
        : [];

    // Helper lookup dictionaries
    const assessmentMap = new Map<string, any>();
    liveAssessments.forEach((asm: any) => {
      if (asm.iar_assessmentid) assessmentMap.set(asm.iar_assessmentid, asm);
    });

    const userByEmail = new Map<string, any>();
    const userById = new Map<string, any>();
    liveUsers.forEach((u: any) => {
      if (u.internalemailaddress) userByEmail.set(u.internalemailaddress.toLowerCase().trim(), u);
      if (u.systemuserid) userById.set(u.systemuserid, u);
    });

    const tmRoleByTmId = new Map<string, any>();
    liveTmRoles.forEach((r: any) => {
      if (r.iar_tmid) tmRoleByTmId.set(r.iar_tmid, r);
    });

    // Map each Dataverse engagement row into the unified Code App job model
    const transformedJobs = liveEngagements.map((eng: any) => {
      const engId = eng.iar_engagementsid;
      const engCode = eng.iar_engagementcode || eng.iar_name || engId;
      const engName = eng.iar_engagementname || eng.iar_name || 'Engagement ' + engCode;

      // 1. Resolve Assessment
      const asmGuid = eng._iar_assessmentid_value || '';
      const matchedAsm = assessmentMap.get(asmGuid);
      const asmYear =
        matchedAsm?.iar_assessmenttitle?.match(/\d{4}/)?.[0] ||
        (matchedAsm?.iar_startdate ? new Date(matchedAsm.iar_startdate).getFullYear().toString() : '2026');
      const asmName = matchedAsm?.iar_assessmenttitle || `${asmYear} Internal Audit Assessments`;
      const asmStatus = matchedAsm?.iar_assessmentstate || 'Open';

      // 2. Resolve Security Assignments for this engagement
      const engAssignments = liveAssignments.filter(
        (asg: any) =>
          asg._iar_engagementid_value === engId ||
          asg.iar_engagementid === engId ||
          asg['iar_EngagementID@odata.bind']?.includes(engId)
      );

      const roster: any[] = [];
      const assignedUsersList: any[] = [];

      engAssignments.forEach((asg: any) => {
        const email = (asg.iar_useremailid || '').toLowerCase().trim();
        const matchedUser = userByEmail.get(email);
        const tmRole = tmRoleByTmId.get(asg.iar_tmroleid);

        const roleTitle = tmRole?.iar_rolename || asg.iar_tmrolename || 'Auditor';
        const roleAbbr = getRoleAbbreviation(roleTitle);
        const userName = matchedUser?.fullname || email.split('@')[0] || 'Assigned Auditor';
        const userInitials =
          (matchedUser?.firstname?.[0] || '') + (matchedUser?.lastname?.[0] || '') ||
          userName.slice(0, 2).toUpperCase();

        const userObj = {
          id: matchedUser?.systemuserid || asg.iar_securityassignmentsid,
          name: userName,
          displayName: userName.includes('Tamilselvan') ? 'Tamilselvan' : userName,
          email: email,
          initials: userInitials,
          roleId: tmRole?.iar_logickey || asg.iar_tmroleid,
          roleName: roleTitle,
          roleAbbr: roleAbbr,
          isAlternateRole: false
        };

        assignedUsersList.push(userObj);
        roster.push({
          role: roleTitle,
          name: userName,
          avatar: userInitials,
          status: roleTitle.includes('Auditor') ? 'Assigned' : 'Reviewer',
          users: [userObj]
        });
      });

      // 3. Resolve Findings / Issues for this engagement
      const engIssues = liveIssues
        .filter(
          (iss: any) =>
            iss._iar_engagementid_value === engId ||
            iss.iar_engagementid === engId ||
            iss['iar_EngagementID@odata.bind']?.includes(engId)
        )
        .map((iss: any) => {
          const rawStatus = iss.iar_issuestatus;
          const statusText = ISSUE_STATUS_MAP[rawStatus] || 'Pending Staff';
          const isIT = iss.iar_function === 822500000;

          // Owner resolution
          const pboId = iss._iar_primarybusinessowner_value;
          const pboUser = pboId ? userById.get(pboId) : null;
          const ownerUser = iss._iar_currentowner_value ? userById.get(iss._iar_currentowner_value) : null;

          return {
            id: iss.iar_issuesid,
            jobId: engCode,
            engagementId: engId,
            title: iss.iar_issuetitle || iss.iar_name || 'Untitled Issue',
            header: iss.iar_issuetitle || iss.iar_name || 'Untitled Issue',
            status: statusText,
            currentLevel: statusText,
            criticality: 'Moderate',
            tech: isIT ? 'IT' : 'FinOps',
            function: isIT ? 'IT' : 'FinOps',
            reportReference: iss.iar_reportreference || 1,
            originalIssue: iss.iar_originalissue || '',
            description: iss.iar_description || iss.iar_rectifiedissue || '',
            rootCause: iss.iar_rootcause || '',
            impact: iss.iar_impact || '',
            recommendation: iss.iar_recommendation || '',
            summaryFinding: iss.iar_summaryfinding || '',
            workflowRemarks: iss.iar_workflowremarks || '',
            lockStatus: iss.iar_lockstatus || false,
            lockedBy: iss._iar_lockedby_value || null,
            primaryContact: pboUser?.fullname || '',
            owner: ownerUser?.fullname || (assignedUsersList[0]?.name || 'Amanda Palmer')
          };
        });

      // 4. Resolve Test Procedures for this engagement
      const engProcedures = liveProcedures
        .filter(
          (tp: any) =>
            tp._iar_engagementid_value === engId ||
            tp.iar_engagementid === engId ||
            tp['iar_EngagementID@odata.bind']?.includes(engId)
        )
        .map((tp: any) => ({
          id: tp.iar_proceduresid,
          code: tp.iar_name || 'PROC-001',
          name: tp.iar_procedurename || tp.iar_name || 'Audit Procedure',
          state: tp.iar_procedurestate || 'Active'
        }));

      // 5. Engagement Status Mapping
      const mappedReportStatus = REPORT_STATUS_MAP[eng.iar_reportstatus] || {
        status: 'Not Started',
        workflowStatus: 'Not Started'
      };

      const baseJob = {
        id: engId,
        jobId: engCode,
        reportId: engId,
        fileName: engName,
        engagement: engName,
        engagementName: engName,
        plant: 'Enterprise Operations',
        year: parseInt(asmYear, 10) || 2026,
        assessmentId: asmGuid || 'ASM-2026',
        assessmentName: asmName,
        assessmentStatus: asmStatus,
        leadOwner: assignedUsersList[0]?.name || 'Amanda Palmer',
        status: mappedReportStatus.status,
        subStatus: mappedReportStatus.workflowStatus,
        workflowStatus: mappedReportStatus.workflowStatus,
        executionStatus: mappedReportStatus.status === 'Completed' ? 'Completed' : (mappedReportStatus.status === 'Not Started' ? 'Pending' : 'Running'),
        issuesList: engIssues,
        testProcedures: engProcedures,
        roster: roster,
        assignedUsers: assignedUsersList,
        lastUpdated: eng.modifiedon ? eng.modifiedon.replace('T', ' ').slice(0, 19) : '2026-08-04 14:30:00'
      };

      // 6. Calculate Workflow State (Owners, Queues, Breakdown)
      const wf = getEngagementWorkflowState(baseJob);

      return {
        ...baseJob,
        currentQueue: wf.queue,
        currentQueueList: wf.queueList,
        currentOwner: wf.ownerText,
        currentOwners: wf.owners,
        ownersByRole: wf.ownersByRole,
        queueVariant: wf.queueVariant,
        aging: mappedReportStatus.status === 'Not Started' ? '1 day 2.15 Hours' : (mappedReportStatus.status === 'Completed' ? '11 days 4.00 Hours' : '3 days 5.20 Hours')
      };
    });

    // Format assessment options for filter select
    const formattedAssessments = liveAssessments.map((asm: any) => ({
      id: asm.iar_assessmentid,
      name: asm.iar_assessmenttitle,
      year: asm.iar_assessmenttitle?.match(/\d{4}/)?.[0] || '2026',
      status: asm.iar_assessmentstate || 'Open'
    }));

    return {
      jobs: transformedJobs,
      assessments: formattedAssessments.length > 0 ? formattedAssessments : fallbackAssessments,
      isLiveConnected: true
    };
  } catch (err) {
    console.warn('[DataverseReportingService] Failed to load from Dataverse. Falling back to local catalog:', err);
    return {
      jobs: getInitialReportingJobs(),
      assessments: fallbackAssessments,
      isLiveConnected: false,
      error: err
    };
  }
}

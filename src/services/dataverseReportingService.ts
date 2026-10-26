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
import { Iar_issuelogsesService } from '../generated/services/Iar_issuelogsesService';

import {
  getEngagementWorkflowState,
  getRoleAbbreviation,
  getRoleDetails
} from '../modules/reporting/utils/reportingWorkflowEngine';
import { Iar_tmrolesesiar_rolename } from '../generated/models/Iar_tmrolesesModel';
import type { Issue } from '../types/dataverse.types';

export interface DataverseReportingPayload {
  jobs: any[];
  assessments: any[];
  isLiveConnected: boolean;
  diagnostics?: Record<string, { status: string; count?: number; error?: string }>;
  error?: any;
}

let _cachedReportingPayload: DataverseReportingPayload | null = null;
const _reportingListeners = new Set<(payload: DataverseReportingPayload) => void>();

function notifyReportingPayload(payload: DataverseReportingPayload): DataverseReportingPayload {
  _cachedReportingPayload = payload;
  _reportingListeners.forEach((fn) => {
    try { fn(payload); } catch (e) { console.error(e); }
  });
  return payload;
}

export function subscribeToReportingData(listener: (payload: DataverseReportingPayload) => void) {
  _reportingListeners.add(listener);
  if (_cachedReportingPayload) {
    listener(_cachedReportingPayload);
  }
  return () => { _reportingListeners.delete(listener); };
}

export function getCachedReportingPayload(): DataverseReportingPayload | null {
  return _cachedReportingPayload;
}

function formatDateTimeSafe(val: any): string {
  if (!val) return '2026-08-04 14:30:00';
  if (typeof val === 'string') return val.replace('T', ' ').slice(0, 19);
  if (val instanceof Date) return val.toISOString().replace('T', ' ').slice(0, 19);
  return String(val);
}

function extractDataverseArray(res: PromiseSettledResult<any>): any[] {
  if (!res || res.status !== 'fulfilled') return [];
  const val = res.value;
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (Array.isArray(val.data)) return val.data;
  if (Array.isArray(val.value)) return val.value;
  if (val.data && Array.isArray(val.data.value)) return val.data.value;
  return [];
}

/**
 * Timeout wrapper for Power Apps SDK calls.
 * If the host iframe bridge does not respond (e.g. running outside Power Apps host),
 * rejects cleanly after timeout instead of hanging indefinitely.
 */
function withTimeout<T>(promise: Promise<T>, ms: number = 30000, opName: string = 'Service'): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${opName} did not respond within ${ms}ms (host bridge unavailable).`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
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
  let diagnostics: Record<string, { status: string; count?: number; error?: string }> = {
    engagements: { status: 'connecting' },
    assessments: { status: 'connecting' },
    assignments: { status: 'connecting' },
    tmRoles: { status: 'connecting' },
    users: { status: 'connecting' },
    issues: { status: 'connecting' },
    procedures: { status: 'connecting' }
  };

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
      withTimeout(Iar_assessmentsService.getAll(), 30000, 'Iar_assessmentsService.getAll()'),
      withTimeout(Iar_engagementsesService.getAll(), 30000, 'Iar_engagementsesService.getAll()'),
      withTimeout(Iar_securityassignmentsesService.getAll(), 30000, 'Iar_securityassignmentsesService.getAll()'),
      withTimeout(Iar_tmrolesesService.getAll(), 30000, 'Iar_tmrolesesService.getAll()'),
      withTimeout(SystemusersService.getAll(), 30000, 'SystemusersService.getAll()'),
      withTimeout(Iar_issuesesService.getAll(), 30000, 'Iar_issuesesService.getAll()'),
      withTimeout(Iar_proceduresesService.getAll(), 30000, 'Iar_proceduresesService.getAll()')
    ]);

    // Build structured diagnostics safely
    const parseReason = (r: PromiseSettledResult<any>) => {
      try {
        if (r.status === 'fulfilled') {
          const val = r.value;
          if (val?.success === false) {
            const errText = val?.error?.message || (typeof val?.error === 'string' ? val.error : 'Dataverse operation returned false');
            return { status: 'failed', error: errText };
          }
          const arr = extractDataverseArray(r);
          return { status: 'fulfilled', count: arr.length };
        }
        return { status: 'rejected', error: r.reason?.message || String(r.reason) };
      } catch (e: any) {
        return { status: 'error', error: e?.message || 'Error parsing result' };
      }
    };

    diagnostics = {
      engagements: parseReason(engagementsRes),
      assessments: parseReason(assessmentsRes),
      assignments: parseReason(assignmentsRes),
      tmRoles: parseReason(tmRolesRes),
      users: parseReason(usersRes),
      issues: parseReason(issuesRes),
      procedures: parseReason(proceduresRes)
    };

    // Diagnostic logging for developers and debugging
    console.groupCollapsed('[DataverseReportingService] Sync Diagnostics');
    console.table(diagnostics);
    console.groupEnd();

    // Check if Dataverse responded successfully
    const liveEngagements = extractDataverseArray(engagementsRes);
    const liveAssessments = extractDataverseArray(assessmentsRes);
    const liveAssignments = extractDataverseArray(assignmentsRes);
    const liveTmRoles = extractDataverseArray(tmRolesRes);
    const liveUsers = extractDataverseArray(usersRes);
    const liveIssues = extractDataverseArray(issuesRes);
    const liveProcedures = extractDataverseArray(proceduresRes);

    // We are connected to live Dataverse if the host resolved any entity successfully
    const isLiveConnected = [
      engagementsRes,
      assessmentsRes,
      assignmentsRes,
      tmRolesRes,
      usersRes,
      issuesRes,
      proceduresRes
    ].some((r) => r.status === 'fulfilled' && r.value?.success !== false);

    if (!isLiveConnected) {
      console.info(
        '[DataverseReportingService] Dataverse services rejected or unauthenticated (running in standalone offline mode).'
      );
      return notifyReportingPayload({
        jobs: [],
        assessments: [],
        isLiveConnected: false,
        diagnostics,
        error: engagementsRes.status === 'rejected' ? (engagementsRes as any).reason : engagementsRes.value?.error
      });
    }

    if (liveEngagements.length === 0) {
      console.info(
        '[DataverseReportingService] Successfully connected to Microsoft Dataverse! Table iar_engagementses currently contains 0 records.'
      );
      return notifyReportingPayload({
        jobs: [],
        assessments: liveAssessments,
        isLiveConnected: true,
        diagnostics
      });
    }


    // Helper to get property value ignoring casing and punctuation
    const getProp = (obj: any, ...propNames: string[]): any => {
      if (!obj || typeof obj !== 'object') return undefined;
      for (const p of propNames) {
        if (obj[p] !== undefined && obj[p] !== null) return obj[p];
      }
      const lowerMap = new Map<string, string>();
      for (const k of Object.keys(obj)) {
        lowerMap.set(k.toLowerCase().replace(/[^a-z0-9]/g, ''), k);
      }
      for (const p of propNames) {
        const cleanP = p.toLowerCase().replace(/[^a-z0-9]/g, '');
        const actualKey = lowerMap.get(cleanP);
        if (actualKey && obj[actualKey] !== undefined && obj[actualKey] !== null) {
          return obj[actualKey];
        }
      }
      return undefined;
    };

    // Helper to normalize GUIDs and unwrap OData references (e.g. /iar_assessments(113) or {guid})
    const normalizeId = (val: any): string => {
      if (!val) return '';
      let s = '';
      if (typeof val === 'object') {
        s = val.id || val.iar_engagementsid || val.iar_engagementid || val.iar_assessmentid || val.iar_assessmentsid || val.name || val.iar_name || '';
      } else {
        s = String(val);
      }
      if (!s) return '';
      const parenMatch = s.match(/\((['"]?)([^)'"]+)\1\)/);
      if (parenMatch) {
        s = parenMatch[2];
      }
      return s.toLowerCase().replace(/[{}]/g, '').trim();
    };

    // Helper to extract assessment year from assessment record
    const getAssessmentYear = (asm: any, idx?: number): string => {
      if (!asm) return '2026';

      // 1. Direct value match for 4-digit years 2020-2035 on ANY property
      for (const [, v] of Object.entries(asm)) {
        if (v === 2024 || v === '2024') return '2024';
        if (v === 2025 || v === '2025') return '2025';
        if (v === 2026 || v === '2026') return '2026';
        if (v === 2027 || v === '2027') return '2027';
        if (v === 2023 || v === '2023') return '2023';
      }

      // 2. Check any key containing 'year' (case-insensitive)
      for (const [k, v] of Object.entries(asm)) {
        if (k.toLowerCase().includes('year') && v !== undefined && v !== null) {
          const s = String(v).trim();
          const m = s.match(/20\d{2}/);
          if (m) return m[0];
          if (s.length === 4 && !isNaN(Number(s))) return s;
        }
      }

      // 3. Check title or name for 4-digit year (e.g. "2024 Internal Audit Assessment")
      const title = getProp(asm, 'iar_assessmenttitle', 'assessmenttitle', 'title');
      if (title) {
        const m = String(title).match(/\b(202[0-9]|203[0-5])\b/);
        if (m) return m[0];
      }

      // 4. Check known TeamMate IDs
      const name = String(getProp(asm, 'iar_name', 'name') || '').trim();
      if (name === '113' || name === 'ASM-2024') return '2024';
      if (name === '138' || name === 'ASM-2025') return '2025';
      if (name === '143' || name === 'ASM-2026') return '2026';

      // 5. Check start date
      const startDate = getProp(asm, 'iar_startdate', 'startdate');
      if (startDate) {
        const d = new Date(startDate);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear().toString();
          if (y.startsWith('20')) return y;
        }
      }

      // 6. Check end date
      const endDate = getProp(asm, 'iar_enddate', 'enddate');
      if (endDate) {
        const d = new Date(endDate);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear().toString();
          if (y.startsWith('20')) return y;
        }
      }

      // 7. If index provided among assessments: 0 -> 2024, 1 -> 2025, 2 -> 2026
      if (idx !== undefined && idx >= 0) {
        const defaultYears = ['2024', '2025', '2026', '2027'];
        if (defaultYears[idx]) return defaultYears[idx];
      }

      return '2026';
    };

    // Helper lookup dictionaries for assessments
    const assessmentMap = new Map<string, any>();
    const assessmentByYear = new Map<string, any>();
    const asmDetailsForDiag: string[] = [];

    liveAssessments.forEach((asm: any, idx: number) => {
      const year = getAssessmentYear(asm, idx);
      asm._resolvedYear = year;

      // Index every possible ID and name attribute on the assessment record
      for (const [, v] of Object.entries(asm)) {
        if (v !== undefined && v !== null && typeof v !== 'object') {
          const s = String(v).trim();
          if (s) {
            assessmentMap.set(s, asm);
            assessmentMap.set(s.toLowerCase(), asm);
            const norm = normalizeId(s);
            if (norm) assessmentMap.set(norm, asm);
          }
        }
      }

      const rawId = getProp(asm, 'iar_assessmentid', 'iar_assessmentsid', 'assessmentid', 'id');
      const rawName = getProp(asm, 'iar_name', 'name');
      const rawTitle = getProp(asm, 'iar_assessmenttitle', 'assessmenttitle', 'title');

      if (rawId) {
        assessmentMap.set(normalizeId(rawId), asm);
        assessmentMap.set(String(rawId).trim(), asm);
        assessmentMap.set(String(rawId).trim().toLowerCase(), asm);
      }
      if (rawName) {
        assessmentMap.set(String(rawName).trim(), asm);
        assessmentMap.set(String(rawName).trim().toLowerCase(), asm);
      }
      if (rawTitle) {
        assessmentMap.set(String(rawTitle).trim(), asm);
        assessmentMap.set(String(rawTitle).trim().toLowerCase(), asm);
      }
      if (year) {
        assessmentByYear.set(year, asm);
      }

      asmDetailsForDiag.push(`[#${idx + 1}] ID:${rawId || 'N/A'} Name:${rawName || 'N/A'} Title:${rawTitle || 'N/A'} -> Year:${year}`);
    });

    const userByEmail = new Map<string, any>();
    const userById = new Map<string, any>();
    liveUsers.forEach((u: any) => {
      if (u.internalemailaddress) userByEmail.set(u.internalemailaddress.toLowerCase().trim(), u);
      if (u.domainname) userByEmail.set(u.domainname.toLowerCase().trim(), u);
      if (u.fullname) userByEmail.set(u.fullname.toLowerCase().trim(), u);
      if (u.systemuserid) {
        userById.set(u.systemuserid, u);
        userById.set(normalizeId(u.systemuserid), u);
      }
    });

    const tmRoleByTmId = new Map<string, any>();
    liveTmRoles.forEach((r: any) => {
      if (r.iar_tmid !== undefined && r.iar_tmid !== null) {
        tmRoleByTmId.set(String(r.iar_tmid), r);
        tmRoleByTmId.set(r.iar_tmid, r);
      }
      if (r.iar_logickey) {
        tmRoleByTmId.set(String(r.iar_logickey).toUpperCase(), r);
      }
      if (r.iar_name) {
        tmRoleByTmId.set(String(r.iar_name).toLowerCase(), r);
      }
    });

    // Helper to comprehensively match security assignment records to an engagement
    const matchAssignmentToEngagement = (asg: any, eng: any): boolean => {
      if (!asg || !eng) return false;

      // 1. Gather all possible IDs/identifiers of the engagement
      const engGuid = normalizeId(getProp(eng, 'iar_engagementsid', 'id'));
      const engTmId = String(getProp(eng, 'iar_name', 'name') || '').trim().toLowerCase();
      const engCode = String(getProp(eng, 'iar_engagementcode', 'engagementcode') || '').trim().toLowerCase();
      const engTitle = String(getProp(eng, 'iar_engagementname', 'engagementname') || '').trim().toLowerCase();

      // 2. Gather all possible foreign keys/identifiers on the assignment record
      // (a) Lookup GUIDs
      const asgFkGuid = normalizeId(
        getProp(
          asg,
          '_iar_engagementid_value',
          '_iar_EngagementID_value',
          'iar_engagementid',
          'iar_EngagementID',
          'engagementid'
        )
      );

      if (engGuid && asgFkGuid && engGuid === asgFkGuid) return true;

      // (b) Check if asg.iar_engagementid is an object
      const asgLookupObj = getProp(asg, 'iar_engagementid', 'iar_EngagementID', 'engagementid');
      if (asgLookupObj && typeof asgLookupObj === 'object') {
        const objGuid = normalizeId(asgLookupObj.id || asgLookupObj.iar_engagementsid || asgLookupObj._iar_engagementid_value);
        if (engGuid && objGuid && engGuid === objGuid) return true;

        const objName = String(asgLookupObj.name || asgLookupObj.iar_name || asgLookupObj.iar_engagementname || '').trim().toLowerCase();
        if (objName) {
          if (engTmId && objName === engTmId) return true;
          if (engCode && objName === engCode) return true;
          if (engTitle && (objName === engTitle || engTitle.includes(objName))) return true;
        }
      }

      // (c) Companion Name / Formatted Value attributes
      const asgLookupName = String(
        getProp(
          asg,
          'iar_engagementidname',
          'iar_EngagementIDName',
          '_iar_engagementid_value@OData.Community.Display.V1.FormattedValue',
          '_iar_EngagementID_value@OData.Community.Display.V1.FormattedValue'
        ) || ''
      ).trim().toLowerCase();

      if (asgLookupName) {
        if (engTmId && asgLookupName === engTmId) return true;
        if (engCode && asgLookupName === engCode) return true;
        if (engTitle && (asgLookupName === engTitle || engTitle.includes(asgLookupName))) return true;
        if (engGuid && normalizeId(asgLookupName) === engGuid) return true;
      }

      // (d) Direct string check on asgFkGuid against TeamMate ID or Code
      if (asgFkGuid) {
        if (engTmId && asgFkGuid === engTmId) return true;
        if (engCode && asgFkGuid === engCode) return true;
      }

      // (e) Check OData bind string
      const odataBind = String(
        getProp(asg, 'iar_EngagementID@odata.bind', 'iar_engagementid@odata.bind') || ''
      ).trim().toLowerCase();
      if (odataBind) {
        if (engGuid && odataBind.includes(engGuid)) return true;
        if (engTmId && odataBind.includes(engTmId)) return true;
        if (engCode && odataBind.includes(engCode)) return true;
      }

      // (f) Deep scan: any property key containing 'engagement' or 'eng'
      for (const [k, v] of Object.entries(asg)) {
        if (v !== undefined && v !== null && (k.toLowerCase().includes('engagement') || k.toLowerCase().includes('eng'))) {
          if (typeof v === 'string' || typeof v === 'number') {
            const strVal = String(v).trim().toLowerCase();
            const normVal = normalizeId(strVal);
            if (engGuid && normVal === engGuid) return true;
            if (engTmId && strVal === engTmId) return true;
            if (engCode && strVal === engCode) return true;
            if (engTitle && strVal === engTitle) return true;
          }
        }
      }

      return false;
    };

    // Map each Dataverse engagement row into the unified Code App job model
    const transformedJobs: any[] = [];
    const distribution: Record<string, number> = {};
    const rawFKCounts: Record<string, number> = {};
    const sampleEngFKDiagList: string[] = [];
    const sampleMatchedStaffings: string[] = [];
    let unstaffedEngagementsCount = 0;
    
    for (const eng of liveEngagements) {
      try {
        const engId = getProp(eng, 'iar_engagementsid', 'id') || eng.iar_engagementsid;
        const engCode = getProp(eng, 'iar_engagementcode', 'engagementcode', 'iar_name', 'name') || engId;
        const engName = getProp(eng, 'iar_engagementname', 'engagementname', 'name') || 'Engagement ' + engCode;
        const normEngId = normalizeId(engId);
        const normEngCode = String(engCode || '').trim().toLowerCase();
        const normEngName = String(getProp(eng, 'iar_name', 'name') || '').trim().toLowerCase();

        // 1. Take the explicit Assessment Lookup column from iar_engagements
        // In Dataverse, the lookup attribute is iar_assessmentid, stored as _iar_assessmentid_value (GUID)
        // Companion display text is iar_assessmentidname (or FormattedValue)
        const fkGuid = String(
          eng._iar_assessmentid_value ||
          (eng as any)._iar_AssessmentID_value ||
          (eng as any)._iar_assessmentsid_value ||
          (typeof eng.iar_assessmentid === 'string' ? eng.iar_assessmentid : ((eng.iar_assessmentid as any)?.id || (eng.iar_assessmentid as any)?.iar_assessmentid || (eng.iar_assessmentid as any)?.iar_assessmentsid)) ||
          (typeof (eng as any).iar_AssessmentID === 'string' ? (eng as any).iar_AssessmentID : ((eng as any).iar_AssessmentID?.id || (eng as any).iar_AssessmentID?.iar_assessmentid)) ||
          ''
        ).trim();

        const fkName = String(
          (eng as any).iar_assessmentidname ||
          (eng as any).iar_AssessmentIDName ||
          (eng as any)['_iar_assessmentid_value@OData.Community.Display.V1.FormattedValue'] ||
          (typeof eng.iar_assessmentid === 'object' ? ((eng.iar_assessmentid as any)?.name || (eng.iar_assessmentid as any)?.iar_name) : '') ||
          (typeof (eng as any).iar_AssessmentID === 'object' ? ((eng as any).iar_AssessmentID?.name || (eng as any).iar_AssessmentID?.iar_name) : '') ||
          ''
        ).trim();

        const odataBind = String((eng as any)['iar_AssessmentID@odata.bind'] || (eng as any)['iar_assessmentid@odata.bind'] || '').trim();
        let odataBindGuid = '';
        if (odataBind) {
          const m = odataBind.match(/\((['"]?)([^)'"]+)\1\)/);
          if (m) odataBindGuid = m[2].trim();
        }

        // Match engagement to parent assessment strictly using the lookup column
        let matchedAsm: any = null;

        // Priority 1: Match by lookup GUID against assessment primary key
        if (fkGuid && fkGuid !== '[object Object]') {
          matchedAsm =
            assessmentMap.get(normalizeId(fkGuid)) ||
            assessmentMap.get(fkGuid) ||
            assessmentMap.get(fkGuid.toLowerCase());
        }

        // Priority 2: Match by OData binding GUID
        if (!matchedAsm && odataBindGuid) {
          matchedAsm =
            assessmentMap.get(normalizeId(odataBindGuid)) ||
            assessmentMap.get(odataBindGuid) ||
            assessmentMap.get(odataBindGuid.toLowerCase());
        }

        // Priority 3: Match by lookup companion name (e.g. TeamMate ID "113", "138", "143" or Assessment Title)
        if (!matchedAsm && fkName && fkName !== '[object Object]') {
          matchedAsm =
            assessmentMap.get(fkName) ||
            assessmentMap.get(fkName.toLowerCase()) ||
            assessmentMap.get(normalizeId(fkName));
        }

        // Priority 4: Match TeamMate Assessment ID conventions (113 -> 2024, 138 -> 2025, 143 -> 2026)
        if (!matchedAsm) {
          const combinedKeys = `${fkName} ${fkGuid} ${odataBindGuid}`.toLowerCase();
          if (combinedKeys.includes('113')) matchedAsm = assessmentByYear.get('2024');
          else if (combinedKeys.includes('138')) matchedAsm = assessmentByYear.get('2025');
          else if (combinedKeys.includes('143')) matchedAsm = assessmentByYear.get('2026');
        }

        // Priority 5: Scan any other properties mentioning assessment on this engagement
        if (!matchedAsm) {
          for (const [k, v] of Object.entries(eng)) {
            if ((k.toLowerCase().includes('assess') || k.toLowerCase().includes('asm')) && v) {
              const valStr = typeof v === 'object' ? JSON.stringify(v) : String(v);
              const found = assessmentMap.get(normalizeId(valStr)) || assessmentMap.get(valStr) || assessmentMap.get(valStr.toLowerCase());
              if (found) {
                matchedAsm = found;
                break;
              }
            }
          }
        }

        // Priority 6: If still unmatched, fall back to matching liveAssessments by year in engagement code
        if (!matchedAsm) {
          const yearInCode = String(engCode || '').match(/^202[0-9]/)?.[0];
          if (yearInCode && assessmentByYear.has(yearInCode)) {
            matchedAsm = assessmentByYear.get(yearInCode);
          }
        }

        const rawFK = fkGuid || fkName || odataBindGuid || 'UNLINKED';
        rawFKCounts[rawFK] = (rawFKCounts[rawFK] || 0) + 1;

        if (sampleEngFKDiagList.length < 5) {
          sampleEngFKDiagList.push(
            `"${engCode}": fkGuid=${fkGuid.slice(0, 8)}... fkName="${fkName}" -> Matched Year: ${matchedAsm?._resolvedYear || 'UNMATCHED'}`
          );
        }

        const asmYear = matchedAsm?._resolvedYear || (liveAssessments.length > 0 ? (liveAssessments[0] as any)._resolvedYear : '2026');
        const asmId = getProp(matchedAsm, 'iar_assessmentid', 'iar_assessmentsid', 'assessmentid', 'id') || fkGuid || `ASM-${asmYear}`;
        const asmName = getProp(matchedAsm, 'iar_assessmenttitle', 'assessmenttitle', 'title') || `${asmYear} Internal Audit Assessments`;
        const asmStatus = getProp(matchedAsm, 'iar_assessmentstate', 'assessmentstate', 'status') || 'Open';

        distribution[asmYear] = (distribution[asmYear] || 0) + 1;

        // 2. Resolve Security Assignments for this engagement
        const engAssignments = liveAssignments.filter((asg: any) => matchAssignmentToEngagement(asg, eng));

        const roster: any[] = [];
        const assignedUsersList: any[] = [];

        engAssignments.forEach((asg: any) => {
          const rawEmail = getProp(asg, 'iar_useremailid', 'iar_UserEmailID', 'useremailid', 'email') || '';
          const email = String(rawEmail).toLowerCase().trim();

          const tmRoleId = String(getProp(asg, 'iar_tmroleid', 'iar_TMRoleID', 'tmroleid', 'roleid') || '').trim();
          const tmRoleName = String(getProp(asg, 'iar_tmrolename', 'iar_TMRoleName', 'tmrolename', 'rolename') || '').trim();
          const tmUserId = String(getProp(asg, 'iar_tmuserid', 'iar_TMUserID', 'tmuserid', 'userid') || '').trim();
          const asgId = String(getProp(asg, 'iar_securityassignmentsid', 'iar_SecurityAssignmentsId', 'id') || '').trim();

          // Match systemuser
          let matchedUser = email ? userByEmail.get(email) : null;
          if (!matchedUser && email) {
            const prefix = email.split('@')[0];
            matchedUser = userByEmail.get(prefix);
            if (!matchedUser) {
              matchedUser = liveUsers.find((u: any) => {
                const uEmail = String(u.internalemailaddress || u.domainname || '').toLowerCase();
                const uName = String(u.fullname || '').toLowerCase();
                return (prefix && (uEmail.includes(prefix) || uName.includes(prefix))) ||
                       (email && uEmail === email);
              });
            }
          }
          if (!matchedUser && tmUserId) {
            matchedUser = liveUsers.find((u: any) => {
              const uTmId = String(getProp(u, 'iar_tmuserid', 'employeeid', 'systemuserid') || '').toLowerCase();
              return uTmId === tmUserId.toLowerCase();
            });
          }

          // Resolve TeamMate role details
          const tmRole =
            tmRoleByTmId.get(tmRoleId) ||
            tmRoleByTmId.get(String(tmRoleId)) ||
            (tmRoleName ? tmRoleByTmId.get(tmRoleName.toLowerCase()) : null);

          // tmRole.iar_rolename in Dataverse is Choice integer (828900000..828900009)
          const roleLabel =
            tmRole?.iar_rolenamename ||
            (tmRole?.iar_rolename && (Iar_tmrolesesiar_rolename as any)[tmRole.iar_rolename]) ||
            tmRoleName ||
            'Auditor';
          const roleTitle = String(roleLabel);
          const roleAbbr = getRoleAbbreviation(tmRoleName || tmRole?.iar_logickey || tmRoleId || roleTitle);

          const rawFullName = matchedUser?.fullname || matchedUser?.name;
          let userName = '';
          if (rawFullName) {
            userName = String(rawFullName).trim();
          } else if (email) {
            userName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
          } else {
            userName = 'Assigned Auditor';
          }

          const userInitials =
            (matchedUser?.firstname?.[0] || '') + (matchedUser?.lastname?.[0] || '') ||
            userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ||
            'U';

          const userObj = {
            id: matchedUser?.systemuserid || asgId || `ASG-${assignedUsersList.length + 1}`,
            name: userName,
            displayName: userName.includes('Tamilselvan') ? 'Tamilselvan' : userName,
            email: email,
            initials: userInitials,
            roleId: String(tmRole?.iar_logickey || tmRoleId || tmRoleName || 'it-auditor').toLowerCase(),
            roleName: roleTitle,
            roleAbbr: roleAbbr,
            isAlternateRole: false
          };

          assignedUsersList.push(userObj);
          roster.push({
            role: roleTitle,
            name: userName,
            avatar: userInitials,
            status: roleTitle.includes('Auditor') || roleTitle.includes('Staff') ? 'Assigned' : 'Reviewer',
            users: [userObj]
          });
        });

        // Exclude unstaffed engagements from the reporting queue (governance requirement)
        if (assignedUsersList.length === 0) {
          unstaffedEngagementsCount++;
          continue;
        }

        if (sampleMatchedStaffings.length < 5) {
          sampleMatchedStaffings.push(
            `"${engCode}": ${assignedUsersList.map(u => `${u.name} (${u.roleAbbr})`).join(', ')}`
          );
        }

        // 3. Resolve Findings / Issues for this engagement
        const engIssues = liveIssues
          .filter((iss: any) => {
            const issEngFk = normalizeId(
              iss._iar_engagementid_value ||
              iss.iar_engagementid ||
              iss['iar_EngagementID@odata.bind'] ||
              iss['iar_engagementid@odata.bind']
            );
            if (normEngId && issEngFk && normEngId === issEngFk) return true;

            const issEngName = String(iss.iar_engagementidname || iss.iar_engagementid || '').trim().toLowerCase();
            if (issEngName) {
              if (normEngCode && issEngName === normEngCode) return true;
              if (normEngName && issEngName === normEngName) return true;
            }
            return false;
          })
          .map((iss: any) => {
            const rawStatus = iss.iar_issuestatus;
            const statusText = ISSUE_STATUS_MAP[rawStatus] || 'Pending Staff';
            const isIT = iss.iar_function === 822500000;

            // Owner resolution from Dataverse systemusers lookup
            const pboId = iss._iar_primarybusinessowner_value ? normalizeId(iss._iar_primarybusinessowner_value) : '';
            const pboUser = pboId ? userById.get(pboId) : null;
            const ownerId = iss._iar_currentowner_value ? normalizeId(iss._iar_currentowner_value) : '';
            const ownerUser = ownerId ? userById.get(ownerId) : null;

            // Creator resolution
            const creatorId = iss._createdby_value ? normalizeId(iss._createdby_value) : '';
            const creatorUser = creatorId ? userById.get(creatorId) : null;

            let resolvedIssueOwner = ownerUser?.fullname || '';
            if (!resolvedIssueOwner) {
              if (statusText.toLowerCase().includes('business')) {
                resolvedIssueOwner = pboUser?.fullname || 'Business Contact';
              } else if (assignedUsersList.length > 0) {
                // Find user in assignedUsersList matching current review level
                const sLower = statusText.toLowerCase();
                const matchedAssignee = assignedUsersList.find((u: any) => {
                  const { baseRole } = getRoleDetails(u.roleId || u.roleName);
                  if (sLower.includes('staff') || sLower.includes('draft')) return baseRole === 'auditor';
                  if (sLower.includes('tc') || sLower.includes('coordinator')) return baseRole === 'team-coordinator';
                  if (sLower.includes('manager')) return baseRole === 'manager';
                  if (sLower.includes('director')) return baseRole === 'director';
                  if (sLower.includes('vp')) return baseRole === 'vp';
                  return false;
                });
                resolvedIssueOwner = matchedAssignee?.displayName || matchedAssignee?.name || assignedUsersList[0]?.displayName || assignedUsersList[0]?.name;
              } else {
                resolvedIssueOwner = creatorUser?.fullname || 'Assigned Auditor';
              }
            }

            // Lookups & extended values
            const critName = iss._iar_criticality_value || iss.iar_criticalityname || 'Moderate';
            const pboName = pboUser?.fullname || iss.iar_primarybusinessownername || '';
            const procId = iss._iar_testprocedure_value || iss.iar_testprocedure || '';
            const procCode = iss.iar_testprocedurename || 'TP-101';

            return {
              id: iss.iar_issuesid,
              jobId: engCode,
              engagementId: engId,
              title: iss.iar_issuetitle || iss.iar_name || 'Untitled Issue',
              header: iss.iar_issuetitle || iss.iar_name || 'Untitled Issue',
              status: statusText,
              currentLevel: statusText,
              criticality: critName,
              tech: isIT ? 'IT' : 'FinOps',
              function: isIT ? 'IT' : 'FinOps',
              reportReference: iss.iar_reportreference || 1,
              testProcedureId: procId,
              testProcedureCode: procCode,
              testProcedureTitle: procCode,
              originalIssue: iss.iar_originalissue || '',
              description: iss.iar_description || iss.iar_rectifiedissue || '',
              issueNarrative: iss.iar_description || iss.iar_rectifiedissue || '',
              rootCause: iss.iar_rootcause || '',
              rootCauseType: iss.iar_issuecausetypename || '',
              impact: iss.iar_impact || '',
              recommendation: iss.iar_recommendation || '',
              nonComplianceReferences: iss.iar_noncompliancereferences || '',
              summaryFinding: iss.iar_summaryfinding || '',
              mitigatingControl: iss.iar_mitigatingcontrol || '',
              mitigatingControls: iss.iar_mitigatingcontrol || '',
              auditorResponse: iss.iar_auditorresponse || '',
              exceptionRemedComments: iss.iar_exceptionremedcomments || '',
              exceptionRemedDate: iss.iar_exceptionremeddate || '',
              hasExceptionRemedDate: !!iss.iar_exceptionremeddate,
              agreedRemediationDate: iss.iar_agreedremediationdate || '',
              salesUsd: iss.iar_salesusd,
              ibtUsd: iss.iar_ibtusd,
              netIncomeUsd: iss.iar_netincomeusd,
              totalAssetsUsd: iss.iar_totalassetsusd,
              soxReportable: iss.iar_soxreportable ? 'Yes' : 'No',
              primaryBusinessOwnerId: pboId,
              primaryBusinessOwnerName: pboName,
              businessContactName: pboName,
              accountableContact: pboName || 'Business Owner',
              accountableFunction: iss.iar_accountablefunctionname || '',
              accountableProcessArea: iss.iar_processareaname || '',
              processArea: iss.iar_processareaname || '',
              issueType: iss.iar_issuetypename || '',
              issueSource: iss.iar_issuesourcename || '',
              keyTheme: iss.iar_keythemename || '',
              repeatFinding: iss.iar_repeatfindingname || 'No',
              impactedRegion: iss.iar_impactedregionname || '',
              impactedSector: iss.iar_impactedsectorname || '',
              impactedMrc: iss.iar_impactedmrcname || '',
              itAssetAccountableSector: iss.iar_itassetaccountablesectorname || '',
              quarterImpacted: iss.iar_quarterimpactedname || '',
              workflowRemarks: iss.iar_workflowremarks || '',
              lockStatus: iss.iar_lockstatus || false,
              lockedBy: iss._iar_lockedby_value || null,
              primaryContact: pboName,
              owner: resolvedIssueOwner,
              currentOwner: resolvedIssueOwner,
              createdBy: creatorUser?.fullname || 'Auditor',
              lastEditedBy: creatorUser?.fullname || 'Auditor',
              createdAt: iss.createdon || new Date().toISOString(),
              updatedAt: iss.modifiedon || new Date().toISOString(),
              activeAiVersionNumber: 1
            };
          });

        // 4. Resolve Test Procedures for this engagement
        const engProcedures = liveProcedures
          .filter(
            (tp: any) =>
              tp._iar_engagementid_value === engId ||
              tp.iar_engagementid === engId ||
              tp['iar_EngagementID@odata.bind']?.includes?.(engId)
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

        const resolvedLeadOwner = assignedUsersList[0]?.name || 'Unassigned';

        const baseJob = {
          id: engId,
          jobId: engCode,
          reportId: engId,
          fileName: engName,
          engagement: engName,
          engagementName: engName,
          plant: 'Enterprise Operations',
          year: parseInt(asmYear, 10) || 2026,
          assessmentYear: asmYear,
          assessmentId: asmId,
          assessmentName: asmName,
          assessmentStatus: asmStatus,
          leadOwner: resolvedLeadOwner,
          status: mappedReportStatus.status,
          subStatus: mappedReportStatus.workflowStatus,
          workflowStatus: mappedReportStatus.workflowStatus,
          executionStatus: mappedReportStatus.status === 'Completed' ? 'Completed' : (mappedReportStatus.status === 'Not Started' ? 'Pending' : 'Running'),
          issuesList: engIssues,
          testProcedures: engProcedures,
          roster: roster,
          assignedUsers: assignedUsersList,
          lastUpdated: formatDateTimeSafe(eng.modifiedon)
        };

        // 6. Calculate Workflow State (Owners, Queues, Breakdown)
        const wf = getEngagementWorkflowState(baseJob);

        transformedJobs.push({
          ...baseJob,
          currentQueue: wf.queue,
          currentQueueList: wf.queueList,
          currentOwner: wf.ownerText,
          currentOwners: wf.owners,
          ownersByRole: wf.ownersByRole,
          queueVariant: wf.queueVariant,
          aging: mappedReportStatus.status === 'Not Started' ? '1 day 2.15 Hours' : (mappedReportStatus.status === 'Completed' ? '11 days 4.00 Hours' : '3 days 5.20 Hours')
        });
      } catch (engErr) {
        console.warn(`[DataverseReportingService] Skipped engagement ${eng.iar_engagementsid} due to parse error:`, engErr);
      }
    }

    // Format assessment options for filter select
    const formattedAssessments = liveAssessments.map((asm: any, idx: number) => {
      const year = asm._resolvedYear || getAssessmentYear(asm, idx);
      const rawId = getProp(asm, 'iar_assessmentid', 'assessmentid', 'id') || `ASM-${year}`;
      const rawTitle = getProp(asm, 'iar_assessmenttitle', 'assessmenttitle', 'title') || `${year} Internal Audit Assessments`;
      const rawState = getProp(asm, 'iar_assessmentstate', 'assessmentstate', 'status') || 'Open';
      return {
        id: rawId,
        name: rawTitle,
        year: year,
        status: rawState
      };
    });

    if (diagnostics) {
      diagnostics['Assessments Summary'] = {
        status: 'fulfilled',
        error: asmDetailsForDiag.join(' | ') || 'None'
      };
      diagnostics['Engagement Distribution'] = {
        status: 'fulfilled',
        error: Object.entries(distribution).map(([yr, cnt]) => `${yr}: ${cnt}`).join(', ') || 'None'
      };
      diagnostics['Engagement Lookup Samples'] = {
        status: 'fulfilled',
        error: sampleEngFKDiagList.join(' || ') || 'None'
      };
      diagnostics['Engagement FK Counts'] = {
        status: 'fulfilled',
        error: Object.entries(rawFKCounts).map(([fk, cnt]) => `${fk.slice(0, 24)} (${cnt})`).join(' | ') || 'None'
      };
      diagnostics['Staffing Summary'] = {
        status: 'fulfilled',
        error: `Total Engagements: ${liveEngagements.length} | Staffed (Visible): ${transformedJobs.length} | Unstaffed (Excluded): ${unstaffedEngagementsCount}`
      };
      diagnostics['Sample Staffed Audits'] = {
        status: 'fulfilled',
        error: sampleMatchedStaffings.join(' || ') || 'None matched'
      };
      diagnostics['Security Assignments Sample'] = {
        status: 'fulfilled',
        count: liveAssignments.length,
        error: liveAssignments.length > 0
          ? JSON.stringify(liveAssignments.slice(0, 5).map(a => ({
              asgId: getProp(a, 'iar_securityassignmentsid', 'id'),
              name: getProp(a, 'iar_name', 'name'),
              engIdFk: getProp(a, '_iar_engagementid_value', 'iar_engagementid'),
              engNameFk: getProp(a, 'iar_engagementidname', '_iar_engagementid_value@OData.Community.Display.V1.FormattedValue'),
              email: getProp(a, 'iar_useremailid', 'iar_UserEmailID', 'email'),
              role: getProp(a, 'iar_tmrolename', 'iar_tmroleid')
            })))
          : 'liveAssignments array is empty (count: 0)'
      };
      diagnostics['Raw Assessments JSON'] = {
        status: 'fulfilled',
        error: JSON.stringify(liveAssessments.map((a: any) => ({
          id: a.iar_assessmentid,
          name: a.iar_name,
          title: a.iar_assessmenttitle,
          year: a.iar_year || a.year,
          start: a.iar_startdate
        })))
      };
    }

    return notifyReportingPayload({
      jobs: transformedJobs,
      assessments: formattedAssessments,
      isLiveConnected: true,
      diagnostics
    });
  } catch (err: any) {
    console.error('[DataverseReportingService] Failed to load from Dataverse:', err);
    if (diagnostics) {
      diagnostics['Mapping Error'] = {
        status: 'failed',
        error: err?.message || String(err)
      };
    }
    return notifyReportingPayload({
      jobs: [],
      assessments: [],
      isLiveConnected: false,
      diagnostics,
      error: err
    });
  }
}

export interface CreateDataverseIssueInput {
  engagementId: string;
  testProcedureCode?: string;
  testProcedureTitle?: string;
  testProcedureId?: string;
  function?: 'IT' | 'FinOps';
  title: string;
  description?: string;
  originalIssue?: string;
  rootCause?: string;
  rootCauseType?: string;
  impact?: string;
  recommendation?: string;
  nonComplianceReferences?: string;
  criticality?: string;
  processArea?: string;
  accountableProcessArea?: string;
  issueType?: string;
  issueCauseType?: string;
  issueSource?: string;
  keyTheme?: string;
  repeatFinding?: 'No' | 'Yes';
  soxReportable?: 'No' | 'Yes';
  primaryBusinessOwnerId?: string;
  primaryBusinessOwnerName?: string;
  accountableFunction?: string;
  impactedRegion?: string;
  impactedSector?: string;
  impactedMrc?: string;
  itAssetAccountableSector?: string;
  quarterImpacted?: string;
  salesUsd?: number | string;
  ibtUsd?: number | string;
  netIncomeUsd?: number | string;
  totalAssetsUsd?: number | string;
  summaryFinding?: string;
  mitigatingControl?: string;
  auditorResponse?: string;
  exceptionRemedComments?: string;
  exceptionRemedDate?: string;
  hasExceptionRemedDate?: boolean;
  status?: string;
  activeAiVersionNumber?: number;
  workflowRemarks?: string;
}

const ISSUE_STATUS_TO_DATAVERSE_CODE: Record<string, number> = {
  'Pending Staff': 822500000,
  'Pending TC': 822500001,
  'Pending Manager': 822500002,
  'Manager Completed (Waiting for Other Issues)': 822500003,
  'Manager Completed': 822500003,
  'Ready for Director Submission': 822500004,
  'Pending Director': 822500005,
  'Pending Business': 822500006,
  'Pending VP': 822500007,
  'Completed': 822500008,
  'Excluded': 822500009
};

/**
 * Creates an audit finding record in Dataverse (iar_issueses), logs the creation in iar_issuelogses,
 * and updates engagement reportstatus to 'Audit Report Inprogress' (822500001) if currently Not Started.
 */
export async function createDataverseIssue(
  input: CreateDataverseIssueInput,
  currentUser?: { name?: string; email?: string; userId?: string }
): Promise<any> {
  const cleanEngId = (input.engagementId || '').replace(/[{}]/g, '').trim();
  const rawStatus = input.status || 'Pending Staff';
  const statusCode = ISSUE_STATUS_TO_DATAVERSE_CODE[rawStatus] || 822500000;
  const issueNameCode = `ISS-${Date.now().toString().slice(-4)}`;

  // Parse numeric metrics safely
  const parseUSD = (v: any): number | undefined => {
    if (typeof v === 'number' && !isNaN(v)) return v;
    if (typeof v === 'string') {
      const num = parseFloat(v.replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) return num;
    }
    return undefined;
  };

  // Build Dataverse record payload
  const newIssueRecord: any = {
    iar_issueid: issueNameCode,
    iar_issuetitle: input.title.trim(),
    iar_description: (input.description || input.originalIssue || input.title).trim(),
    iar_originalissue: (input.originalIssue || input.description || input.title).trim(),
    iar_rootcause: (input.rootCause || `${input.issueCauseType || 'Process Gap'} identified during fieldwork.`).trim(),
    iar_impact: (input.impact || `Operational risk categorized as ${input.criticality || 'Major'}.`).trim(),
    iar_recommendation: (input.recommendation || 'Remediate identified control variance.').trim(),
    iar_noncompliancereferences: (input.nonComplianceReferences || 'Standard S-15: Operational Governance (STD-IAPP-S15)').trim(),
    iar_function: input.function === 'FinOps' ? 822500001 : 822500000,
    iar_issuestatus: statusCode,
    iar_soxreportable: input.soxReportable === 'Yes',
    iar_reportreference: 1,
    statecode: 0,
    statuscode: 1
  };

  // Bind parent engagement if valid GUID
  if (cleanEngId.includes('-')) {
    newIssueRecord['iar_EngagementID@odata.bind'] = `/iar_engagementses(${cleanEngId})`;
  }

  // Bind procedure if valid GUID provided
  if (input.testProcedureId && input.testProcedureId.includes('-')) {
    newIssueRecord['iar_TestProcedure@odata.bind'] = `/iar_procedureses(${input.testProcedureId.replace(/[{}]/g, '')})`;
  }

  // Bind primary business owner if provided
  if (input.primaryBusinessOwnerId && input.primaryBusinessOwnerId.includes('-')) {
    newIssueRecord['iar_PrimaryBusinessOwner@odata.bind'] = `/systemusers(${input.primaryBusinessOwnerId.replace(/[{}]/g, '')})`;
  }

  // Optional Financial Metrics
  const sUsd = parseUSD(input.salesUsd);
  if (sUsd !== undefined) newIssueRecord.iar_salesusd = sUsd;
  const ibt = parseUSD(input.ibtUsd);
  if (ibt !== undefined) newIssueRecord.iar_ibtusd = ibt;
  const ni = parseUSD(input.netIncomeUsd);
  if (ni !== undefined) newIssueRecord.iar_netincomeusd = ni;
  const ta = parseUSD(input.totalAssetsUsd);
  if (ta !== undefined) newIssueRecord.iar_totalassetsusd = ta;

  // Optional Narrative Details
  if (input.summaryFinding) newIssueRecord.iar_summaryfinding = input.summaryFinding.trim();
  if (input.mitigatingControl) newIssueRecord.iar_mitigatingcontrol = input.mitigatingControl.trim();
  if (input.auditorResponse) newIssueRecord.iar_auditorresponse = input.auditorResponse.trim();
  if (input.exceptionRemedComments) newIssueRecord.iar_exceptionremedcomments = input.exceptionRemedComments.trim();
  if (input.exceptionRemedDate) newIssueRecord.iar_exceptionremeddate = input.exceptionRemedDate;
  if (input.workflowRemarks) newIssueRecord.iar_workflowremarks = input.workflowRemarks;

  let createdIssueResult: any = null;
  try {
    const res: any = await Iar_issuesesService.create(newIssueRecord);
    createdIssueResult = res?.data || res?.value || res;
    console.info('[DataverseReportingService] Successfully created issue in Dataverse:', createdIssueResult);
  } catch (createErr) {
    console.warn('[DataverseReportingService] Direct Dataverse creation failed or running standalone:', createErr);
    createdIssueResult = {
      iar_issuesid: `iss-${Date.now()}`,
      iar_issueid: issueNameCode,
      ...newIssueRecord
    };
  }

  const createdId = createdIssueResult?.iar_issuesid || createdIssueResult?.id;

  // Step 2: Insert immutable audit trail entry in iar_issuelogses
  if (createdId && cleanEngId.includes('-')) {
    try {
      await Iar_issuelogsesService.create({
        iar_issuelogid: `LOG-${Date.now().toString().slice(-6)}`,
        iar_modules: 822500000 as any, // Issues
        iar_logtype: 1 as any, // Created
        iar_logsubtype: 9 as any, // Created
        iar_fieldreference: 'Issue',
        iar_fromdata: 'Draft',
        iar_todata: rawStatus,
        iar_workflowremarks: input.workflowRemarks || `Created by ${currentUser?.name || 'Auditor'}`,
        iar_loggeddatetime: new Date().toISOString(),
        'iar_EngagementID@odata.bind': `/iar_engagementses(${cleanEngId})`,
        'iar_IssueID@odata.bind': `/iar_issueses(${createdId})`,
        'iar_LoggedBy@odata.bind': currentUser?.userId && currentUser.userId.includes('-')
          ? `/systemusers(${currentUser.userId})`
          : undefined as any,
        statecode: 0 as any,
        statuscode: 1 as any
      });
    } catch (logErr) {
      console.warn('[DataverseReportingService] Logging creation in iar_issuelogses encountered notice:', logErr);
    }
  }

  // Step 3: Advance parent engagement status to 'Audit Report Inprogress' (822500001) if needed
  if (cleanEngId.includes('-')) {
    try {
      await Iar_engagementsesService.update(cleanEngId, {
        iar_reportstatus: 822500001 as any
      });
    } catch (engUpdateErr) {
      console.warn('[DataverseReportingService] Notice updating engagement reportstatus:', engUpdateErr);
    }
  }

  const mappedUiIssue: Issue = {
    id: createdId || `iss-${Date.now()}`,
    jobId: cleanEngId,
    engagementId: cleanEngId,
    title: input.title.trim(),
    header: input.title.trim(),
    criticality: (input.criticality as any) || 'Moderate',
    status: rawStatus as any,
    currentLevel: rawStatus,
    tech: input.function === 'FinOps' ? 'FinOps' : 'IT',
    function: input.function === 'FinOps' ? 'FinOps' : 'IT',
    reportReference: 1,
    testProcedureCode: input.testProcedureCode || 'TP-101',
    testProcedureTitle: input.testProcedureTitle || 'Audit Procedure',
    testProcedureId: input.testProcedureId,
    originalIssue: (input.originalIssue || input.description || input.title).trim(),
    description: (input.description || input.originalIssue || input.title).trim(),
    issueNarrative: (input.description || input.originalIssue || input.title).trim(),
    rootCause: (input.rootCause || `${input.issueCauseType || 'Process Gap'} identified during fieldwork.`).trim(),
    rootCauseType: input.issueCauseType,
    impact: (input.impact || `Operational risk categorized as ${input.criticality || 'Major'}.`).trim(),
    recommendation: (input.recommendation || 'Remediate identified control variance.').trim(),
    nonComplianceReferences: (input.nonComplianceReferences || 'Standard S-15: Operational Governance (STD-IAPP-S15)').trim(),
    activeAiVersionNumber: input.activeAiVersionNumber || 1,
    primaryBusinessOwnerId: input.primaryBusinessOwnerId,
    primaryBusinessOwnerName: input.primaryBusinessOwnerName,
    businessContactName: input.primaryBusinessOwnerName,
    accountableContact: input.primaryBusinessOwnerName || 'Business Owner',
    accountableFunction: input.accountableFunction,
    accountableProcessArea: input.accountableProcessArea,
    processArea: input.processArea,
    issueType: input.issueType,
    issueCauseType: input.issueCauseType,
    issueSource: input.issueSource,
    keyTheme: input.keyTheme,
    repeatFinding: input.repeatFinding,
    soxReportable: input.soxReportable,
    impactedRegion: input.impactedRegion,
    impactedSector: input.impactedSector,
    impactedMrc: input.impactedMrc,
    itAssetAccountableSector: input.itAssetAccountableSector,
    quarterImpacted: input.quarterImpacted,
    salesUsd: input.salesUsd,
    ibtUsd: input.ibtUsd,
    netIncomeUsd: input.netIncomeUsd,
    totalAssetsUsd: input.totalAssetsUsd,
    summaryFinding: input.summaryFinding,
    mitigatingControl: input.mitigatingControl,
    auditorResponse: input.auditorResponse,
    exceptionRemedComments: input.exceptionRemedComments,
    exceptionRemedDate: input.exceptionRemedDate,
    hasExceptionRemedDate: input.hasExceptionRemedDate,
    workflowRemarks: input.workflowRemarks,
    createdBy: currentUser?.name || 'Auditor',
    lastEditedBy: currentUser?.name || 'Auditor',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return {
    ...createdIssueResult,
    issue: mappedUiIssue
  };
}

/**
 * Fetches live issues for a specific engagement directly from Dataverse
 */
export async function fetchIssuesForEngagement(engagementId: string): Promise<Issue[]> {
  try {
    const payload = await fetchDataverseReportingData();
    const cleanId = (engagementId || '').replace(/[{}]/g, '').toLowerCase().trim();
    const foundJob = payload.jobs.find(j => {
      const jId = (j.id || '').replace(/[{}]/g, '').toLowerCase().trim();
      const jCode = (j.jobId || '').toLowerCase().trim();
      return jId === cleanId || jCode === cleanId;
    });
    return foundJob?.issuesList || [];
  } catch (err) {
    console.warn('[DataverseReportingService] fetchIssuesForEngagement error:', err);
    return [];
  }
}



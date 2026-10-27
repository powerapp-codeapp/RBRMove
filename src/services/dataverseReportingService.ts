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
import { Iar_taxonomiesesService } from '../generated/services/Iar_taxonomiesesService';
import { Iar_issuelogsesService } from '../generated/services/Iar_issuelogsesService';
import { Iar_issuecommentsesService } from '../generated/services/Iar_issuecommentsesService';
import { mockDataverseProvider } from './mock/mockDataverseProvider';

import {
  getEngagementWorkflowState,
  getRoleAbbreviation,
  getRoleDetails
} from '../modules/reporting/utils/reportingWorkflowEngine';
import { Iar_tmrolesesiar_rolename } from '../generated/models/Iar_tmrolesesModel';
import type { Issue, IssueComment, IssueLock, AuditTrailLog } from '../types/dataverse.types';

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

function extractDataverseArray(res: any): any[] {
  if (!res) return [];
  let target = res;
  if (typeof res === 'object' && 'status' in res) {
    if (res.status !== 'fulfilled') return [];
    target = res.value;
  }
  if (!target) return [];
  if (Array.isArray(target)) return target;
  if (Array.isArray(target.data)) return target.data;
  if (Array.isArray(target.value)) return target.value;
  if (target.data && Array.isArray(target.data.value)) return target.data.value;
  if (target.data && Array.isArray(target.data.data)) return target.data.data;
  return [];
}

export const isGuid = (val?: string | null): boolean => {
  if (!val || typeof val !== 'string') return false;
  const clean = val.replace(/[{}]/g, '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
};

export const extractCleanGuid = (val?: any): string => {
  if (!val) return '';
  if (typeof val === 'string') {
    const clean = val.replace(/[{}]/g, '').trim().toLowerCase();
    const match = clean.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    return match ? match[0].toLowerCase() : (isGuid(clean) ? clean : '');
  }
  if (typeof val === 'object') {
    return extractCleanGuid(
      val.id ||
      val.iar_issuesid ||
      val.iar_engagementsid ||
      val.systemuserid ||
      val.iar_issuecommentsid ||
      val._iar_issueid_value ||
      val._iar_engagementid_value
    );
  }
  return '';
};

/**
 * Timeout wrapper for Power Apps SDK calls.
 * If the host iframe bridge does not respond (e.g. running outside Power Apps host),
 * rejects cleanly after timeout instead of hanging indefinitely.
 */
function withTimeout<T>(promise: Promise<T>, ms: number = 30000, opName: string = 'Service'): Promise<T> {
  const isStandalone = typeof window !== 'undefined' && window.parent === window;
  const effectiveMs = isStandalone ? Math.min(ms, 2500) : ms;
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${opName} did not respond within ${effectiveMs}ms (host bridge unavailable).`));
    }, effectiveMs);
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
    procedures: { status: 'connecting' },
    taxonomies: { status: 'connecting' }
  };

  try {
    const [
      assessmentsRes,
      engagementsRes,
      assignmentsRes,
      tmRolesRes,
      usersRes,
      issuesRes,
      proceduresRes,
      taxonomiesRes
    ] = await Promise.allSettled([
      withTimeout(Iar_assessmentsService.getAll(), 30000, 'Iar_assessmentsService.getAll()'),
      withTimeout(Iar_engagementsesService.getAll(), 30000, 'Iar_engagementsesService.getAll()'),
      withTimeout(Iar_securityassignmentsesService.getAll(), 30000, 'Iar_securityassignmentsesService.getAll()'),
      withTimeout(Iar_tmrolesesService.getAll(), 30000, 'Iar_tmrolesesService.getAll()'),
      withTimeout(SystemusersService.getAll(), 30000, 'SystemusersService.getAll()'),
      withTimeout(Iar_issuesesService.getAll(), 30000, 'Iar_issuesesService.getAll()'),
      withTimeout(Iar_proceduresesService.getAll(), 30000, 'Iar_proceduresesService.getAll()'),
      withTimeout(Iar_taxonomiesesService.getAll(), 30000, 'Iar_taxonomiesesService.getAll()')
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
      procedures: parseReason(proceduresRes),
      taxonomies: parseReason(taxonomiesRes)
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
    const liveTaxonomies = extractDataverseArray(taxonomiesRes);

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
        '[DataverseReportingService] Dataverse services rejected or unauthenticated (running in standalone offline mode). Providing standalone offline fallback jobs.'
      );
      return notifyReportingPayload({
        jobs: getStandaloneOfflineJobs(),
        assessments: [
          { id: 'ASM-2026', year: 2026, name: '2026 Internal Audit Plan', status: 'Open' },
          { id: 'ASM-2025', year: 2025, name: '2025 Internal Audit Plan', status: 'Finalized' }
        ],
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

    // Build Taxonomy lookup maps from iar_taxonomieses (iar_taxonomiesid / iar_taxonomyid -> iar_taxonomyvalue)
    const taxonomyById = new Map<string, any>();
    liveTaxonomies.forEach((tax: any) => {
      const taxGuid = normalizeId(tax.iar_taxonomiesid || tax.id);
      if (taxGuid) taxonomyById.set(taxGuid, tax);
      if (tax.iar_taxonomyid) {
        taxonomyById.set(String(tax.iar_taxonomyid).toLowerCase().trim(), tax);
      }
      if (tax.iar_taxonomyvalue) {
        taxonomyById.set(String(tax.iar_taxonomyvalue).toLowerCase().trim(), tax);
      }
    });

    const resolveTaxonomyValue = (rawLookupVal: any, formattedOrNameVal?: any): string => {
      if (rawLookupVal) {
        if (typeof rawLookupVal === 'object') {
          const objVal = rawLookupVal.iar_taxonomyvalue || rawLookupVal.iar_taxonomyid || rawLookupVal.name;
          if (objVal) return String(objVal).trim();
        }
        const normKey = normalizeId(rawLookupVal);
        if (normKey && taxonomyById.has(normKey)) {
          const matched = taxonomyById.get(normKey);
          return String(matched.iar_taxonomyvalue || matched.iar_taxonomyid || '').trim();
        }
      }
      if (formattedOrNameVal) {
        const cleanName = String(formattedOrNameVal).trim();
        const lowerName = cleanName.toLowerCase();
        if (taxonomyById.has(lowerName)) {
          const matched = taxonomyById.get(lowerName);
          return String(matched.iar_taxonomyvalue || cleanName).trim();
        }
        if (cleanName && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanName)) {
          return cleanName;
        }
      }
      if (typeof rawLookupVal === 'string') {
        const cleanRaw = rawLookupVal.trim();
        if (cleanRaw && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanRaw)) {
          return cleanRaw;
        }
      }
      return '';
    };

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
            systemUserId: matchedUser?.systemuserid || null,
            asgId: asgId,
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
            const isExcluded = rawStatus === 822500009 || statusText === 'Excluded' || (iss.iar_workflowremarks || '').includes('[EXCLUDED');
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
                resolvedIssueOwner = matchedAssignee?.displayName || matchedAssignee?.name;
                if (!resolvedIssueOwner) {
                  // Fallback to role archetype if not directly matched in assignment list
                  if (sLower.includes('vp')) resolvedIssueOwner = 'Elena Rostova';
                  else if (sLower.includes('director') || sLower.includes('ready for director')) resolvedIssueOwner = 'Marcus Vance';
                  else if (sLower.includes('manager') || sLower.includes('mgr')) resolvedIssueOwner = 'Amanda Palmer';
                  else if (sLower.includes('tc') || sLower.includes('coordinator')) resolvedIssueOwner = 'Gowri P';
                  else resolvedIssueOwner = creatorUser?.fullname || assignedUsersList[0]?.displayName || 'Assigned Auditor';
                }
              } else {
                resolvedIssueOwner = creatorUser?.fullname || 'Assigned Auditor';
              }
            }

            // Lookups & extended values resolved directly from Dataverse tables (iar_taxonomieses & iar_procedureses)
            const critName = resolveTaxonomyValue(
              iss._iar_criticality_value || iss.iar_criticality,
              iss.iar_criticalityname || iss['_iar_criticality_value@OData.Community.Display.V1.FormattedValue']
            );
            const pboName = pboUser?.fullname || iss.iar_primarybusinessownername || '';
            const procId = iss._iar_testprocedure_value || iss.iar_testprocedure || '';
            const procCode = iss.iar_testprocedurename || 'TP-101';

            // Concurrency Lock & Lease Resolution
            const lockedById = iss._iar_lockedby_value ? normalizeId(iss._iar_lockedby_value) : '';
            const lockedByUser = lockedById ? userById.get(lockedById) : null;
            const lockedAtTime = iss.iar_lockeddatetime || null;
            const isLockFlag = !!iss.iar_lockstatus;

            // Stale Lock Lease Expiry Safety Net (> 1 hour old without active session)
            const isStale = isLockFlag && !!lockedAtTime && (Date.now() - new Date(lockedAtTime).getTime() > 3600000);
            if (isStale && iss.iar_issuesid) {
              const cleanIssId = extractCleanGuid(iss.iar_issuesid);
              if (cleanIssId) {
                Iar_issuesesService.update(cleanIssId, {
                  iar_lockstatus: false,
                  iar_lockeddatetime: null as any,
                  'iar_LockedBy@odata.bind': null as any
                }).catch((err: any) => console.warn('[DataverseReportingService] Failed to auto-evict stale lock:', err));
              }
            }

            const effectiveIsLocked = isLockFlag && !isStale;
            const effectiveLockedBy = effectiveIsLocked ? {
              userId: lockedById,
              name: lockedByUser?.fullname || iss.iar_lockedbyname || 'Another auditor',
              email: lockedByUser?.internalemailaddress || '',
              role: 'Auditor',
              avatar: (lockedByUser?.fullname || 'AU').slice(0, 2).toUpperCase(),
              avatarBg: '#000099',
              timestamp: lockedAtTime ? new Date(lockedAtTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently',
              activity: 'Reviewing finding workpaper'
            } : null;

            return {
              id: iss.iar_issuesid,
              jobId: engCode,
              engagementId: engId,
              title: iss.iar_issuetitle || iss.iar_name || 'Untitled Issue',
              header: iss.iar_issuetitle || iss.iar_name || 'Untitled Issue',
              status: isExcluded ? 'Excluded' : statusText,
              currentLevel: isExcluded ? 'Excluded' : statusText,
              isExcluded: isExcluded,
              excludedAt: isExcluded ? (iss.modifiedon ? new Date(iss.modifiedon).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Excluded') : null,
              previousStatus: iss.iar_workflowremarks && iss.iar_workflowremarks.includes('[EXCLUDED_FROM:')
                ? iss.iar_workflowremarks.match(/\[EXCLUDED_FROM:([^\]]+)\]/)?.[1] || 'Pending TC'
                : 'Pending TC',
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
              rootCauseType: resolveTaxonomyValue(iss._iar_issuecausetype_value || iss.iar_issuecausetype, iss.iar_issuecausetypename),
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
              remediationTargetDate: iss.iar_agreedremediationdate || '',
              businessManagementReason: iss.iar_businessmanagementreason || '',
              businessManagementResponse: iss.iar_businessmanagementresponse || '',
              managementResponse: iss.iar_businessmanagementresponse || '',
              businessManagementAttachment: iss.iar_businessmanagementattachment_name || iss.iar_businessmanagementattachment || '',
              salesUsd: iss.iar_salesusd,
              ibtUsd: iss.iar_ibtusd,
              netIncomeUsd: iss.iar_netincomeusd,
              totalAssetsUsd: iss.iar_totalassetsusd,
              soxReportable: iss.iar_soxreportable ? 'Yes' : 'No',
              primaryBusinessOwnerId: pboId,
              primaryBusinessOwnerName: pboName,
              businessContactName: pboName,
              accountableContact: pboName || 'Business Owner',
              accountableFunction: resolveTaxonomyValue(iss._iar_accountablefunction_value || iss.iar_accountablefunction, iss.iar_accountablefunctionname),
              accountableProcessArea: resolveTaxonomyValue(iss._iar_processarea_value || iss.iar_processarea, iss.iar_processareaname),
              processArea: resolveTaxonomyValue(iss._iar_processarea_value || iss.iar_processarea, iss.iar_processareaname),
              issueType: resolveTaxonomyValue(iss._iar_issuetype_value || iss.iar_issuetype, iss.iar_issuetypename),
              issueSource: resolveTaxonomyValue(iss._iar_issuesource_value || iss.iar_issuesource, iss.iar_issuesourcename),
              keyTheme: resolveTaxonomyValue(iss._iar_keytheme_value || iss.iar_keytheme, iss.iar_keythemename),
              repeatFinding: resolveTaxonomyValue(iss._iar_repeatfinding_value || iss.iar_repeatfinding, iss.iar_repeatfindingname) || 'No',
              impactedRegion: resolveTaxonomyValue(iss._iar_impactedregion_value || iss.iar_impactedregion, iss.iar_impactedregionname),
              impactedSector: resolveTaxonomyValue(iss._iar_impactedsector_value || iss.iar_impactedsector, iss.iar_impactedsectorname),
              impactedMrc: resolveTaxonomyValue(iss._iar_impactedmrc_value || iss.iar_impactedmrc, iss.iar_impactedmrcname),
              itAssetAccountableSector: resolveTaxonomyValue(iss._iar_itassetaccountablesector_value || iss.iar_itassetaccountablesector, iss.iar_itassetaccountablesectorname),
              quarterImpacted: resolveTaxonomyValue(iss._iar_quarterimpacted_value || iss.iar_quarterimpacted, iss.iar_quarterimpactedname),
              workflowRemarks: iss.iar_workflowremarks || '',
              isLocked: effectiveIsLocked,
              lockStatus: effectiveIsLocked,
              lockedBy: effectiveLockedBy,
              lockedAt: effectiveIsLocked ? lockedAtTime : null,
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
 * Helper to resolve a user's systemuserid GUID from session user object or Dataverse systemusers
 */
export async function resolveUserGuid(user?: { userId?: string; name?: string; email?: string }): Promise<string> {
  const emailToMatch = (user?.email || '').toLowerCase().trim();
  const nameToMatch = (user?.name || '').toLowerCase().trim();
  const userIdCandidate = user?.userId ? extractCleanGuid(user.userId) : '';

  try {
    const usersRes = await SystemusersService.getAll();
    const usersList = extractDataverseArray(usersRes as any);

    // 1. If a candidate GUID is provided, verify it exists directly in systemusers
    if (userIdCandidate && isGuid(userIdCandidate)) {
      const byId = usersList.find((u: any) => extractCleanGuid(u.systemuserid || u.id).toLowerCase() === userIdCandidate.toLowerCase());
      if (byId) return userIdCandidate;
    }

    // 2. Match by email or fullname
    if (emailToMatch || nameToMatch) {
      const matched = usersList.find((u: any) => {
        const em = String(u.internalemailaddress || '').toLowerCase().trim();
        const fn = String(u.fullname || '').toLowerCase().trim();
        return (
          (emailToMatch && em === emailToMatch) ||
          (nameToMatch && (fn === nameToMatch || fn.includes(nameToMatch.split(' ')[0])))
        );
      });
      if (matched) {
        return extractCleanGuid(matched.systemuserid || matched.id);
      }
    }

    // 3. Fallback to candidate GUID if provided
    if (userIdCandidate && isGuid(userIdCandidate)) {
      return userIdCandidate;
    }
  } catch (e) {
    console.warn('[DataverseReportingService] Failed resolving systemuser GUID:', e);
    if (userIdCandidate && isGuid(userIdCandidate)) {
      return userIdCandidate;
    }
  }
  return '';
}

/**
 * Resolves the target workflow owner (name and systemuser GUID) for any status transition.
 * Ensures that issue ownership updates accurately across all review stages:
 * - Pending Staff / Draft -> Staff Auditor / Creator
 * - Pending TC -> Team Coordinator (e.g. Gowri P)
 * - Pending Manager / Manager Completed -> Audit Manager (e.g. Amanda Palmer)
 * - Ready for Director / Pending Director -> Audit Director (e.g. Marcus Vance)
 * - Pending Business -> Primary Business Owner
 * - Pending VP -> Vice President (e.g. Elena Rostova)
 * - Completed -> QA Archive
 */
export async function resolveTargetOwnerForStatusAsync(
  targetStatusText: string,
  assignedUsers?: any[],
  issue?: Partial<Issue>,
  currentUser?: { name?: string; userId?: string; email?: string; role?: string }
): Promise<{ ownerName: string; ownerGuid: string; ownerEmail?: string }> {
  const s = (targetStatusText || '').toLowerCase().trim();

  // 1. Pending Business: Assign to Primary Business Owner
  if (s.includes('business')) {
    const bizName =
      issue?.primaryBusinessOwnerName ||
      issue?.accountableContact ||
      issue?.businessContactName ||
      'Vinay Narasimha';
    const rawBizGuid = issue?.primaryBusinessOwnerId ? extractCleanGuid(issue.primaryBusinessOwnerId) : '';
    let finalGuid = isGuid(rawBizGuid) ? rawBizGuid : '';
    if (!finalGuid && bizName) {
      finalGuid = await resolveUserGuid({ name: bizName });
    }
    return {
      ownerName: bizName,
      ownerGuid: finalGuid,
    };
  }

  // 2. Completed / Signed Off: QA Archive
  if (s.includes('completed') || s.includes('signed off')) {
    return {
      ownerName: 'QA Archive',
      ownerGuid: '',
    };
  }

  // 3. Review Tiers (VP, Director, Manager, TC, Staff)
  let targetRoleKey = 'staff';
  let fallbackName = 'Tamilselvan Natarajan';

  if (s.includes('vp')) {
    targetRoleKey = 'vp';
    fallbackName = 'Elena Rostova';
  } else if (s.includes('director') || s.includes('ready for director')) {
    targetRoleKey = 'director';
    fallbackName = 'Marcus Vance';
  } else if (s.includes('manager') || s.includes('mgr')) {
    targetRoleKey = 'manager';
    fallbackName = 'Amanda Palmer';
  } else if (s.includes('tc') || s.includes('coordinator')) {
    targetRoleKey = 'team-coordinator';
    fallbackName = 'Gowri P';
  } else {
    targetRoleKey = 'staff';
    fallbackName = currentUser?.name || 'Tamilselvan Natarajan';
  }

  // Look for matching user in engagement assignments
  let matchedUser: any = null;
  if (Array.isArray(assignedUsers) && assignedUsers.length > 0) {
    matchedUser = assignedUsers.find((u: any) => {
      const { baseRole } = getRoleDetails(u.roleId || u.roleName || u.roleAbbr);
      if (targetRoleKey === 'vp') return baseRole === 'vp';
      if (targetRoleKey === 'director') return baseRole === 'director';
      if (targetRoleKey === 'manager') return baseRole === 'manager';
      if (targetRoleKey === 'team-coordinator') return baseRole === 'team-coordinator';
      if (targetRoleKey === 'staff') return baseRole === 'auditor';
      return false;
    });
  }

  const resolvedName = matchedUser?.displayName || matchedUser?.name || fallbackName;
  const resolvedEmail = matchedUser?.email || '';
  let resolvedGuid = matchedUser?.systemUserId && isGuid(extractCleanGuid(matchedUser.systemUserId))
    ? extractCleanGuid(matchedUser.systemUserId)
    : '';

  // Fallback to resolveUserGuid from Dataverse systemusers by name/email to ensure genuine systemuserid
  if (!resolvedGuid && (resolvedEmail || resolvedName)) {
    resolvedGuid = await resolveUserGuid({ name: resolvedName, email: resolvedEmail });
  }

  // If targeting staff and current user is staff/creator with valid GUID, prefer currentUser's GUID
  if (targetRoleKey === 'staff' && currentUser?.userId && isGuid(extractCleanGuid(currentUser.userId))) {
    resolvedGuid = extractCleanGuid(currentUser.userId);
  }

  return {
    ownerName: resolvedName,
    ownerGuid: resolvedGuid,
    ownerEmail: resolvedEmail,
  };
}

/**
 * Creates an audit finding record in Dataverse (iar_issueses), logs the creation in iar_issuelogses,
 * and updates engagement reportstatus to 'Audit Report Inprogress' (822500001) if currently Not Started.
 */
export async function createDataverseIssue(
  input: CreateDataverseIssueInput,
  currentUser?: { name?: string; email?: string; userId?: string; role?: string },
  assignedUsers?: any[]
): Promise<any> {
  const cleanEngId = (input.engagementId || '').replace(/[{}]/g, '').trim();
  const rawStatus = input.status || 'Pending Staff';
  const statusCode = ISSUE_STATUS_TO_DATAVERSE_CODE[rawStatus] || 822500000;
  const issueNameCode = `ISS-${Date.now().toString().slice(-4)}`;

  // Resolve target owner for this newly created issue
  const targetOwner = await resolveTargetOwnerForStatusAsync(
    rawStatus,
    assignedUsers,
    input as any,
    currentUser
  );

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

  // Bind current owner if valid GUID resolved
  if (targetOwner.ownerGuid && isGuid(targetOwner.ownerGuid)) {
    newIssueRecord['iar_CurrentOwner@odata.bind'] = `/systemusers(${targetOwner.ownerGuid})`;
  }

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

  // Bind Criticality taxonomy if provided
  if (input.criticality) {
    try {
      const critGuid = await resolveTaxonomyGuidByValue(input.criticality);
      if (critGuid) {
        newIssueRecord['iar_Criticality@odata.bind'] = `/iar_taxonomieses(${critGuid})`;
      }
    } catch {
      // ignore if taxonomy resolution fails
    }
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
    criticality: (input.criticality || '') as any,
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
    currentOwner: targetOwner.ownerName,
    createdBy: currentUser?.name || 'Auditor',
    lastEditedBy: currentUser?.name || 'Auditor',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return {
    ...createdIssueResult,
    currentOwner: targetOwner.ownerName,
    issue: mappedUiIssue
  };
}

/**
 * Resolves a taxonomy record's iar_taxonomiesid GUID from iar_taxonomieses by matching iar_taxonomyvalue, iar_taxonomyid, or GUID.
 */
export async function resolveTaxonomyGuidByValue(val?: string): Promise<string | null> {
  if (!val || !val.trim()) return null;
  const cleanVal = val.trim();
  const cleanGuid = extractCleanGuid(cleanVal);
  if (isGuid(cleanGuid)) return cleanGuid;

  try {
    const taxRes = await Iar_taxonomiesesService.getAll();
    const taxList = extractDataverseArray(taxRes as any);
    const lowerTarget = cleanVal.toLowerCase();
    const matched = taxList.find((t: any) => {
      const tVal = String(t.iar_taxonomyvalue || '').trim().toLowerCase();
      const tId = String(t.iar_taxonomyid || '').trim().toLowerCase();
      return tVal === lowerTarget || tId === lowerTarget;
    });
    if (matched) {
      const guid = extractCleanGuid(matched.iar_taxonomiesid || matched.id);
      if (isGuid(guid)) return guid;
    }
  } catch (err) {
    console.warn('[DataverseReportingService] Failed resolving taxonomy GUID for value:', val, err);
  }
  return null;
}

/**
 * Updates iar_Criticality@odata.bind on iar_issueses when an issue's criticality is changed in the studio.
 */
export async function updateIssueCriticalityInDataverse(issueId: string, criticalityVal: string, engagementId?: string): Promise<void> {
  const { cleanIssueGuid } = await resolveIssueGuidAndEngagementGuid(issueId, engagementId);
  if (!isGuid(cleanIssueGuid)) return;

  try {
    const taxGuid = await resolveTaxonomyGuidByValue(criticalityVal);
    if (taxGuid) {
      await Iar_issuesesService.update(cleanIssueGuid, {
        'iar_Criticality@odata.bind': `/iar_taxonomieses(${taxGuid})`
      } as any);
      console.info(`[DataverseReportingService] Updated iar_Criticality on issue ${cleanIssueGuid} to ${criticalityVal} (${taxGuid})`);
    }
  } catch (err) {
    console.warn('[DataverseReportingService] Notice updating iar_Criticality on iar_issueses:', err);
  }
}

/**
 * Persists edited workpaper fields from the center pane onto iar_issueses in Dataverse.
 */
export async function updateDataverseIssueFields(issue: Issue, engagementId?: string): Promise<void> {
  const { cleanIssueGuid } = await resolveIssueGuidAndEngagementGuid(issue.id, engagementId || issue.engagementId);
  if (!isGuid(cleanIssueGuid)) return;

  try {
    const payload: any = {};
    if (issue.title) payload.iar_issuetitle = issue.title;
    if (issue.description || issue.issueNarrative) {
      payload.iar_description = issue.description || issue.issueNarrative;
    }
    if (issue.originalIssue) payload.iar_originalissue = issue.originalIssue;
    if (issue.rootCause !== undefined) payload.iar_rootcause = issue.rootCause;
    if (issue.impact !== undefined) payload.iar_impact = issue.impact;
    if (issue.recommendation !== undefined) payload.iar_recommendation = issue.recommendation;
    if (issue.nonComplianceReferences !== undefined) payload.iar_noncompliancereferences = issue.nonComplianceReferences;
    if (issue.summaryFinding !== undefined) payload.iar_summaryfinding = issue.summaryFinding;
    if (issue.mitigatingControl !== undefined || issue.mitigatingControls !== undefined) {
      payload.iar_mitigatingcontrol = issue.mitigatingControl || issue.mitigatingControls || '';
    }
    if (issue.auditorResponse !== undefined) payload.iar_auditorresponse = issue.auditorResponse;
    if (issue.exceptionRemedComments !== undefined) payload.iar_exceptionremedcomments = issue.exceptionRemedComments;
    if (issue.exceptionRemedDate !== undefined) payload.iar_exceptionremeddate = issue.exceptionRemedDate || null;
    if (issue.agreedRemediationDate !== undefined || issue.remediationTargetDate !== undefined) {
      payload.iar_agreedremediationdate = issue.agreedRemediationDate || issue.remediationTargetDate || null;
    }
    if (issue.businessManagementReason !== undefined) {
      payload.iar_businessmanagementreason = issue.businessManagementReason;
    }
    if (issue.businessManagementResponse !== undefined || issue.managementResponse !== undefined) {
      payload.iar_businessmanagementresponse = issue.businessManagementResponse || issue.managementResponse || '';
    }
    if (issue.soxReportable !== undefined) {
      payload.iar_soxreportable = issue.soxReportable === 'Yes' || (issue.soxReportable as any) === true;
    }

    const pboGuid = extractCleanGuid(issue.primaryBusinessOwnerId || issue.businessContactId);
    if (isGuid(pboGuid)) {
      payload['iar_PrimaryBusinessOwner@odata.bind'] = `/systemusers(${pboGuid})`;
    }

    if (Object.keys(payload).length > 0) {
      await Iar_issuesesService.update(cleanIssueGuid, payload);
    }
  } catch (err) {
    console.warn('[DataverseReportingService] Notice updating issue fields on iar_issueses:', err);
  }
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

export const FIELD_KEY_TO_OPTION_SET: Record<string, number> = {
  testProcedureCode: 1, // Test Procedures
  originalIssue: 2, // Original Issue
  criticality: 3, // Criticality
  accountableFunction: 4, // Accountable Function
  function: 5, // Function
  title: 6, // Issue Title
  issueNarrative: 7, // Description
  rootCause: 8, // Root Cause
  impact: 9, // Impact
  recommendation: 10, // Recommendation
  processArea: 11, // Process Area
  summaryFinding: 12, // Summary Finding
  auditorResponse: 13, // Auditor Response
  mitigatingControl: 14, // Mitigating Control
  exceptionRemedComments: 15, // Exception Remed Comments
  issueType: 16, // Issue Type
  issueCauseType: 17, // Issue Cause Type
  soxReportable: 18, // SOX Reportable
  issueSource: 19, // Issue Source
  keyTheme: 20, // Key Theme
  repeatFinding: 21, // Repeat Finding
  itAssetAccountableSector: 22, // IT Asset Accountable Sector
  impactedRegion: 23, // Impacted Region
  impactedSector: 24, // Impacted Sector
  impactedMrc: 25, // Impacted MRC
  quarterImpacted: 26, // Quarter Impacted
  salesUsd: 27, // Sales(USD)
  ibtUsd: 28, // IBT(USD)
  netIncomeUsd: 29, // Net Income(USD)
  totalAssetsUsd: 30, // Total Assets(USD)
  exceptionRemedDate: 31, // Exception - Remed Date
  primaryBusinessOwnerId: 4,
  secondaryBusinessOwnerIds: 4,
  businessManagementReason: 13,
  businessManagementResponse: 13,
  agreedRemediationDate: 31,
  businessManagementAttachment: 15,
};

export const OPTION_SET_TO_FIELD_KEY: Record<number, string> = {
  1: 'testProcedureCode',
  2: 'originalIssue',
  3: 'criticality',
  4: 'accountableFunction',
  5: 'function',
  6: 'title',
  7: 'issueNarrative',
  8: 'rootCause',
  9: 'impact',
  10: 'recommendation',
  11: 'processArea',
  12: 'summaryFinding',
  13: 'auditorResponse',
  14: 'mitigatingControl',
  15: 'exceptionRemedComments',
  16: 'issueType',
  17: 'issueCauseType',
  18: 'soxReportable',
  19: 'issueSource',
  20: 'keyTheme',
  21: 'repeatFinding',
  22: 'itAssetAccountableSector',
  23: 'impactedRegion',
  24: 'impactedSector',
  25: 'impactedMrc',
  26: 'quarterImpacted',
  27: 'salesUsd',
  28: 'ibtUsd',
  29: 'netIncomeUsd',
  30: 'totalAssetsUsd',
  31: 'exceptionRemedDate',
};

const getCaseInsensitive = (obj: any, ...keys: string[]): any => {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  const cleanKeys = keys.map((k) => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
  for (const actualKey of Object.keys(obj)) {
    const cleanActual = actualKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanKeys.includes(cleanActual)) {
      if (obj[actualKey] !== undefined && obj[actualKey] !== null) {
        return obj[actualKey];
      }
    }
  }
  return undefined;
};

const FIELD_LABEL_TO_KEY: Record<string, string> = {
  'test procedures': 'testProcedureCode',
  'test procedure': 'testProcedureCode',
  'testprocedure': 'testProcedureCode',
  'testprocedurecode': 'testProcedureCode',
  'original issue': 'originalIssue',
  'original issue / auditor observation': 'originalIssue',
  'originalissue': 'originalIssue',
  'criticality': 'criticality',
  'criticality severity': 'criticality',
  'accountable function': 'accountableFunction',
  'accountablefunction': 'accountableFunction',
  'function': 'function',
  'issue title': 'title',
  'title': 'title',
  'issuetitle': 'title',
  'description': 'issueNarrative',
  'condition narrative': 'issueNarrative',
  'condition narrative & observed exceptions': 'issueNarrative',
  'issuenarrative': 'issueNarrative',
  'root cause': 'rootCause',
  'root cause analysis': 'rootCause',
  'rootcause': 'rootCause',
  'impact': 'impact',
  'impact & business risk exposure': 'impact',
  'recommendation': 'recommendation',
  'recommendations': 'recommendation',
  'recommendations & remediation criteria': 'recommendation',
  'process area': 'processArea',
  'accountable process area': 'accountableProcessArea',
  'area': 'processArea',
  'summary finding': 'summaryFinding',
  'summaryfinding': 'summaryFinding',
  'auditor response': 'auditorResponse',
  'auditorresponse': 'auditorResponse',
  'mitigating control': 'mitigatingControl',
  'mitigatingcontrol': 'mitigatingControl',
  'exception remed comments': 'exceptionRemedComments',
  'exception remediation comments': 'exceptionRemedComments',
  'exceptionremedcomments': 'exceptionRemedComments',
  'issue type': 'issueType',
  'issuetype': 'issueType',
  'issue cause type': 'issueCauseType',
  'issuecausetype': 'issueCauseType',
  'sox reportable': 'soxReportable',
  'soxreportable': 'soxReportable',
  'issue source': 'issueSource',
  'issuesource': 'issueSource',
  'issue finding source': 'issueSource',
  'key theme': 'keyTheme',
  'keytheme': 'keyTheme',
  'repeat finding': 'repeatFinding',
  'repeatfinding': 'repeatFinding',
  'it asset accountable sector': 'itAssetAccountableSector',
  'itassetaccountablesector': 'itAssetAccountableSector',
  'impacted region': 'impactedRegion',
  'impactedregion': 'impactedRegion',
  'impacted sector': 'impactedSector',
  'impactedsector': 'impactedSector',
  'impacted mrc': 'impactedMrc',
  'impactedmrc': 'impactedMrc',
  'quarter impacted': 'quarterImpacted',
  'quarterimpacted': 'quarterImpacted',
  'sales(usd)': 'salesUsd',
  'sales usd': 'salesUsd',
  'salesusd': 'salesUsd',
  'ibt(usd)': 'ibtUsd',
  'ibt usd': 'ibtUsd',
  'ibtusd': 'ibtUsd',
  'net income(usd)': 'netIncomeUsd',
  'net income usd': 'netIncomeUsd',
  'netincomeusd': 'netIncomeUsd',
  'total assets(usd)': 'totalAssetsUsd',
  'total assets usd': 'totalAssetsUsd',
  'totalassetsusd': 'totalAssetsUsd',
  'exception - remed date': 'exceptionRemedDate',
  'exception remediation date': 'exceptionRemedDate',
  'exceptionremeddate': 'exceptionRemedDate',
  'primary business owner': 'primaryBusinessOwnerId',
  'primarybusinessowner': 'primaryBusinessOwnerId',
  'primarybusinessownerid': 'primaryBusinessOwnerId',
};

const resolveFieldKey = (rawField: any, rawFieldName?: any): string => {
  if (typeof rawField === 'number' && OPTION_SET_TO_FIELD_KEY[rawField]) {
    return OPTION_SET_TO_FIELD_KEY[rawField];
  }
  if (typeof rawField === 'string') {
    const parsedNum = parseInt(rawField, 10);
    if (!isNaN(parsedNum) && OPTION_SET_TO_FIELD_KEY[parsedNum]) {
      return OPTION_SET_TO_FIELD_KEY[parsedNum];
    }
    const clean = rawField.toLowerCase().trim();
    if (FIELD_LABEL_TO_KEY[clean]) {
      return FIELD_LABEL_TO_KEY[clean];
    }
    if (FIELD_KEY_TO_OPTION_SET[rawField]) {
      return rawField;
    }
  }
  if (rawFieldName && typeof rawFieldName === 'string') {
    const clean = rawFieldName.toLowerCase().trim();
    if (FIELD_LABEL_TO_KEY[clean]) {
      return FIELD_LABEL_TO_KEY[clean];
    }
  }
  return 'title';
};

/**
 * Fetches all field-level comments for an issue and engagement from iar_issuecommentses table.
 */
export async function fetchCommentsForIssue(issueId: string, engagementId?: string): Promise<IssueComment[]> {
  const cleanIssueId = (issueId || '').replace(/[{}]/g, '').toLowerCase().trim();
  const cleanEngId = (engagementId || '').replace(/[{}]/g, '').toLowerCase().trim();

  try {
    const res = await withTimeout(
      Iar_issuecommentsesService.getAll(),
      15000,
      'Iar_issuecommentsesService.getAll'
    );
    const rawList = extractDataverseArray(res as any);

    if (rawList && rawList.length > 0) {
      // 1. Build quick user map
      const userMap: Record<string, string> = {};
      try {
        const usersRes = await SystemusersService.getAll();
        const usersList = extractDataverseArray(usersRes as any);
        usersList.forEach((u: any) => {
          const uid = extractCleanGuid(u.systemuserid || u.id);
          if (uid) userMap[uid] = u.fullname || u.internalemailaddress || 'Auditor';
        });
      } catch {
        // ignore user map resolution failure
      }

      // 2. Resolve target engagement GUID and related issues
      let targetEngGuid = isGuid(cleanEngId) ? cleanEngId : '';
      let targetIssueGuid = isGuid(cleanIssueId) ? cleanIssueId : '';
      const engagementIssueGuids = new Set<string>();

      try {
        // Look up issues to map between GUIDs, codes, and engagements
        const issuesRes = await Iar_issuesesService.getAll();
        const issuesList = extractDataverseArray(issuesRes as any);

        issuesList.forEach((iss: any) => {
          const ig = extractCleanGuid(iss.iar_issuesid || iss.id);
          const ic = String(iss.iar_issueid || '').toLowerCase().trim();
          const it = String(iss.iar_issuetitle || '').toLowerCase().trim();
          const engFk = extractCleanGuid(
            iss._iar_engagementid_value ||
            iss.iar_engagementid
          );

          if (cleanEngId && (engFk === cleanEngId || (targetEngGuid && engFk === targetEngGuid))) {
            if (ig) engagementIssueGuids.add(ig);
          }

          if (cleanIssueId && (ig === cleanIssueId || ic === cleanIssueId || it === cleanIssueId)) {
            targetIssueGuid = ig;
            if (engFk && !targetEngGuid) {
              targetEngGuid = engFk;
            }
          }
        });
      } catch {
        // ignore issues list error
      }

      if (!targetEngGuid && cleanEngId) {
        try {
          const engRes = await Iar_engagementsesService.getAll();
          const engList = extractDataverseArray(engRes as any);
          const foundEng = engList.find((e: any) => {
            const eg = extractCleanGuid(e.iar_engagementsid || e.id);
            const ec = String(e.iar_name || e.iar_engagementcode || '').toLowerCase().trim();
            const en = String(e.iar_engagementname || '').toLowerCase().trim();
            return eg === cleanEngId || ec === cleanEngId || en === cleanEngId;
          });
          if (foundEng) {
            targetEngGuid = extractCleanGuid(foundEng.iar_engagementsid || foundEng.id);
          }
        } catch {
          // ignore engagement list error
        }
      }

      // 3. Filter comments matching the active engagement and issue
      const matched = rawList.filter((item: any) => {
        const itemIssueGuid = extractCleanGuid(
          getCaseInsensitive(item, '_iar_issueid_value', '_iar_IssueID_value', 'iar_issueid', 'iar_IssueID')
        );
        const itemEngGuid = extractCleanGuid(
          getCaseInsensitive(item, '_iar_engagementid_value', '_iar_EngagementID_value', 'iar_engagementid', 'iar_EngagementID')
        );

        // Engagement match check
        const matchesEngagement = targetEngGuid
          ? (!itemEngGuid || itemEngGuid === targetEngGuid || (cleanEngId && itemEngGuid === cleanEngId) || (itemIssueGuid && engagementIssueGuids.has(itemIssueGuid)))
          : cleanEngId
            ? (!itemEngGuid || itemEngGuid === cleanEngId || (itemIssueGuid && engagementIssueGuids.has(itemIssueGuid)))
            : true;

        // Issue match check
        const matchesIssue = targetIssueGuid
          ? (itemIssueGuid === targetIssueGuid || itemIssueGuid === cleanIssueId)
          : cleanIssueId
            ? (itemIssueGuid === cleanIssueId)
            : true;

        return matchesEngagement && matchesIssue;
      });

      console.info(
        `[DataverseReportingService] fetchCommentsForIssue: Found ${matched.length} comments from ${rawList.length} total Dataverse records (Eng: "${targetEngGuid || cleanEngId}", Issue: "${targetIssueGuid || cleanIssueId}").`
      );

      const comments: IssueComment[] = matched.map((item: any) => {
        // 1. Resolve fieldKey (check embedded key in iar_issuecommentid first, then OptionSet / name)
        const commentCodeFull = String(
          getCaseInsensitive(item, 'iar_issuecommentid', 'iar_IssueCommentID', 'iar_issuecomment_code') || ''
        );
        let fieldKey = '';
        if (commentCodeFull.includes(':')) {
          fieldKey = commentCodeFull.split(':')[1]?.trim() || '';
        }
        if (!fieldKey) {
          const rawField = getCaseInsensitive(item, 'iar_field', 'iar_Field', '_iar_field_value');
          const rawFieldName = getCaseInsensitive(item, 'iar_fieldname', 'iar_FieldName');
          fieldKey = resolveFieldKey(rawField, rawFieldName);
        }

        const authorGuid = extractCleanGuid(
          getCaseInsensitive(item, '_iar_commentedby_value', '_iar_CommentedBy_value', 'iar_commentedby', 'iar_CommentedBy')
        );
        const taggedGuid = extractCleanGuid(
          getCaseInsensitive(item, '_iar_taggedto_value', '_iar_TaggedTo_value', 'iar_taggedto', 'iar_TaggedTo')
        );
        const resolverGuid = extractCleanGuid(
          getCaseInsensitive(item, '_iar_completedby_value', '_iar_CompletedBy_value', 'iar_completedby', 'iar_CompletedBy')
        );
        const statusCode = Number(getCaseInsensitive(item, 'iar_commentcompletionstatus', 'iar_CommentCompletionStatus'));
        const isResolved = statusCode === 2; // 2 = Done

        const commentText = String(getCaseInsensitive(item, 'iar_comment', 'iar_Comment') || '').trim();
        const commentId = String(
          getCaseInsensitive(item, 'iar_issuecommentsid', 'iar_issuecommentid', 'iar_IssueCommentID', 'id') || `COM-${Date.now()}`
        );
        const completedDate = getCaseInsensitive(item, 'iar_completeddatetime', 'iar_CompletedDateTime');
        const commentedDate = getCaseInsensitive(item, 'iar_commenteddatetime', 'iar_CommentedDateTime', 'createdon') || new Date().toISOString();
        const commIssueGuid = extractCleanGuid(
          getCaseInsensitive(item, '_iar_issueid_value', '_iar_IssueID_value', 'iar_issueid', 'iar_IssueID')
        );

        return {
          commentId,
          issueId: cleanIssueId || commIssueGuid,
          fieldKey,
          content: commentText,
          authorId: authorGuid || 'USR-001',
          authorName: userMap[authorGuid] || (item.iar_commentedby as any)?.fullname || 'Reviewer',
          taggedUserId: taggedGuid || null,
          taggedUserName: taggedGuid ? (userMap[taggedGuid] || (item.iar_taggedto as any)?.fullname || 'Assigned Auditor') : null,
          isResolved,
          resolvedById: resolverGuid || null,
          resolvedByName: resolverGuid ? (userMap[resolverGuid] || (item.iar_completedby as any)?.fullname || 'Reviewer') : null,
          resolvedAt: completedDate || null,
          createdAt: commentedDate,
        };
      });

      return comments;
    }
  } catch (err) {
    console.warn('[DataverseReportingService] Failed to fetch comments from iar_issuecommentses, falling back to mock provider:', err);
  }

  return mockDataverseProvider.getCommentsByIssueId(issueId, engagementId);
}

/**
 * Creates a new field-level comment record in iar_issuecommentses table.
 */
export async function createDataverseComment(
  commentData: Partial<IssueComment> & { engagementId?: string; authorEmail?: string }
): Promise<IssueComment> {
  const cleanIssueId = (commentData.issueId || '').replace(/[{}]/g, '').toLowerCase().trim();
  const cleanEngId = (commentData.engagementId || '').replace(/[{}]/g, '').toLowerCase().trim();

  const fieldOption = (commentData.fieldKey && FIELD_KEY_TO_OPTION_SET[commentData.fieldKey]) || 6;
  const commentCode = `COM-${Date.now().toString().slice(-6)}:${commentData.fieldKey || 'title'}`;

  // 1. Resolve issue GUID and its parent engagement
  let resolvedIssueGuid = isGuid(cleanIssueId) ? cleanIssueId : '';
  let resolvedEngagementGuid = isGuid(cleanEngId) ? cleanEngId : '';

  try {
    const issuesRes = await Iar_issuesesService.getAll();
    const issuesList = extractDataverseArray(issuesRes as any);
    const foundIssue = issuesList.find((iss: any) => {
      const ig = extractCleanGuid(iss.iar_issuesid || iss.id);
      const ic = String(iss.iar_issueid || '').toLowerCase().trim();
      const it = String(iss.iar_issuetitle || '').toLowerCase().trim();
      return (
        ig === cleanIssueId ||
        ic === cleanIssueId ||
        it === cleanIssueId ||
        (cleanIssueId.includes('issue-') && ic.includes(cleanIssueId.replace('issue-', 'iss-')))
      );
    });

    if (foundIssue) {
      resolvedIssueGuid = extractCleanGuid(foundIssue.iar_issuesid || foundIssue.id);
      if (!resolvedEngagementGuid) {
        resolvedEngagementGuid = extractCleanGuid(
          foundIssue._iar_engagementid_value ||
          foundIssue.iar_engagementid
        );
      }
    } else if (!resolvedIssueGuid && issuesList.length > 0) {
      resolvedIssueGuid = extractCleanGuid(issuesList[0].iar_issuesid || issuesList[0].id);
      if (!resolvedEngagementGuid) {
        resolvedEngagementGuid = extractCleanGuid(
          issuesList[0]._iar_engagementid_value ||
          issuesList[0].iar_engagementid
        );
      }
    }
  } catch (err) {
    console.warn('[DataverseReportingService] Failed looking up issue for comment binding:', err);
  }

  // 2. Resolve engagement GUID if not yet resolved
  if (!resolvedEngagementGuid) {
    try {
      const engRes = await Iar_engagementsesService.getAll();
      const engList = extractDataverseArray(engRes as any);
      const foundEng = engList.find((e: any) => {
        const eg = extractCleanGuid(e.iar_engagementsid || e.id);
        const ec = String(e.iar_name || e.iar_engagementcode || '').toLowerCase().trim();
        const en = String(e.iar_engagementname || '').toLowerCase().trim();
        return eg === cleanEngId || ec === cleanEngId || en === cleanEngId;
      });
      if (foundEng) {
        resolvedEngagementGuid = extractCleanGuid(foundEng.iar_engagementsid || foundEng.id);
      } else if (engList.length > 0) {
        resolvedEngagementGuid = extractCleanGuid(engList[0].iar_engagementsid || engList[0].id);
      }
    } catch (err) {
      console.warn('[DataverseReportingService] Failed looking up engagement for comment binding:', err);
    }
  }

  // 3. Resolve author user GUID
  let resolvedAuthorGuid = isGuid(commentData.authorId) ? extractCleanGuid(commentData.authorId) : '';
  let resolvedTaggedGuid = isGuid(commentData.taggedUserId) ? extractCleanGuid(commentData.taggedUserId) : '';

  try {
    const usersRes = await SystemusersService.getAll();
    const usersList = extractDataverseArray(usersRes as any);

    if (!resolvedAuthorGuid) {
      const emailToMatch = (commentData.authorEmail || '').toLowerCase().trim();
      const nameToMatch = (commentData.authorName || '').toLowerCase().trim();
      const matchedAuthor = usersList.find((u: any) => {
        const em = String(u.internalemailaddress || '').toLowerCase().trim();
        const fn = String(u.fullname || '').toLowerCase().trim();
        return (
          (emailToMatch && em === emailToMatch) ||
          (nameToMatch && (fn === nameToMatch || fn.includes(nameToMatch.split(' ')[0])))
        );
      });
      if (matchedAuthor) {
        resolvedAuthorGuid = extractCleanGuid(matchedAuthor.systemuserid || matchedAuthor.id);
      } else if (usersList.length > 0) {
        resolvedAuthorGuid = extractCleanGuid(usersList[0].systemuserid || usersList[0].id);
      }
    }

    if (commentData.taggedUserId || commentData.taggedUserName) {
      if (!resolvedTaggedGuid) {
        const tagNameToMatch = (commentData.taggedUserName || '').toLowerCase().trim();
        const tagIdToMatch = (commentData.taggedUserId || '').toLowerCase().trim();
        const matchedTag = usersList.find((u: any) => {
          const ug = extractCleanGuid(u.systemuserid || u.id);
          const em = String(u.internalemailaddress || '').toLowerCase().trim();
          const fn = String(u.fullname || '').toLowerCase().trim();
          return (
            ug === tagIdToMatch ||
            em === tagIdToMatch ||
            (tagNameToMatch && (fn === tagNameToMatch || fn.includes(tagNameToMatch.split(' ')[0])))
          );
        });
        if (matchedTag) {
          resolvedTaggedGuid = extractCleanGuid(matchedTag.systemuserid || matchedTag.id);
        }
      }
    }
  } catch (err) {
    console.warn('[DataverseReportingService] Failed looking up systemusers for comment author/tagged:', err);
  }

  // 4. If all required Dataverse navigation properties are valid GUIDs, persist to Dataverse table
  if (resolvedIssueGuid && resolvedEngagementGuid && resolvedAuthorGuid) {
    try {
      const payload: any = {
        iar_comment: (commentData.content || '').trim(),
        iar_commentcompletionstatus: 1, // 1 = Pending
        iar_commenteddatetime: new Date().toISOString(),
        iar_field: fieldOption,
        iar_issuecommentid: commentCode,
        'iar_IssueID@odata.bind': `/iar_issueses(${resolvedIssueGuid})`,
        'iar_EngagementID@odata.bind': `/iar_engagementses(${resolvedEngagementGuid})`,
        'iar_CommentedBy@odata.bind': `/systemusers(${resolvedAuthorGuid})`,
        statecode: 0,
        statuscode: 1,
      };

      if (resolvedTaggedGuid) {
        payload['iar_TaggedTo@odata.bind'] = `/systemusers(${resolvedTaggedGuid})`;
      }

      console.info('[DataverseReportingService] Creating comment in Dataverse table iar_issuecommentses:', payload);
      const res = await withTimeout(
        Iar_issuecommentsesService.create(payload),
        15000,
        'Iar_issuecommentsesService.create'
      );
      const createdItem = (res as any)?.data || (res as any)?.value || res;
      const createdId = extractCleanGuid(createdItem?.iar_issuecommentsid || createdItem?.id) || commentCode;

      console.info('[DataverseReportingService] Successfully recorded comment in Dataverse table iar_issuecommentses. ID:', createdId);

      const savedComment: IssueComment = {
        commentId: createdId,
        issueId: commentData.issueId || resolvedIssueGuid,
        fieldKey: commentData.fieldKey || 'title',
        content: (commentData.content || '').trim(),
        authorId: resolvedAuthorGuid,
        authorName: commentData.authorName || 'Current Auditor',
        taggedUserId: resolvedTaggedGuid || null,
        taggedUserName: commentData.taggedUserName || null,
        isResolved: false,
        createdAt: new Date().toISOString(),
      };

      // Also sync into mock provider cache so in-memory store remains updated
      mockDataverseProvider.addComment(savedComment);

      return savedComment;
    } catch (err) {
      console.warn('[DataverseReportingService] Failed to create comment in iar_issuecommentses table, falling back to mock provider:', err);
    }
  } else {
    console.warn('[DataverseReportingService] Missing navigation GUIDs for comment creation. Issue GUID:', resolvedIssueGuid, 'Eng GUID:', resolvedEngagementGuid, 'Author GUID:', resolvedAuthorGuid);
  }

  return mockDataverseProvider.addComment(commentData);
}

/**
 * Resolves a comment record in iar_issuecommentses table.
 */
export async function resolveDataverseComment(
  commentId: string,
  resolvedByUserId: string,
  resolvedByName?: string
): Promise<IssueComment> {
  const cleanCommentId = (commentId || '').replace(/[{}]/g, '').toLowerCase().trim();
  let resolvedCommentGuid = isGuid(cleanCommentId) ? cleanCommentId : '';

  // 1. Resolve comment GUID if commentId was a custom code like COM-12345
  if (!resolvedCommentGuid) {
    try {
      const commRes = await Iar_issuecommentsesService.getAll();
      const rawCommList = extractDataverseArray(commRes as any);
      const found = rawCommList.find((c: any) => {
        const cg = extractCleanGuid(c.iar_issuecommentsid || c.id);
        const cc = String(c.iar_issuecommentid || '').toLowerCase().trim();
        return cg === cleanCommentId || cc === cleanCommentId;
      });
      if (found) {
        resolvedCommentGuid = extractCleanGuid(found.iar_issuecommentsid || found.id);
      }
    } catch {
      // ignore comment lookup error
    }
  }

  // 2. Resolve resolver systemuser GUID
  let resolverGuid = isGuid(resolvedByUserId) ? extractCleanGuid(resolvedByUserId) : '';
  if (!resolverGuid) {
    try {
      const usersRes = await SystemusersService.getAll();
      const usersList = extractDataverseArray(usersRes as any);
      const matched = usersList.find((u: any) => {
        const ug = extractCleanGuid(u.systemuserid || u.id);
        const em = String(u.internalemailaddress || '').toLowerCase().trim();
        const fn = String(u.fullname || '').toLowerCase().trim();
        return (
          ug === resolvedByUserId.toLowerCase() ||
          (em && em === resolvedByUserId.toLowerCase()) ||
          (resolvedByName && fn.includes(resolvedByName.toLowerCase()))
        );
      });
      if (matched) {
        resolverGuid = extractCleanGuid(matched.systemuserid || matched.id);
      } else if (usersList.length > 0) {
        resolverGuid = extractCleanGuid(usersList[0].systemuserid || usersList[0].id);
      }
    } catch {
      // ignore user resolution error
    }
  }

  // 3. Update Dataverse record completion status
  if (resolvedCommentGuid) {
    try {
      const updatePayload: any = {
        iar_commentcompletionstatus: 2, // 2 = Done
        iar_completeddatetime: new Date().toISOString(),
      };
      if (resolverGuid) {
        updatePayload['iar_CompletedBy@odata.bind'] = `/systemusers(${resolverGuid})`;
      }

      await withTimeout(
        Iar_issuecommentsesService.update(resolvedCommentGuid, updatePayload),
        15000,
        'Iar_issuecommentsesService.update'
      );
      console.info('[DataverseReportingService] Successfully marked comment completion status to Done (2) in iar_issuecommentses:', resolvedCommentGuid);
    } catch (err) {
      console.warn('[DataverseReportingService] Failed to update comment completion status in Dataverse:', err);
    }
  }

  // Keep mock provider in sync
  mockDataverseProvider.resolveComment(commentId, resolvedByUserId);

  return {
    commentId,
    issueId: '',
    fieldKey: '',
    content: '',
    authorId: '',
    authorName: '',
    isResolved: true,
    resolvedById: resolverGuid || resolvedByUserId,
    resolvedByName: resolvedByName || 'Reviewer',
    resolvedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Helper to resolve an issue's clean GUID and engagement GUID from any ID, code, or title
 */
async function resolveIssueGuidAndEngagementGuid(issueId: string, engagementId?: string) {
  let cleanIssueGuid = extractCleanGuid(issueId);
  let cleanEngGuid = extractCleanGuid(engagementId);

  if (!isGuid(cleanIssueGuid) || !isGuid(cleanEngGuid)) {
    try {
      const issuesRes = await Iar_issuesesService.getAll();
      const issuesList = extractDataverseArray(issuesRes as any);
      const targetLower = (issueId || '').toLowerCase().trim();
      const matched = issuesList.find((iss: any) => {
        const ig = extractCleanGuid(iss.iar_issuesid || iss.id);
        const ic = String(iss.iar_issueid || '').toLowerCase().trim();
        const it = String(iss.iar_issuetitle || '').toLowerCase().trim();
        return ig === targetLower || ic === targetLower || it === targetLower;
      });
      if (matched) {
        cleanIssueGuid = extractCleanGuid(matched.iar_issuesid || matched.id);
        if (!cleanEngGuid) {
          cleanEngGuid = extractCleanGuid(matched._iar_engagementid_value || matched.iar_engagementid);
        }
      }
    } catch (e) {
      console.warn('[DataverseReportingService] Failed resolving issue GUID:', e);
    }
  }

  return { cleanIssueGuid, cleanEngGuid };
}



/**
 * Acquires a soft record lock on an issue in Dataverse (iar_issueses),
 * updates lock status and timestamp, binds iar_LockedBy,
 * and emits a GxP audit trail log into iar_issuelogses (iar_logsubtype: 4 Locking).
 */
export async function acquireIssueLock(
  issueId: string,
  engagementId?: string,
  user?: { userId?: string; name?: string; email?: string; role?: string }
): Promise<IssueLock> {
  const { cleanIssueGuid, cleanEngGuid } = await resolveIssueGuidAndEngagementGuid(issueId, engagementId);
  const cleanUserGuid = await resolveUserGuid(user);
  const nowIso = new Date().toISOString();
  const userName = user?.name || 'Current Auditor';

  console.info(`[DataverseReportingService] Acquiring lock for issue ${cleanIssueGuid} by ${userName} (${cleanUserGuid})`);

  if (isGuid(cleanIssueGuid)) {
    try {
      const payload: any = {
        iar_lockstatus: true,
        iar_lockeddatetime: nowIso,
      };
      if (cleanUserGuid) {
        payload['iar_LockedBy@odata.bind'] = `/systemusers(${cleanUserGuid})`;
      }

      await withTimeout(
        Iar_issuesesService.update(cleanIssueGuid, payload),
        15000,
        'Iar_issuesesService.update(acquireLock)'
      );
      console.info(`[DataverseReportingService] Successfully updated iar_issueses lockstatus=true for issue ${cleanIssueGuid}`);
    } catch (err) {
      console.warn(`[DataverseReportingService] Failed updating lock in Dataverse table iar_issueses:`, err);
    }

    // Step 2: GxP audit trail log into iar_issuelogses (subtype 4: Locking)
    if (cleanEngGuid) {
      try {
        await Iar_issuelogsesService.create({
          iar_issuelogid: `LOG-${Date.now().toString().slice(-6)}`,
          iar_modules: 822500001 as any, // 822500001: Audit Report
          iar_logtype: 2 as any, // 2: Workflow
          iar_logsubtype: 4 as any, // 4: Locking
          iar_fieldreference: 'iar_lockstatus',
          iar_fromdata: 'Unlocked',
          iar_todata: `Locked by ${userName}`,
          iar_workflowremarks: `Record lock acquired by ${userName}`,
          iar_loggeddatetime: nowIso,
          'iar_EngagementID@odata.bind': `/iar_engagementses(${cleanEngGuid})`,
          'iar_IssueID@odata.bind': `/iar_issueses(${cleanIssueGuid})`,
          'iar_LoggedBy@odata.bind': cleanUserGuid ? `/systemusers(${cleanUserGuid})` : (undefined as any),
          statecode: 0 as any,
          statuscode: 1 as any,
        });
        console.info(`[DataverseReportingService] Successfully logged lock event to iar_issuelogses for issue ${cleanIssueGuid}`);
      } catch (logErr) {
        console.warn(`[DataverseReportingService] Notice logging lock event to iar_issuelogses:`, logErr);
      }
    }
  }

  // Also sync in-memory mock provider
  mockDataverseProvider.acquireIssueLock(issueId, engagementId, user);

  return {
    isLocked: true,
    lockedBy: {
      userId: cleanUserGuid || user?.userId,
      name: userName,
      email: user?.email,
      role: user?.role || 'Auditor',
      avatar: userName.slice(0, 2).toUpperCase(),
      avatarBg: '#000099',
      timestamp: 'just now',
      activity: 'Reviewing finding workpaper',
    },
    lockedAt: nowIso,
  };
}

/**
 * Releases a soft record lock on an issue in Dataverse (iar_issueses),
 * clears lock status, datetime, and iar_LockedBy binding,
 * and emits an audit trail log into iar_issuelogses (iar_logsubtype: 4 Locking).
 */
export async function releaseIssueLock(
  issueId: string,
  engagementId?: string,
  user?: { userId?: string; name?: string; email?: string; role?: string },
  reason?: string
): Promise<IssueLock> {
  const { cleanIssueGuid, cleanEngGuid } = await resolveIssueGuidAndEngagementGuid(issueId, engagementId);
  const cleanUserGuid = await resolveUserGuid(user);
  const nowIso = new Date().toISOString();
  const userName = user?.name || 'User';

  console.info(`[DataverseReportingService] Releasing lock for issue ${cleanIssueGuid} (reason: ${reason || 'normal exit'})`);

  if (isGuid(cleanIssueGuid)) {
    try {
      const payload: any = {
        iar_lockstatus: false,
        iar_lockeddatetime: null,
        'iar_LockedBy@odata.bind': null,
      };

      await withTimeout(
        Iar_issuesesService.update(cleanIssueGuid, payload),
        15000,
        'Iar_issuesesService.update(releaseLock)'
      );
      console.info(`[DataverseReportingService] Successfully released iar_issueses lock for issue ${cleanIssueGuid}`);
    } catch (err) {
      console.warn(`[DataverseReportingService] Failed releasing lock in Dataverse table iar_issueses:`, err);
    }

    // Step 2: GxP audit trail log into iar_issuelogses (subtype 4: Locking)
    if (cleanEngGuid) {
      try {
        await Iar_issuelogsesService.create({
          iar_issuelogid: `LOG-${Date.now().toString().slice(-6)}`,
          iar_modules: 822500001 as any, // 822500001: Audit Report
          iar_logtype: 2 as any, // 2: Workflow
          iar_logsubtype: 4 as any, // 4: Locking
          iar_fieldreference: 'iar_lockstatus',
          iar_fromdata: 'Locked',
          iar_todata: 'Unlocked',
          iar_workflowremarks: reason || `Record lock released by ${userName}`,
          iar_loggeddatetime: nowIso,
          'iar_EngagementID@odata.bind': `/iar_engagementses(${cleanEngGuid})`,
          'iar_IssueID@odata.bind': `/iar_issueses(${cleanIssueGuid})`,
          'iar_LoggedBy@odata.bind': cleanUserGuid ? `/systemusers(${cleanUserGuid})` : (undefined as any),
          statecode: 0 as any,
          statuscode: 1 as any,
        });
        console.info(`[DataverseReportingService] Successfully logged unlock event to iar_issuelogses for issue ${cleanIssueGuid}`);
      } catch (logErr) {
        console.warn(`[DataverseReportingService] Notice logging unlock event to iar_issuelogses:`, logErr);
      }
    }
  }

  // Also sync in-memory mock provider
  mockDataverseProvider.releaseIssueLock(issueId, engagementId, user, reason);

  return {
    isLocked: false,
    lockedBy: null,
    lockedAt: null,
  };
}

/**
 * Toggle Issue Function ("Mark Not My Function"):
 * Switches an issue's function track between IT (822500000) and FinOps (822500001).
 * Updates iar_issueses (iar_function) in Dataverse and creates an audit trail entry in iar_issuelogses.
 */
export async function toggleIssueFunction(
  issueId: string,
  engagementId?: string,
  user?: { userId?: string; name?: string; email?: string; role?: string },
  forcedTargetFunction?: 'IT' | 'FinOps'
): Promise<{ function: 'IT' | 'FinOps'; tech: 'IT' | 'FinOps' }> {
  const { cleanIssueGuid, cleanEngGuid } = await resolveIssueGuidAndEngagementGuid(issueId, engagementId);
  const cleanUserGuid = await resolveUserGuid(user);
  const actorName = user?.name || 'Reviewer';
  const nowIso = new Date().toISOString();

  let currentFunctionStr: 'IT' | 'FinOps' = 'IT';

  // 1. Determine current function
  if (isGuid(cleanIssueGuid)) {
    try {
      const curr: any = await Iar_issuesesService.get(cleanIssueGuid);
      const currData = curr?.data || curr;
      if (currData?.iar_function === 822500001) {
        currentFunctionStr = 'FinOps';
      } else {
        currentFunctionStr = 'IT';
      }
    } catch {
      // fallback
    }
  }

  const nextFunction: 'IT' | 'FinOps' = forcedTargetFunction || (currentFunctionStr === 'IT' ? 'FinOps' : 'IT');
  const nextFunctionCode = nextFunction === 'FinOps' ? 822500001 : 822500000;

  console.info(`[DataverseReportingService] Toggling issue ${cleanIssueGuid} function from ${currentFunctionStr} to ${nextFunction} by ${actorName}`);

  // 2. Update Dataverse table iar_issueses
  if (isGuid(cleanIssueGuid)) {
    try {
      const payload: any = {
        iar_function: nextFunctionCode,
      };

      await withTimeout(
        Iar_issuesesService.update(cleanIssueGuid, payload),
        15000,
        'Iar_issuesesService.update(toggleIssueFunction)'
      );
      console.info(`[DataverseReportingService] Successfully updated iar_issueses iar_function to ${nextFunctionCode} (${nextFunction})`);
    } catch (err) {
      console.warn('[DataverseReportingService] Notice updating iar_issueses for toggleIssueFunction:', err);
    }

    // 3. Log event into iar_issuelogses
    if (cleanEngGuid) {
      try {
        await Iar_issuelogsesService.create({
          iar_issuelogid: `LOG-${Date.now().toString().slice(-6)}`,
          iar_modules: 822500001 as any, // 822500001: Audit Report
          iar_logtype: 2 as any, // 2: Workflow
          iar_logsubtype: 1 as any, // 1: Update
          iar_fieldreference: 'iar_function',
          iar_fromdata: currentFunctionStr,
          iar_todata: nextFunction,
          iar_workflowremarks: `Function re-assigned from ${currentFunctionStr} to ${nextFunction} via "Mark Not My Function" by ${actorName}`,
          iar_loggeddatetime: nowIso,
          'iar_EngagementID@odata.bind': `/iar_engagementses(${cleanEngGuid})`,
          'iar_IssueID@odata.bind': `/iar_issueses(${cleanIssueGuid})`,
          'iar_LoggedBy@odata.bind': cleanUserGuid ? `/systemusers(${cleanUserGuid})` : (undefined as any),
          statecode: 0 as any,
          statuscode: 1 as any,
        });
        console.info(`[DataverseReportingService] Successfully logged toggle function event to iar_issuelogses`);
      } catch (logErr) {
        console.warn('[DataverseReportingService] Notice logging toggle function event to iar_issuelogses:', logErr);
      }
    }
  }

  // 4. Update in-memory mock provider
  try {
    const mockIssue = mockDataverseProvider.findOrCreateIssue(issueId, engagementId);
    if (mockIssue) {
      mockIssue.function = nextFunction;
      mockIssue.tech = nextFunction;
    }
  } catch (mErr) {
    console.warn('[DataverseReportingService] Mock provider notice:', mErr);
  }

  return {
    function: nextFunction,
    tech: nextFunction,
  };
}

/**
 * Fetches regulatory audit trail logs from Dataverse table iar_issuelogses for an issue
 */
export async function fetchAuditTrailLogsForIssue(
  issueId: string,
  engagementId?: string
): Promise<AuditTrailLog[]> {
  const { cleanIssueGuid } = await resolveIssueGuidAndEngagementGuid(issueId, engagementId);
  try {
    const res = await withTimeout(
      Iar_issuelogsesService.getAll(),
      15000,
      'Iar_issuelogsesService.getAll(fetchAuditLogs)'
    );
    const allLogs = extractDataverseArray(res as any);
    const targetGuid = cleanIssueGuid.toLowerCase();

    // Map users for display names
    const userMap = new Map<string, string>();
    try {
      const uRes = await SystemusersService.getAll();
      const uList = extractDataverseArray(uRes as any);
      uList.forEach((u: any) => {
        const ug = extractCleanGuid(u.systemuserid || u.id);
        if (ug) userMap.set(ug, u.fullname || 'Auditor');
      });
    } catch {
      // ignore user map resolution error
    }

    const matched = allLogs.filter((l: any) => {
      const iGuid = extractCleanGuid(l._iar_issueid_value || l.iar_issueid);
      return iGuid === targetGuid;
    });

    if (matched.length > 0) {
      return matched.map((l: any, idx: number) => {
        const loggedById = extractCleanGuid(l._iar_loggedby_value || l.iar_loggedby);
        const userName = userMap.get(loggedById) || l.iar_loggedbyname || 'Auditor';
        const actionType =
          l.iar_logsubtype === 4
            ? 'LOCK_CHANGE'
            : l.iar_logsubtype === 1
            ? 'STATE_TRANSITION'
            : l.iar_logsubtype === 2
            ? 'CALL_BACK'
            : l.iar_logsubtype === 3
            ? 'SEND_TO'
            : l.iar_logsubtype === 5
            ? 'EXCLUSION'
            : 'FIELD_EDIT';

        return {
          logId: l.iar_issuelogsid || `LOG-${idx + 1}`,
          entityName: 'cr_issue',
          recordId: issueId,
          action: actionType,
          previousState: l.iar_fromdata || '',
          newState: l.iar_todata || '',
          performedByUserId: loggedById,
          performedByUserName: userName,
          userRole: 'Auditor',
          timestamp: l.iar_loggeddatetime || l.createdon || new Date().toISOString(),
          remarks: l.iar_workflowremarks || '',
        };
      });
    }
  } catch (err) {
    console.warn('[DataverseReportingService] Failed fetching audit logs from iar_issuelogses:', err);
  }

  return mockDataverseProvider.getAuditTrailLogs('cr_issue', issueId);
}

export const STATUS_TEXT_TO_CODE: Record<string, number> = {
  'Pending Staff': 822500000,
  'Pending TC': 822500001,
  'Pending Manager': 822500002,
  'Manager Completed (Waiting for Other Issues)': 822500003,
  'Ready for Director Submission': 822500004,
  'Pending Director': 822500005,
  'Pending Business': 822500006,
  'Pending with Business': 822500006,
  'Pending VP': 822500007,
  'Completed': 822500008,
  'Signed Off': 822500008,
  'Excluded': 822500009,
};

export function deriveTargetStatusForRole(roleStr?: string): { statusCode: number; statusText: string } {
  const { baseRole } = getRoleDetails(roleStr);
  if (baseRole === 'vp') {
    return { statusCode: 822500007, statusText: 'Pending VP' };
  }
  if (baseRole === 'director') {
    return { statusCode: 822500005, statusText: 'Pending Director' };
  }
  if (baseRole === 'manager') {
    return { statusCode: 822500002, statusText: 'Pending Manager' };
  }
  if (baseRole === 'team-coordinator') {
    return { statusCode: 822500001, statusText: 'Pending TC' };
  }
  return { statusCode: 822500000, statusText: 'Pending Staff' };
}

/**
 * Call Back Issue:
 * Flexible PULL mechanism enabling any persona to recall an issue from any upper-level review
 * down into their own pending review stage with mandatory justification.
 * Updates iar_issueses (iar_issuestatus, iar_workflowremarks, iar_CurrentOwner, releases lock),
 * and creates an immutable GxP audit log in iar_issuelogses (iar_logsubtype: 2 Call Back).
 */
export async function callBackIssue(
  issueId: string,
  engagementId?: string,
  callerUser?: { userId?: string; name?: string; email?: string; role?: string },
  reason?: string,
  targetStatusText?: string
): Promise<Issue> {
  const { cleanIssueGuid, cleanEngGuid } = await resolveIssueGuidAndEngagementGuid(issueId, engagementId);
  const cleanCallerUserGuid = await resolveUserGuid(callerUser);
  const callerName = callerUser?.name || 'Reviewer';
  const callerRole = callerUser?.role || 'Staff Auditor';

  // Determine target status if not explicitly passed
  const targetInfo = targetStatusText && STATUS_TEXT_TO_CODE[targetStatusText]
    ? { statusCode: STATUS_TEXT_TO_CODE[targetStatusText], statusText: targetStatusText }
    : deriveTargetStatusForRole(callerRole);

  const nowIso = new Date().toISOString();
  console.info(`[DataverseReportingService] Executing Call Back for issue ${cleanIssueGuid} down to ${targetInfo.statusText} by ${callerName}`);

  let previousStatus = 'In Review';
  if (isGuid(cleanIssueGuid)) {
    try {
      const curr: any = await Iar_issuesesService.get(cleanIssueGuid);
      const currData = curr?.data || curr;
      if (currData?.iar_issuestatus != null) {
        previousStatus = ISSUE_STATUS_MAP[currData.iar_issuestatus as number] || 'In Review';
      }
    } catch {
      // proceed if fetch fails
    }

    try {
      const payload: any = {
        iar_issuestatus: targetInfo.statusCode,
        iar_workflowremarks: reason || `Called back to ${targetInfo.statusText} by ${callerName}`,
        iar_lockstatus: false,
        iar_lockeddatetime: null,
        'iar_LockedBy@odata.bind': null,
      };
      if (cleanCallerUserGuid) {
        payload['iar_CurrentOwner@odata.bind'] = `/systemusers(${cleanCallerUserGuid})`;
      }

      await withTimeout(
        Iar_issuesesService.update(cleanIssueGuid, payload),
        15000,
        'Iar_issuesesService.update(callBackIssue)'
      );
      console.info(`[DataverseReportingService] Successfully updated iar_issueses for Call Back (status: ${targetInfo.statusCode})`);
    } catch (err) {
      console.warn('[DataverseReportingService] Notice updating iar_issueses for Call Back:', err);
    }

    if (cleanEngGuid) {
      try {
        await Iar_issuelogsesService.create({
          iar_issuelogid: `LOG-${Date.now().toString().slice(-6)}`,
          iar_modules: 822500001 as any, // 822500001: Audit Report
          iar_logtype: 2 as any, // 2: Workflow
          iar_logsubtype: 2 as any, // 2: Call Back
          iar_fieldreference: 'iar_issuestatus',
          iar_fromdata: previousStatus,
          iar_todata: targetInfo.statusText,
          iar_workflowremarks: reason || `Called back by ${callerName}: ${reason}`,
          iar_loggeddatetime: nowIso,
          'iar_EngagementID@odata.bind': `/iar_engagementses(${cleanEngGuid})`,
          'iar_IssueID@odata.bind': `/iar_issueses(${cleanIssueGuid})`,
          'iar_LoggedBy@odata.bind': cleanCallerUserGuid ? `/systemusers(${cleanCallerUserGuid})` : (undefined as any),
          statecode: 0 as any,
          statuscode: 1 as any,
        });
        console.info(`[DataverseReportingService] Successfully logged Call Back event to iar_issuelogses`);
      } catch (logErr) {
        console.warn('[DataverseReportingService] Notice logging Call Back event to iar_issuelogses:', logErr);
      }
    }
  }

  let updatedMock: any = {};
  try {
    updatedMock = await mockDataverseProvider.callBackIssue(issueId, engagementId, callerUser, reason, targetInfo.statusText);
  } catch (mErr) {
    console.warn('[DataverseReportingService] Mock provider notice:', mErr);
  }
  return {
    ...updatedMock,
    id: issueId,
    status: targetInfo.statusText as any,
    workflowRemarks: reason,
    currentOwner: callerName,
    isLocked: false,
    lockedBy: null,
    lockedAt: null,
  };
}

/**
 * Send To Peer:
 * Dedicated PUSH mechanism enabling any peer handover within the engagement team.
 * Transitions iar_issuestatus to the recipient's pending review stage, binds iar_CurrentOwner to recipient,
 * stores handover notes in iar_workflowremarks, releases lock, and logs to iar_issuelogses (iar_logsubtype: 3 Send To).
 */
export async function sendToPeer(
  issueId: string,
  engagementId?: string,
  senderUser?: { userId?: string; name?: string; email?: string; role?: string },
  recipient?: { id?: string; userId?: string; name: string; displayName?: string; email?: string; roleName?: string; roleId?: string; roleAbbr?: string },
  remarks?: string
): Promise<Issue> {
  const { cleanIssueGuid, cleanEngGuid } = await resolveIssueGuidAndEngagementGuid(issueId, engagementId);
  const cleanSenderUserGuid = await resolveUserGuid(senderUser);
  const cleanRecipientGuid = await resolveUserGuid(recipient ? { userId: recipient.userId || recipient.id, name: recipient.name || recipient.displayName, email: recipient.email } : undefined);
  
  const senderName = senderUser?.name || 'Auditor';
  const recipientName = recipient?.displayName || recipient?.name || 'Peer Reviewer';
  const recipientRole = recipient?.roleName || recipient?.roleId || 'Auditor';

  const targetInfo = deriveTargetStatusForRole(recipientRole);
  const nowIso = new Date().toISOString();

  console.info(`[DataverseReportingService] Executing Send To peer for issue ${cleanIssueGuid} to ${recipientName} (${targetInfo.statusText})`);

  let previousStatus = 'In Review';
  if (isGuid(cleanIssueGuid)) {
    try {
      const curr: any = await Iar_issuesesService.get(cleanIssueGuid);
      const currData = curr?.data || curr;
      if (currData?.iar_issuestatus != null) {
        previousStatus = ISSUE_STATUS_MAP[currData.iar_issuestatus as number] || 'In Review';
      }
    } catch {
      // proceed if fetch fails
    }

    try {
      const payload: any = {
        iar_issuestatus: targetInfo.statusCode,
        iar_workflowremarks: remarks || `Handed over to ${recipientName} (${targetInfo.statusText})`,
        iar_lockstatus: false,
        iar_lockeddatetime: null,
        'iar_LockedBy@odata.bind': null,
      };
      if (cleanRecipientGuid) {
        payload['iar_CurrentOwner@odata.bind'] = `/systemusers(${cleanRecipientGuid})`;
      }

      await withTimeout(
        Iar_issuesesService.update(cleanIssueGuid, payload),
        15000,
        'Iar_issuesesService.update(sendToPeer)'
      );
      console.info(`[DataverseReportingService] Successfully updated iar_issueses for Send To (status: ${targetInfo.statusCode}, owner: ${cleanRecipientGuid})`);
    } catch (err) {
      console.warn('[DataverseReportingService] Notice updating iar_issueses for Send To:', err);
    }

    if (cleanEngGuid) {
      try {
        await Iar_issuelogsesService.create({
          iar_issuelogid: `LOG-${Date.now().toString().slice(-6)}`,
          iar_modules: 822500001 as any, // 822500001: Audit Report
          iar_logtype: 2 as any, // 2: Workflow
          iar_logsubtype: 3 as any, // 3: Send To
          iar_fieldreference: 'iar_CurrentOwner',
          iar_fromdata: `${senderName} (${previousStatus})`,
          iar_todata: `${recipientName} (${targetInfo.statusText})`,
          iar_workflowremarks: remarks || `Handover notes from ${senderName}`,
          iar_loggeddatetime: nowIso,
          'iar_EngagementID@odata.bind': `/iar_engagementses(${cleanEngGuid})`,
          'iar_IssueID@odata.bind': `/iar_issueses(${cleanIssueGuid})`,
          'iar_LoggedBy@odata.bind': cleanSenderUserGuid ? `/systemusers(${cleanSenderUserGuid})` : (undefined as any),
          statecode: 0 as any,
          statuscode: 1 as any,
        });
        console.info(`[DataverseReportingService] Successfully logged Send To event to iar_issuelogses`);
      } catch (logErr) {
        console.warn('[DataverseReportingService] Notice logging Send To event to iar_issuelogses:', logErr);
      }
    }
  }

  let updatedMock: any = {};
  try {
    updatedMock = await mockDataverseProvider.sendToPeer(issueId, engagementId, senderUser, recipient, remarks, targetInfo.statusText);
  } catch (mErr) {
    console.warn('[DataverseReportingService] Mock provider notice:', mErr);
  }
  return {
    ...updatedMock,
    id: issueId,
    status: targetInfo.statusText as any,
    workflowRemarks: remarks,
    currentOwner: recipientName,
    isLocked: false,
    lockedBy: null,
    lockedAt: null,
  };
}

/**
 * Exclude Issue:
 * Soft exclusion of finding from audit report compilation per GxP compliance.
 * Sets iar_issuestatus: 822500009 (Excluded), stores mandatory reason in iar_workflowremarks,
 * releases any active lock, and creates an immutable regulatory audit log in iar_issuelogses (iar_logsubtype: 5 Exclude).
 */
export async function excludeIssue(
  issueId: string,
  engagementId?: string,
  user?: { userId?: string; name?: string; email?: string; role?: string },
  reason?: string
): Promise<Issue> {
  const { cleanIssueGuid, cleanEngGuid } = await resolveIssueGuidAndEngagementGuid(issueId, engagementId);
  const cleanUserGuid = await resolveUserGuid(user);
  const actorName = user?.name || 'Reviewer';
  const nowIso = new Date().toISOString();

  console.info(`[DataverseReportingService] Executing Exclude Issue for ${cleanIssueGuid} by ${actorName}`);

  let previousStatus = 'Pending TC';
  if (isGuid(cleanIssueGuid)) {
    try {
      const curr: any = await Iar_issuesesService.get(cleanIssueGuid);
      const currData = curr?.data || curr;
      if (currData?.iar_issuestatus != null) {
        previousStatus = ISSUE_STATUS_MAP[currData.iar_issuestatus as number] || 'Pending TC';
      }
    } catch {
      // ignore
    }

    try {
      const payload: any = {
        iar_issuestatus: 822500009, // Excluded
        iar_workflowremarks: `[EXCLUDED_FROM:${previousStatus}] ${reason || 'Excluded from report'}`,
        iar_lockstatus: false,
        iar_lockeddatetime: null,
        'iar_LockedBy@odata.bind': null,
      };

      await withTimeout(
        Iar_issuesesService.update(cleanIssueGuid, payload),
        15000,
        'Iar_issuesesService.update(excludeIssue)'
      );
      console.info(`[DataverseReportingService] Successfully updated iar_issueses for Exclude (status: 822500009)`);
    } catch (err) {
      console.warn('[DataverseReportingService] Notice updating iar_issueses for Exclude:', err);
    }

    if (cleanEngGuid) {
      try {
        await Iar_issuelogsesService.create({
          iar_issuelogid: `LOG-${Date.now().toString().slice(-6)}`,
          iar_modules: 822500001 as any, // 822500001: Audit Report
          iar_logtype: 2 as any, // 2: Workflow
          iar_logsubtype: 5 as any, // 5: Exclude
          iar_fieldreference: 'iar_issuestatus',
          iar_fromdata: previousStatus,
          iar_todata: 'Excluded',
          iar_workflowremarks: reason || `Excluded by ${actorName}`,
          iar_loggeddatetime: nowIso,
          'iar_EngagementID@odata.bind': `/iar_engagementses(${cleanEngGuid})`,
          'iar_IssueID@odata.bind': `/iar_issueses(${cleanIssueGuid})`,
          'iar_LoggedBy@odata.bind': cleanUserGuid ? `/systemusers(${cleanUserGuid})` : (undefined as any),
          statecode: 0 as any,
          statuscode: 1 as any,
        });
        console.info(`[DataverseReportingService] Successfully logged Exclude event to iar_issuelogses`);
      } catch (logErr) {
        console.warn('[DataverseReportingService] Notice logging Exclude event to iar_issuelogses:', logErr);
      }
    }
  }

  let updatedMock: any = {};
  try {
    updatedMock = await mockDataverseProvider.excludeIssue(issueId, engagementId, user, reason, previousStatus);
  } catch (mErr) {
    console.warn('[DataverseReportingService] Mock provider notice:', mErr);
  }
  return {
    ...updatedMock,
    id: issueId,
    status: 'Excluded',
    isExcluded: true,
    previousStatus: previousStatus,
    workflowRemarks: reason,
    isLocked: false,
    lockedBy: null,
    lockedAt: null,
  };
}

/**
 * Include Issue (Re-inclusion):
 * Re-includes an excluded finding back into the audit report.
 * Per FRD Section 4.2, transitions finding directly into Pending with [Persona performing include]
 * (Staff -> Pending Staff, TC -> Pending TC, Manager -> Pending Manager, Director -> Pending Director).
 * Updates iar_issueses, releases lock, and logs to iar_issuelogses (iar_logsubtype: 1 Submit).
 */
export async function includeIssue(
  issueId: string,
  engagementId?: string,
  user?: { userId?: string; name?: string; email?: string; role?: string },
  reason?: string,
  targetStatusText?: string
): Promise<Issue> {
  const { cleanIssueGuid, cleanEngGuid } = await resolveIssueGuidAndEngagementGuid(issueId, engagementId);
  const cleanUserGuid = await resolveUserGuid(user);
  const actorName = user?.name || 'Reviewer';
  const actorRole = user?.role || 'Staff Auditor';

  // Per FRD Section 4.2: restore into Pending with [Persona performing include]
  const targetInfo = targetStatusText && STATUS_TEXT_TO_CODE[targetStatusText]
    ? { statusCode: STATUS_TEXT_TO_CODE[targetStatusText], statusText: targetStatusText }
    : deriveTargetStatusForRole(actorRole);

  const nowIso = new Date().toISOString();
  console.info(`[DataverseReportingService] Executing Re-include Issue for ${cleanIssueGuid} into ${targetInfo.statusText} by ${actorName}`);

  if (isGuid(cleanIssueGuid)) {
    try {
      const payload: any = {
        iar_issuestatus: targetInfo.statusCode,
        iar_workflowremarks: reason || `Re-included in audit report by ${actorName} (${targetInfo.statusText})`,
        iar_lockstatus: false,
        iar_lockeddatetime: null,
        'iar_LockedBy@odata.bind': null,
      };
      if (cleanUserGuid) {
        payload['iar_CurrentOwner@odata.bind'] = `/systemusers(${cleanUserGuid})`;
      }

      await withTimeout(
        Iar_issuesesService.update(cleanIssueGuid, payload),
        15000,
        'Iar_issuesesService.update(includeIssue)'
      );
      console.info(`[DataverseReportingService] Successfully updated iar_issueses for Include (status: ${targetInfo.statusCode})`);
    } catch (err) {
      console.warn('[DataverseReportingService] Notice updating iar_issueses for Include:', err);
    }

    if (cleanEngGuid) {
      try {
        await Iar_issuelogsesService.create({
          iar_issuelogid: `LOG-${Date.now().toString().slice(-6)}`,
          iar_modules: 822500001 as any, // 822500001: Audit Report
          iar_logtype: 2 as any, // 2: Workflow
          iar_logsubtype: 1 as any, // 1: Submit (Re-inclusion)
          iar_fieldreference: 'iar_issuestatus',
          iar_fromdata: 'Excluded',
          iar_todata: targetInfo.statusText,
          iar_workflowremarks: reason || `Restored and included in report by ${actorName}`,
          iar_loggeddatetime: nowIso,
          'iar_EngagementID@odata.bind': `/iar_engagementses(${cleanEngGuid})`,
          'iar_IssueID@odata.bind': `/iar_issueses(${cleanIssueGuid})`,
          'iar_LoggedBy@odata.bind': cleanUserGuid ? `/systemusers(${cleanUserGuid})` : (undefined as any),
          statecode: 0 as any,
          statuscode: 1 as any,
        });
        console.info(`[DataverseReportingService] Successfully logged Include event to iar_issuelogses`);
      } catch (logErr) {
        console.warn('[DataverseReportingService] Notice logging Include event to iar_issuelogses:', logErr);
      }
    }
  }

  let updatedMock: any = {};
  try {
    updatedMock = await mockDataverseProvider.includeIssue(issueId, engagementId, user, reason, targetInfo.statusText);
  } catch (mErr) {
    console.warn('[DataverseReportingService] Mock provider notice:', mErr);
  }
  return {
    ...updatedMock,
    id: issueId,
    status: targetInfo.statusText as any,
    isExcluded: false,
    workflowRemarks: reason,
    currentOwner: actorName,
    isLocked: false,
    lockedBy: null,
    lockedAt: null,
  };
}

function getStandaloneOfflineJobs(): any[] {
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
      name: 'Amanda Palmer',
      displayName: 'Amanda Palmer',
      email: 'amanda.palmer@jnj.com',
      roleId: 'it-manager',
      roleName: 'Audit Manager',
      roleAbbr: 'IT MGR',
      initials: 'AP',
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
      currentOwner: 'Amanda Palmer',
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
      currentOwner: 'Gowri P',
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
    leadOwner: 'Tamilselvan Natarajan',
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

/**
 * Advance single issue workflow to a target review status.
 * Updates iar_issueses, releases locks, and records immutable audit log in iar_issuelogses.
 */
export async function advanceIssueWorkflow(
  issueId: string,
  engagementId?: string,
  targetStatusText?: string,
  remarks?: string,
  user?: { userId?: string; name?: string; email?: string; role?: string },
  assignedUsers?: any[],
  currentIssue?: Partial<Issue>
): Promise<Issue> {
  const { cleanIssueGuid, cleanEngGuid } = await resolveIssueGuidAndEngagementGuid(issueId, engagementId);
  const cleanUserGuid = await resolveUserGuid(user);
  const actorName = user?.name || 'Reviewer';
  const actorRole = user?.role || 'Staff Auditor';

  const targetInfo = targetStatusText && STATUS_TEXT_TO_CODE[targetStatusText] !== undefined
    ? { statusCode: STATUS_TEXT_TO_CODE[targetStatusText], statusText: targetStatusText }
    : deriveTargetStatusForRole(actorRole);

  const targetOwner = await resolveTargetOwnerForStatusAsync(
    targetInfo.statusText,
    assignedUsers,
    currentIssue,
    user
  );

  const nowIso = new Date().toISOString();
  console.info(`[DataverseReportingService] Advancing issue ${cleanIssueGuid} to ${targetInfo.statusText} (Owner: ${targetOwner.ownerName}) by ${actorName}`);

  let previousStatus = 'Pending';
  if (isGuid(cleanIssueGuid)) {
    try {
      const curr: any = await Iar_issuesesService.get(cleanIssueGuid);
      const currData = curr?.data || curr;
      if (currData?.iar_issuestatus != null) {
        previousStatus = ISSUE_STATUS_MAP[currData.iar_issuestatus as number] || 'In Review';
      }
    } catch {
      // proceed if fetch fails
    }

    try {
      const payload: any = {
        iar_issuestatus: targetInfo.statusCode,
        iar_workflowremarks: remarks || `Advanced to ${targetInfo.statusText} by ${actorName} (${actorRole})`,
        iar_lockstatus: false,
        iar_lockeddatetime: null,
        'iar_LockedBy@odata.bind': null,
      };
      if (targetOwner.ownerGuid && isGuid(targetOwner.ownerGuid)) {
        payload['iar_CurrentOwner@odata.bind'] = `/systemusers(${targetOwner.ownerGuid})`;
      }
      if (currentIssue) {
        if (currentIssue.title) payload.iar_issuetitle = currentIssue.title;
        if (currentIssue.description || currentIssue.issueNarrative) {
          payload.iar_description = currentIssue.description || currentIssue.issueNarrative;
        }
        if (currentIssue.rootCause) payload.iar_rootcause = currentIssue.rootCause;
        if (currentIssue.impact) payload.iar_impact = currentIssue.impact;
        if (currentIssue.recommendation) payload.iar_recommendation = currentIssue.recommendation;
        if (currentIssue.businessManagementReason) {
          payload.iar_businessmanagementreason = currentIssue.businessManagementReason;
        }
        if (currentIssue.businessManagementResponse || currentIssue.managementResponse) {
          payload.iar_businessmanagementresponse =
            currentIssue.businessManagementResponse || currentIssue.managementResponse;
        }
        if (currentIssue.agreedRemediationDate || currentIssue.remediationTargetDate) {
          payload.iar_agreedremediationdate =
            currentIssue.agreedRemediationDate || currentIssue.remediationTargetDate;
        }
        const pboGuid = extractCleanGuid(currentIssue.primaryBusinessOwnerId || currentIssue.businessContactId);
        if (isGuid(pboGuid)) {
          payload['iar_PrimaryBusinessOwner@odata.bind'] = `/systemusers(${pboGuid})`;
        }
      }

      await withTimeout(
        Iar_issuesesService.update(cleanIssueGuid, payload),
        15000,
        'Iar_issuesesService.update(advanceIssueWorkflow)'
      );
      console.info(`[DataverseReportingService] Successfully updated iar_issueses status to ${targetInfo.statusCode}`);

      // Create immutable audit log in iar_issuelogses
      const logPayload: any = {
        iar_modules: 822500001, // Audit Report
        iar_logtype: 2, // Workflow
        iar_logsubtype: 1, // Submit
        iar_fromdata: previousStatus,
        iar_todata: targetInfo.statusText,
        iar_workflowremarks: remarks || `Advanced to ${targetInfo.statusText} by ${actorName} (${actorRole})`,
        iar_loggeddatetime: nowIso,
        'iar_IssueID@odata.bind': `/iar_issueses(${cleanIssueGuid})`,
      };
      if (cleanUserGuid) {
        logPayload['iar_LoggedBy@odata.bind'] = `/systemusers(${cleanUserGuid})`;
      }
      if (cleanEngGuid) {
        logPayload['iar_EngagementID@odata.bind'] = `/iar_engagementses(${cleanEngGuid})`;
      }

      await withTimeout(
        Iar_issuelogsesService.create(logPayload),
        15000,
        'Iar_issuelogsesService.create(advanceIssueWorkflow)'
      );
      console.info(`[DataverseReportingService] Successfully created workflow submit audit log in iar_issuelogses`);
    } catch (err: any) {
      console.warn(`[DataverseReportingService] Live Dataverse update failed:`, err);
    }
  }

  // Update mock cache for fallback consistency
  try {
    const updated = await mockDataverseProvider.updateIssueStatus(
      issueId,
      targetInfo.statusText as any,
      remarks || `Advanced to ${targetInfo.statusText} by ${actorName}`
    );
    return {
      ...updated,
      status: targetInfo.statusText as any,
      currentOwner: targetOwner.ownerName,
      isLocked: false,
      lockedBy: null,
      lockedAt: null,
      workflowRemarks: remarks,
    };
  } catch {
    return {
      id: issueId,
      status: targetInfo.statusText as any,
      currentOwner: targetOwner.ownerName,
      isLocked: false,
      lockedBy: null,
      lockedAt: null,
      workflowRemarks: remarks,
    } as any;
  }
}

/**
 * Handles Manager submission of an issue.
 * If other active sibling issues are still pending, transitions this issue to
 * "Manager Completed (Waiting for Other Issues)".
 * If this was the last active issue pending, batch-transitions ALL active issues
 * under the engagement to "Ready for Director Submission".
 */
export async function managerSubmitIssueWorkflow(
  issueId: string,
  engagementId: string,
  allEngagementIssues: Issue[],
  remarks?: string,
  user?: { userId?: string; name?: string; email?: string; role?: string },
  assignedUsers?: any[]
): Promise<{ nextStatus: string; isBatchReadyForDirector: boolean; updatedIssues: Issue[] }> {
  const activeIssues = allEngagementIssues.filter(
    (i) => i.status !== 'Excluded' && !(i as any).isExcluded
  );
  const cleanCurrentId = extractCleanGuid(issueId).toLowerCase();
  const siblingActiveIssues = activeIssues.filter(
    (i) => i.id !== issueId && extractCleanGuid(i.id).toLowerCase() !== cleanCurrentId
  );
  const currentSelf = activeIssues.find(
    (i) => i.id === issueId || extractCleanGuid(i.id).toLowerCase() === cleanCurrentId
  );

  // Check if all other active sibling issues have already passed manager review
  const allOtherSiblingsCompleted = siblingActiveIssues.every(
    (i) =>
      i.status === 'Manager Completed (Waiting for Other Issues)' ||
      i.status === 'Ready for Director Submission' ||
      i.status === 'Pending Director'
  );

  if (siblingActiveIssues.length === 0 || allOtherSiblingsCompleted) {
    // All active issues under this engagement are now ready for director!
    const targetStatus = 'Ready for Director Submission';
    const updatedList: Issue[] = [];

    // Advance this issue
    const updatedSelf = await advanceIssueWorkflow(
      issueId,
      engagementId,
      targetStatus,
      remarks || 'Manager completed review (Last issue submitted - Batch ready for Director)',
      user,
      assignedUsers,
      currentSelf
    );
    updatedList.push(updatedSelf);

    // Also transition any sibling issues that were waiting in "Manager Completed (Waiting for Other Issues)"
    for (const sib of siblingActiveIssues) {
      if (sib.status === 'Manager Completed (Waiting for Other Issues)') {
        try {
          const updSib = await advanceIssueWorkflow(
            sib.id,
            engagementId,
            targetStatus,
            'Batch updated to Ready for Director Submission',
            user,
            assignedUsers,
            sib
          );
          updatedList.push(updSib);
        } catch (e) {
          console.warn(`[DataverseReportingService] Failed advancing sibling issue ${sib.id} to batch ready:`, e);
        }
      }
    }

    return {
      nextStatus: targetStatus,
      isBatchReadyForDirector: true,
      updatedIssues: updatedList,
    };
  } else {
    // Other active issues are still pending with Staff, TC, or Manager
    const targetStatus = 'Manager Completed (Waiting for Other Issues)';
    const updatedSelf = await advanceIssueWorkflow(
      issueId,
      engagementId,
      targetStatus,
      remarks || 'Manager completed review on this issue. Waiting for other issues.',
      user,
      assignedUsers,
      currentSelf
    );
    return {
      nextStatus: targetStatus,
      isBatchReadyForDirector: false,
      updatedIssues: [updatedSelf],
    };
  }
}

/**
 * Batch advance all active issues in an engagement to a target status.
 */
export async function batchAdvanceEngagementIssues(
  engagementId: string,
  issues: Issue[],
  targetStatusText: string,
  remarks?: string,
  user?: { userId?: string; name?: string; email?: string; role?: string },
  assignedUsers?: any[]
): Promise<Issue[]> {
  const activeIssues = issues.filter(
    (i) => i.status !== 'Excluded' && !(i as any).isExcluded
  );
  console.info(`[DataverseReportingService] Batch advancing ${activeIssues.length} active issues to ${targetStatusText}`);

  const updatedList: Issue[] = [];
  for (const iss of activeIssues) {
    try {
      const upd = await advanceIssueWorkflow(
        iss.id,
        engagementId,
        targetStatusText,
        remarks,
        user,
        assignedUsers,
        iss
      );
      updatedList.push(upd);
    } catch (e) {
      console.warn(`[DataverseReportingService] Error advancing issue ${iss.id} in batch:`, e);
      updatedList.push({
        ...iss,
        status: targetStatusText as any,
        workflowRemarks: remarks,
        isLocked: false,
        lockedBy: null,
      });
    }
  }

  return updatedList;
}

/**
 * Official Audit Report Sign-Off and Seal.
 * Transitions all active issues to Completed (822500008) and updates
 * iar_engagementses.iar_reportstatus to Executive Report Inprogress (822500002).
 */
export async function signOffAuditReport(
  engagementId: string,
  issues: Issue[],
  user?: { userId?: string; name?: string; email?: string; role?: string },
  remarks?: string,
  assignedUsers?: any[]
): Promise<{ updatedIssues: Issue[]; reportStatus: number }> {
  const actorName = user?.name || 'Reviewer';
  const actorRole = user?.role || 'Audit Director';

  // 1. Advance all active issues to Completed
  const updatedIssues = await batchAdvanceEngagementIssues(
    engagementId,
    issues,
    'Completed',
    remarks || `Audit report officially signed off and sealed by ${actorName} (${actorRole})`,
    user,
    assignedUsers
  );

  // 2. Update iar_engagementses report status to Executive Report Inprogress (822500002)
  const cleanEngGuid = extractCleanGuid(engagementId);
  if (isGuid(cleanEngGuid)) {
    try {
      await withTimeout(
        Iar_engagementsesService.update(cleanEngGuid, {
          iar_reportstatus: 822500002, // Executive Report Inprogress
        }),
        15000,
        'Iar_engagementsesService.update(iar_reportstatus: 822500002)'
      );
      console.info(`[DataverseReportingService] Successfully updated engagement ${cleanEngGuid} iar_reportstatus to 822500002`);
    } catch (err) {
      console.warn(`[DataverseReportingService] Failed updating iar_engagementses report status:`, err);
    }
  }

  return {
    updatedIssues,
    reportStatus: 822500002,
  };
}



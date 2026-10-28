import type { IDataProvider } from '../dataProvider';
import type {
  Assessment,
  Engagement,
  Issue,
  IssueStatus,
  IssueAiVersion,
  IssueComment,
  AuditTrailLog,
  IssueLock
} from '../../types/dataverse.types';
import { SEED_ASSESSMENTS, SEED_ENGAGEMENTS, SEED_ISSUES } from './mockData';

export class MockDataverseProvider implements IDataProvider {
  private assessments: Assessment[] = [...SEED_ASSESSMENTS];
  private engagements: Engagement[] = [...SEED_ENGAGEMENTS];
  private issues: Issue[] = [...SEED_ISSUES];
  private comments: IssueComment[] = [];
  private aiVersions: IssueAiVersion[] = [];
  private auditLogs: AuditTrailLog[] = [];

  findOrCreateIssue(issueId: string, engagementId?: string): Issue {
    const clean = (issueId || '').replace(/[{}]/g, '').toLowerCase().trim();
    let found = this.issues.find(i => 
      i.id === issueId || 
      (i.id && i.id.replace(/[{}]/g, '').toLowerCase().trim() === clean)
    );
    if (!found) {
      found = {
        id: issueId,
        engagementId: engagementId || 'REP-2026-001',
        status: 'Pending TC',
      } as Issue;
      this.issues.push(found);
    }
    return found;
  }

  async getAssessments(): Promise<Assessment[]> {
    return Promise.resolve([...this.assessments]);
  }

  async getEngagements(assessmentYear?: number): Promise<Engagement[]> {
    if (assessmentYear) {
      return Promise.resolve(this.engagements.filter(e => e.assessmentId.includes(assessmentYear.toString())));
    }
    return Promise.resolve([...this.engagements]);
  }

  async getEngagementById(engagementId: string): Promise<Engagement | null> {
    const found = this.engagements.find(e => e.id === engagementId || e.reportId === engagementId);
    return Promise.resolve(found ? { ...found } : null);
  }

  async getIssuesByEngagementId(engagementId: string): Promise<Issue[]> {
    return Promise.resolve(this.issues.filter(i => i.engagementId === engagementId));
  }

  async getIssueById(issueId: string): Promise<Issue | null> {
    const found = this.issues.find(i => i.id === issueId);
    return Promise.resolve(found ? { ...found } : null);
  }

  async saveIssue(issueData: Partial<Issue>): Promise<Issue> {
    if (issueData.id) {
      const idx = this.issues.findIndex(i => i.id === issueData.id);
      if (idx >= 0) {
        this.issues[idx] = { ...this.issues[idx], ...issueData } as Issue;
        return Promise.resolve({ ...this.issues[idx] });
      }
    }

    const newIssue: Issue = {
      id: `ISSUE-${String(this.issues.length + 1).padStart(3, '0')}`,
      engagementId: issueData.engagementId || 'REP-2026-001',
      testProcedureCode: issueData.testProcedureCode || 'TP-101',
      title: issueData.title || 'Untitled Issue',
      criticality: (issueData.criticality || '') as any,
      status: 'Pending Staff',
      ...issueData
    } as Issue;

    this.issues.push(newIssue);
    return Promise.resolve({ ...newIssue });
  }

  async updateIssueStatus(issueId: string, targetStatus: IssueStatus, remarks?: string): Promise<Issue> {
    const issue = this.findOrCreateIssue(issueId);
    const priorState = issue.status;
    issue.status = targetStatus;

    // Record immutable audit trail log
    this.auditLogs.push({
      logId: `LOG-${Date.now()}`,
      entityName: 'cr_issue',
      recordId: issueId,
      action: 'STATUS_TRANSITION',
      previousState: priorState,
      newState: targetStatus,
      performedByUserId: 'USR-003',
      performedByUserName: 'Current User',
      userRole: 'Audit Manager',
      remarks: remarks || `Transitioned from ${priorState} to ${targetStatus}`,
      timestamp: new Date().toISOString()
    });

    return Promise.resolve({ ...issue });
  }

  async excludeIssue(
    issueId: string,
    _engagementId?: string,
    user?: { userId?: string; name?: string; email?: string; role?: string },
    reason?: string,
    previousStatus?: string
  ): Promise<Issue> {
    const issue = this.findOrCreateIssue(issueId, _engagementId);
    const priorState = previousStatus || issue.status;
    issue.status = 'Excluded';
    issue.isExcluded = true;
    issue.previousStatus = priorState;
    issue.excludedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    issue.isLocked = false;
    issue.lockedBy = null;
    issue.lockedAt = null;
    (issue as any).workflowRemarks = reason;

    this.auditLogs.push({
      logId: `LOG-${Date.now()}`,
      entityName: 'cr_issue',
      recordId: issueId,
      action: 'EXCLUDE',
      previousState: priorState,
      newState: 'Excluded',
      performedByUserId: user?.userId || 'USR-CURRENT',
      performedByUserName: user?.name || 'Reviewer',
      userRole: user?.role || 'Auditor',
      remarks: reason || 'Excluded from report',
      timestamp: new Date().toISOString()
    });

    return Promise.resolve({ ...issue });
  }

  async includeIssue(
    issueId: string,
    _engagementId?: string,
    user?: { userId?: string; name?: string; email?: string; role?: string },
    reason?: string,
    targetStatus?: string
  ): Promise<Issue> {
    const issue = this.findOrCreateIssue(issueId, _engagementId);
    const nextStatus = (targetStatus || issue.previousStatus || 'Pending Staff') as IssueStatus;
    issue.status = nextStatus;
    issue.isExcluded = false;
    issue.excludedAt = null;
    issue.isLocked = false;
    issue.lockedBy = null;
    issue.lockedAt = null;
    (issue as any).workflowRemarks = reason || 'Restored and included in report';

    this.auditLogs.push({
      logId: `LOG-${Date.now()}`,
      entityName: 'cr_issue',
      recordId: issueId,
      action: 'INCLUDE',
      previousState: 'Excluded',
      newState: nextStatus,
      performedByUserId: user?.userId || 'USR-CURRENT',
      performedByUserName: user?.name || 'Reviewer',
      userRole: user?.role || 'Auditor',
      remarks: reason || 'Re-included in audit report',
      timestamp: new Date().toISOString()
    });

    return Promise.resolve({ ...issue });
  }

  async acquireIssueLock(
    issueId: string,
    _engagementId?: string,
    user?: { userId?: string; name?: string; email?: string; role?: string }
  ): Promise<IssueLock> {
    const target = this.issues.find(i => i.id === issueId);
    const lockObj: IssueLock = {
      isLocked: true,
      lockedBy: {
        userId: user?.userId || 'USR-001',
        name: user?.name || 'Current Auditor',
        email: user?.email,
        role: user?.role || 'Auditor',
        avatar: (user?.name || 'CA').slice(0, 2).toUpperCase(),
        avatarBg: '#000099',
        timestamp: 'just now',
        activity: 'Reviewing finding workpaper'
      },
      lockedAt: new Date().toISOString()
    };
    if (target) {
      target.isLocked = true;
      target.lockedBy = lockObj.lockedBy;
      target.lockedAt = lockObj.lockedAt;
    }
    return Promise.resolve(lockObj);
  }

  async releaseIssueLock(
    issueId: string,
    _engagementId?: string,
    _user?: { userId?: string; name?: string; email?: string; role?: string },
    _reason?: string
  ): Promise<IssueLock> {
    const target = this.issues.find(i => i.id === issueId);
    if (target) {
      target.isLocked = false;
      target.lockedBy = null;
      target.lockedAt = null;
    }
    return Promise.resolve({ isLocked: false, lockedBy: null, lockedAt: null });
  }

  async callBackIssue(
    issueId: string,
    _engagementId?: string,
    user?: { userId?: string; name?: string; email?: string; role?: string },
    reason?: string,
    targetStatus?: string
  ): Promise<Issue> {
    const issue = this.findOrCreateIssue(issueId, _engagementId);
    const priorState = issue.status;
    const nextStatus = (targetStatus || 'Pending Staff') as IssueStatus;
    issue.status = nextStatus;
    issue.isLocked = false;
    issue.lockedBy = null;
    issue.lockedAt = null;
    (issue as any).workflowRemarks = reason;
    (issue as any).currentOwner = user?.name || 'Reviewer';

    this.auditLogs.push({
      logId: `LOG-${Date.now()}`,
      entityName: 'cr_issue',
      recordId: issueId,
      action: 'CALL_BACK',
      previousState: priorState,
      newState: nextStatus,
      performedByUserId: user?.userId || 'USR-CURRENT',
      performedByUserName: user?.name || 'Reviewer',
      userRole: user?.role || 'Staff Auditor',
      remarks: reason || `Called back to ${nextStatus}`,
      timestamp: new Date().toISOString()
    });

    return Promise.resolve({ ...issue });
  }

  async sendToPeer(
    issueId: string,
    _engagementId?: string,
    sender?: { userId?: string; name?: string; email?: string; role?: string },
    recipient?: { id?: string; userId?: string; name: string; displayName?: string; email?: string; roleName?: string },
    remarks?: string,
    targetStatus?: string
  ): Promise<Issue> {
    const issue = this.findOrCreateIssue(issueId, _engagementId);
    const priorState = issue.status;
    const nextStatus = (targetStatus || 'Pending Staff') as IssueStatus;
    const recipientName = recipient?.displayName || recipient?.name || 'Peer Reviewer';
    issue.status = nextStatus;
    issue.isLocked = false;
    issue.lockedBy = null;
    issue.lockedAt = null;
    (issue as any).workflowRemarks = remarks;
    (issue as any).currentOwner = recipientName;

    this.auditLogs.push({
      logId: `LOG-${Date.now()}`,
      entityName: 'cr_issue',
      recordId: issueId,
      action: 'SEND_TO',
      previousState: `${sender?.name || 'Auditor'} (${priorState})`,
      newState: `${recipientName} (${nextStatus})`,
      performedByUserId: sender?.userId || 'USR-CURRENT',
      performedByUserName: sender?.name || 'Auditor',
      userRole: sender?.role || 'Auditor',
      remarks: remarks || `Handover to ${recipientName}`,
      timestamp: new Date().toISOString()
    });

    return Promise.resolve({ ...issue });
  }

  async getAiVersionsByIssueId(issueId: string): Promise<IssueAiVersion[]> {
    return Promise.resolve(this.aiVersions.filter(v => v.issueId === issueId));
  }

  async createAiVersion(versionData: Partial<IssueAiVersion>): Promise<IssueAiVersion> {
    const newVersion: IssueAiVersion = {
      versionId: `AIVER-${Date.now()}`,
      issueId: versionData.issueId || 'ISSUE-001',
      versionNumber: versionData.versionNumber || 1,
      status: 'CANDIDATE',
      synthesizedHeader: versionData.synthesizedHeader || '',
      synthesizedDescription: versionData.synthesizedDescription || '',
      synthesizedRootCause: versionData.synthesizedRootCause || '',
      synthesizedImpact: versionData.synthesizedImpact || '',
      synthesizedRecommendation: versionData.synthesizedRecommendation || '',
      generatedByUserId: 'USR-003',
      generatedAt: new Date().toISOString(),
      ...versionData
    };
    this.aiVersions.push(newVersion);
    return Promise.resolve({ ...newVersion });
  }

  async getCommentsByIssueId(issueId: string, engagementId?: string): Promise<IssueComment[]> {
    return Promise.resolve(
      this.comments.filter(c => {
        const matchesIssue = !issueId || c.issueId === issueId;
        const matchesEng = !engagementId || !(c as any).engagementId || (c as any).engagementId === engagementId;
        return matchesIssue && matchesEng;
      })
    );
  }

  async addComment(commentData: Partial<IssueComment>): Promise<IssueComment> {
    const newComment: IssueComment = {
      commentId: `COM-${Date.now()}`,
      issueId: commentData.issueId || '',
      fieldKey: commentData.fieldKey || 'general',
      content: commentData.content || '',
      authorId: 'USR-003',
      authorName: 'Amanda Palmer',
      taggedUserId: commentData.taggedUserId || null,
      taggedUserName: commentData.taggedUserName || null,
      isResolved: false,
      createdAt: new Date().toISOString(),
      ...commentData
    };
    this.comments.push(newComment);
    return Promise.resolve({ ...newComment });
  }

  async resolveComment(commentId: string, resolvedByUserId: string): Promise<IssueComment> {
    const comment = this.comments.find(c => c.commentId === commentId);
    if (!comment) throw new Error(`Comment ${commentId} not found`);
    comment.isResolved = true;
    comment.resolvedById = resolvedByUserId;
    comment.resolvedByName = 'Current User';
    comment.resolvedAt = new Date().toISOString();
    return Promise.resolve({ ...comment });
  }

  async getAuditTrailLogs(entityName: string, recordId: string): Promise<AuditTrailLog[]> {
    return Promise.resolve(this.auditLogs.filter(l => l.entityName === entityName && l.recordId === recordId));
  }
}

export const mockDataverseProvider = new MockDataverseProvider();

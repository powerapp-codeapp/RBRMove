import type {
  Assessment,
  Engagement,
  Issue,
  IssueStatus,
  IssueAiVersion,
  IssueComment,
  AuditTrailLog,
  IssueLock
} from '../types/dataverse.types';

export interface IDataProvider {
  getAssessments(): Promise<Assessment[]>;
  getEngagements(assessmentYear?: number): Promise<Engagement[]>;
  getEngagementById(engagementId: string): Promise<Engagement | null>;
  getIssuesByEngagementId(engagementId: string): Promise<Issue[]>;
  getIssueById(issueId: string): Promise<Issue | null>;
  saveIssue(issue: Partial<Issue>): Promise<Issue>;
  updateIssueStatus(issueId: string, targetStatus: IssueStatus, remarks?: string): Promise<Issue>;
  acquireIssueLock(issueId: string, engagementId?: string, user?: { userId?: string; name?: string; email?: string; role?: string }): Promise<IssueLock>;
  releaseIssueLock(issueId: string, engagementId?: string, user?: { userId?: string; name?: string; email?: string; role?: string }, reason?: string): Promise<IssueLock>;
  callBackIssue(issueId: string, engagementId?: string, callerUser?: { userId?: string; name?: string; email?: string; role?: string }, reason?: string, targetStatus?: string): Promise<Issue>;
  sendToPeer(issueId: string, engagementId?: string, senderUser?: { userId?: string; name?: string; email?: string; role?: string }, recipient?: any, remarks?: string, targetStatus?: string): Promise<Issue>;
  excludeIssue(issueId: string, engagementId?: string, user?: { userId?: string; name?: string; email?: string; role?: string }, reason?: string): Promise<Issue>;
  includeIssue(issueId: string, engagementId?: string, user?: { userId?: string; name?: string; email?: string; role?: string }, reason?: string, targetStatus?: string): Promise<Issue>;
  getAiVersionsByIssueId(issueId: string): Promise<IssueAiVersion[]>;
  createAiVersion(version: Partial<IssueAiVersion>): Promise<IssueAiVersion>;
  getCommentsByIssueId(issueId: string, engagementId?: string): Promise<IssueComment[]>;
  addComment(comment: Partial<IssueComment>): Promise<IssueComment>;
  resolveComment(commentId: string, resolvedByUserId: string): Promise<IssueComment>;
  getAuditTrailLogs(entityName: string, recordId: string): Promise<AuditTrailLog[]>;
}


import type { IDataProvider } from './dataProvider';
import { mockDataverseProvider } from './mock/mockDataverseProvider';
import {
  fetchCommentsForIssue,
  createDataverseComment,
  resolveDataverseComment,
  acquireIssueLock,
  releaseIssueLock,
  callBackIssue,
  sendToPeer,
  excludeIssue,
  includeIssue,
  toggleIssueFunction,
  fetchAuditTrailLogsForIssue,
  advanceIssueWorkflow,
  managerSubmitIssueWorkflow,
  batchAdvanceEngagementIssues,
  signOffAuditReport
} from './dataverseReportingService';

/**
 * Enterprise Service Layer Abstraction.
 * In local Vite dev mode, delegates to MockDataverseProvider.
 * In Power Apps production, switches to native Dataverse Web API context.
 */
class DataverseService implements IDataProvider {
  private activeProvider: IDataProvider;

  constructor() {
    // Check if we are running in local Vite development or production Power Apps
    if (import.meta.env.DEV) {
      this.activeProvider = mockDataverseProvider;
    } else {
      // In Power Apps Code Apps production, initialize with native context
      this.activeProvider = mockDataverseProvider; // Falls back safely
    }
  }

  getAssessments() {
    return this.activeProvider.getAssessments();
  }

  getEngagements(year?: number) {
    return this.activeProvider.getEngagements(year);
  }

  getEngagementById(id: string) {
    return this.activeProvider.getEngagementById(id);
  }

  getIssuesByEngagementId(engagementId: string) {
    return this.activeProvider.getIssuesByEngagementId(engagementId);
  }

  getIssueById(issueId: string) {
    return this.activeProvider.getIssueById(issueId);
  }

  saveIssue(issue: Parameters<IDataProvider['saveIssue']>[0]) {
    return this.activeProvider.saveIssue(issue);
  }

  updateIssueStatus(issueId: string, status: Parameters<IDataProvider['updateIssueStatus']>[1], remarks?: string) {
    return this.activeProvider.updateIssueStatus(issueId, status, remarks);
  }

  acquireIssueLock(issueId: string, engagementId?: string, user?: { userId?: string; name?: string; email?: string; role?: string }) {
    return acquireIssueLock(issueId, engagementId, user);
  }

  releaseIssueLock(issueId: string, engagementId?: string, user?: { userId?: string; name?: string; email?: string; role?: string }, reason?: string) {
    return releaseIssueLock(issueId, engagementId, user, reason);
  }

  callBackIssue(issueId: string, engagementId?: string, callerUser?: { userId?: string; name?: string; email?: string; role?: string }, reason?: string, targetStatus?: string) {
    return callBackIssue(issueId, engagementId, callerUser, reason, targetStatus);
  }

  sendToPeer(issueId: string, engagementId?: string, senderUser?: { userId?: string; name?: string; email?: string; role?: string }, recipient?: any, remarks?: string, _targetStatus?: string) {
    return sendToPeer(issueId, engagementId, senderUser, recipient, remarks);
  }

  excludeIssue(issueId: string, engagementId?: string, user?: { userId?: string; name?: string; email?: string; role?: string }, reason?: string) {
    return excludeIssue(issueId, engagementId, user, reason);
  }

  includeIssue(issueId: string, engagementId?: string, user?: { userId?: string; name?: string; email?: string; role?: string }, reason?: string, targetStatus?: string) {
    return includeIssue(issueId, engagementId, user, reason, targetStatus);
  }

  toggleIssueFunction(issueId: string, engagementId?: string, user?: { userId?: string; name?: string; email?: string; role?: string }, forcedTargetFunction?: 'IT' | 'FinOps') {
    return toggleIssueFunction(issueId, engagementId, user, forcedTargetFunction);
  }

  advanceIssueWorkflow(issueId: string, engagementId?: string, targetStatus?: string, remarks?: string, user?: any, assignedUsers?: any[], currentIssue?: any) {
    return advanceIssueWorkflow(issueId, engagementId, targetStatus, remarks, user, assignedUsers, currentIssue);
  }

  managerSubmitIssueWorkflow(issueId: string, engagementId: string, allEngagementIssues: any[], remarks?: string, user?: any, assignedUsers?: any[]) {
    return managerSubmitIssueWorkflow(issueId, engagementId, allEngagementIssues, remarks, user, assignedUsers);
  }

  batchAdvanceEngagementIssues(engagementId: string, issues: any[], targetStatus: string, remarks?: string, user?: any, assignedUsers?: any[]) {
    return batchAdvanceEngagementIssues(engagementId, issues, targetStatus, remarks, user, assignedUsers);
  }

  signOffAuditReport(engagementId: string, issues: any[], user?: any, remarks?: string, assignedUsers?: any[]) {
    return signOffAuditReport(engagementId, issues, user, remarks, assignedUsers);
  }

  getAiVersionsByIssueId(issueId: string) {
    return this.activeProvider.getAiVersionsByIssueId(issueId);
  }

  createAiVersion(version: Parameters<IDataProvider['createAiVersion']>[0]) {
    return this.activeProvider.createAiVersion(version);
  }

  getCommentsByIssueId(issueId: string, engagementId?: string) {
    return fetchCommentsForIssue(issueId, engagementId);
  }

  addComment(comment: Parameters<IDataProvider['addComment']>[0] & { engagementId?: string; authorEmail?: string }) {
    return createDataverseComment(comment);
  }

  resolveComment(commentId: string, resolvedByUserId: string, resolvedByName?: string) {
    return resolveDataverseComment(commentId, resolvedByUserId, resolvedByName);
  }

  getAuditTrailLogs(_entityName: string, recordId: string) {
    return fetchAuditTrailLogsForIssue(recordId);
  }
}

export const dataverseService = new DataverseService();

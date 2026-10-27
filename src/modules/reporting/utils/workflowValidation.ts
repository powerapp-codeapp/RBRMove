import type { Issue } from '../../../types/dataverse.types';

export interface Stage2ValidationResult {
  isValid: boolean;
  missingFields: { key: string; label: string }[];
}

/**
 * Validates the Stage 2 Mandatory Fields Gate for Audit Manager submission
 * per FRD_REPORTING_MODULE.md Section 4.2 & DATAVERSE_SCHEMA_SPEC.md Section 4:
 * 
 * Before an issue can advance from Audit Manager review (Pending Manager -> Ready for Director Submission / batch submission),
 * the following 7 fields become strictly mandatory:
 * 1. Primary Business Owner (iar_PrimaryBusinessOwner)
 * 2. Criticality (iar_criticality)
 * 3. Root Cause (iar_rootcause)
 * 4. Impact (iar_impact)
 * 5. Recommendations (iar_recommendations)
 * 6. Accountable Function (iar_AccountableFunction)
 * 7. Accountable Process Area (iar_taxonomieses Process Area)
 */
export function validateManagerSubmissionGate(issue: Issue): Stage2ValidationResult {
  const missing: { key: string; label: string }[] = [];

  // 1. Primary Business Owner
  const hasPrimaryOwner = Boolean(
    (issue.primaryBusinessOwnerId && issue.primaryBusinessOwnerId.trim()) ||
    (issue.primaryBusinessOwnerName && issue.primaryBusinessOwnerName.trim()) ||
    ((issue as any).primaryOwner && String((issue as any).primaryOwner).trim()) ||
    ((issue as any).primaryContact && String((issue as any).primaryContact).trim())
  );
  if (!hasPrimaryOwner) {
    missing.push({ key: 'primaryBusinessOwner', label: 'Primary Business Owner' });
  }

  // 2. Criticality
  const hasCriticality = Boolean(issue.criticality && issue.criticality.trim());
  if (!hasCriticality) {
    missing.push({ key: 'criticality', label: 'Criticality' });
  }

  // 3. Root Cause
  const hasRootCause = Boolean(issue.rootCause && issue.rootCause.trim());
  if (!hasRootCause) {
    missing.push({ key: 'rootCause', label: 'Root Cause' });
  }

  // 4. Impact
  const hasImpact = Boolean(issue.impact && issue.impact.trim());
  if (!hasImpact) {
    missing.push({ key: 'impact', label: 'Impact' });
  }

  // 5. Recommendations
  const hasRecommendation = Boolean(
    (issue.recommendation && issue.recommendation.trim()) ||
    ((issue as any).recommendations && String((issue as any).recommendations).trim())
  );
  if (!hasRecommendation) {
    missing.push({ key: 'recommendation', label: 'Recommendations' });
  }

  // 6. Accountable Function
  const hasAccountableFunction = Boolean(
    (issue.accountableFunction && issue.accountableFunction.trim()) ||
    ((issue as any).accountableFunctionId && String((issue as any).accountableFunctionId).trim())
  );
  if (!hasAccountableFunction) {
    missing.push({ key: 'accountableFunction', label: 'Accountable Function' });
  }

  // 7. Accountable Process Area
  const hasProcessArea = Boolean(
    (issue.processArea && issue.processArea.trim()) ||
    (issue.accountableProcessArea && issue.accountableProcessArea.trim()) ||
    ((issue as any).issueProcessArea && String((issue as any).issueProcessArea).trim())
  );
  if (!hasProcessArea) {
    missing.push({ key: 'processArea', label: 'Accountable Process Area' });
  }

  return {
    isValid: missing.length === 0,
    missingFields: missing
  };
}

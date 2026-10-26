export interface GuidelineStrength {
  field_name: string;
  text: string;
}

export interface PefViolation {
  field_name: string;
  guideline: string;
  evidence_quote: string;
  reason: string;
  suggestion: string;
}

export interface ClarifyingQuestion {
  field_name: string;
  text: string;
}

export interface ReviewComment {
  field_name: string;
  text: string;
}

export interface UndefinedAcronym {
  field_name: string;
  acronym: string;
  evidence_quote: string;
  suggested_definition: string;
  comment: string;
}

export interface ImprovementRecommendation {
  field_name: string;
  text: string;
}

export interface QualityGuidelinesPayload {
  strengths: GuidelineStrength[];
  pef_violations: PefViolation[];
  clarifying_questions: ClarifyingQuestion[];
  review_comments: ReviewComment[];
  undefined_acronyms: UndefinedAcronym[];
  improvement_recommendations: ImprovementRecommendation[];
}

export const MOCK_QUALITY_GUIDELINES: QualityGuidelinesPayload = {
  strengths: [
    {
      field_name: 'ISSUE_STATEMENT',
      text: 'The statement clearly describes multiple observed control breakdowns in the vendor access review process, including incomplete evidence, unreconciled IAM reports, and lack of secondary review.'
    },
    {
      field_name: 'ROOT_CAUSE',
      text: 'The root cause goes beyond repeating the condition by identifying process design, ownership, procedure detail, reconciliation, tooling, supervisory review, and SLA tracking gaps.'
    },
    {
      field_name: 'IMPACT',
      text: 'The impact uses appropriately conditional wording such as "may" and "could" to frame potential exposure rather than presenting incidents as observed facts.'
    },
    {
      field_name: 'RECOMMENDATIONS',
      text: 'The recommendations are specific and actionable, addressing governance, review scope, reconciliation, reviewer documentation, GRC workflow configuration, and SLA tracking.'
    },
    {
      field_name: 'RECOMMENDATIONS',
      text: 'The recommendations are aligned with the stated root cause by addressing unclear accountability, manual tracking, incomplete procedures, lack of exception criteria, and missing tools.'
    }
  ],
  pef_violations: [
    {
      field_name: 'ISSUE_HEADER',
      guideline: 'Avoid vague titles, negative labels, and recommendation wording in the title.',
      evidence_quote: 'Inadequate Governance and Execution of Periodic Vendor Access Reviews',
      reason: 'The word "Inadequate" is a negative label rather than a neutral topical description.',
      suggestion: 'Use a neutral title such as "Periodic Vendor Access Review Governance and Execution" or "Vendor Access Review Process Governance."'
    },
    {
      field_name: 'ISSUE_STATEMENT',
      guideline: 'Use factual, objective wording and distinguish the condition from its symptoms.',
      evidence_quote: 'effective process',
      reason: '"Effective" is evaluative wording and may be interpreted as subjective unless the criteria for effectiveness are defined by the surrounding facts.',
      suggestion: 'Replace or support the phrase with the specific observed deficiencies, such as not completing reviews within the required cycle, not reconciling vendor lists, or not retaining evidence.'
    }
  ],
  clarifying_questions: [
    {
      field_name: 'ISSUE_STATEMENT',
      text: 'What testing population, sample size, number of exceptions, and review period support phrases such as "Testing identified," "business-critical applications," and "In several instances"?'
    },
    {
      field_name: 'ISSUE_STATEMENT',
      text: 'What source defines the "required review cycle" and "established SLA" referenced in the issue statement?'
    },
    {
      field_name: 'IMPACT',
      text: 'Which internal access-control requirements, contractual commitments, regulatory obligations, or audit obligations are applicable to this process?'
    },
    {
      field_name: 'ROOT_CAUSE',
      text: 'What evidence supports that roles and responsibilities were not clearly defined across business owners, vendor relationship managers, application owners, IAM administrators, and compliance teams?'
    }
  ],
  review_comments: [
    {
      field_name: 'ISSUE_STATEMENT',
      text: 'The statement is detailed but long; consider separating the primary condition from supporting observations to make the control breakdown easier to read.'
    },
    {
      field_name: 'IMPACT',
      text: 'The impact is consistent with the access-review condition and root cause, but it would be stronger if tied to the specific systems, data types, or obligations supported by the vendor access reviews.'
    },
    {
      field_name: 'RECOMMENDATIONS',
      text: 'The recommendations are comprehensive, but the wording could be organized into discrete actions with accountable roles and verifiable completion outcomes for easier tracking and validation.'
    }
  ],
  undefined_acronyms: [
    {
      field_name: 'ISSUE_STATEMENT',
      acronym: 'IAM',
      evidence_quote: 'IAM reports',
      suggested_definition: 'Identity and Access Management',
      comment: 'Define the acronym on first use if not already defined elsewhere in the report.'
    },
    {
      field_name: 'ISSUE_STATEMENT',
      acronym: 'PAM',
      evidence_quote: 'PAM accounts',
      suggested_definition: 'Privileged Access Management',
      comment: 'Define the acronym on first use if not already defined elsewhere in the report.'
    },
    {
      field_name: 'ISSUE_STATEMENT',
      acronym: 'SoD',
      evidence_quote: 'SoD conflicts',
      suggested_definition: 'Segregation of Duties',
      comment: 'Define the acronym on first use if not already defined elsewhere in the report.'
    },
    {
      field_name: 'ISSUE_STATEMENT',
      acronym: 'VPN',
      evidence_quote: 'VPN access',
      suggested_definition: 'Virtual Private Network',
      comment: 'Define the acronym on first use if not already defined elsewhere in the report.'
    },
    {
      field_name: 'ISSUE_STATEMENT',
      acronym: 'GRC',
      evidence_quote: 'GRC platform',
      suggested_definition: 'Governance, Risk, and Compliance',
      comment: 'Define the acronym on first use if not already defined elsewhere in the report.'
    },
    {
      field_name: 'IMPACT',
      acronym: 'MFA',
      evidence_quote: 'MFA',
      suggested_definition: 'Multi-Factor Authentication',
      comment: 'Define the acronym on first use if not already defined elsewhere in the report.'
    }
  ],
  improvement_recommendations: [
    {
      field_name: 'ISSUE_STATEMENT',
      text: 'Add supported quantities, such as the review population, sample size, number of exceptions, and aging of overdue reviews, if available and material.'
    },
    {
      field_name: 'ISSUE_STATEMENT',
      text: 'Consider moving the final "As a result" sentence to the impact section or revising it to focus only on the observed condition.'
    },
    {
      field_name: 'ROOT_CAUSE',
      text: 'If evidence supports it, identify the specific governance body, policy owner, or process owner responsible for maintaining the vendor access-review procedure.'
    },
    {
      field_name: 'IMPACT',
      text: 'Distinguish any observed consequences from potential consequences if actual unauthorized access, delayed removals, or compliance exceptions were identified during testing.'
    },
    {
      field_name: 'RECOMMENDATIONS',
      text: 'Break the recommendation into trackable remediation steps, each with a responsible role and evidence expected at completion, without adding unsupported deadlines or commitments.'
    }
  ]
};

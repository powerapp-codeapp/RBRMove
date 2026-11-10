export interface EngagementStatusOption {
  id: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  dotColor?: string;
}

export const ENGAGEMENT_STATUS_CONFIG: Record<string, EngagementStatusOption> = {
  NOT_STARTED: {
    id: 'Not Started',
    label: 'Not Started',
    color: '#64748B',
    bg: '#F8FAFC',
    border: '#E2E8F0',
    dotColor: '#94A3B8',
  },
  AUDIT_IN_PROGRESS: {
    id: 'Audit Report Inprogress',
    label: 'Audit Report Inprogress',
    color: '#000099',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    dotColor: '#000099',
  },
  EXEC_IN_PROGRESS: {
    id: 'Executive Report Inprogress',
    label: 'Executive Report Inprogress',
    color: '#B45309',
    bg: '#FEF3C7',
    border: '#FDE68A',
    dotColor: '#E67300',
  },
  COMPLETED: {
    id: 'Completed',
    label: 'Completed',
    color: '#087D0D',
    bg: '#F0FDF4',
    border: '#BBF2D0',
    dotColor: '#087D0D',
  },
};

export const ENGAGEMENT_STATUS_OPTIONS: EngagementStatusOption[] = Object.values(ENGAGEMENT_STATUS_CONFIG);


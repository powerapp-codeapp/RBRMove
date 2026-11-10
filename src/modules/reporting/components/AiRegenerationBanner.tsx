import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { SharedButton } from '../../../components/shared';

export interface AiRegenerationBannerProps {
  isRegenerateActive: boolean;
  isAiLoading: boolean;
  onDismiss: () => void;
  onRegenerate: () => void;
}

export const AiRegenerationBanner: React.FC<AiRegenerationBannerProps> = ({
  isRegenerateActive,
  isAiLoading,
  onDismiss,
  onRegenerate,
}) => {
  return (
    <div
      style={{
        backgroundColor: isRegenerateActive ? '#EFF6FF' : '#F8FAFC',
        border: isRegenerateActive ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        boxShadow: isRegenerateActive ? '0 1px 3px rgba(0, 0, 153, 0.08)' : 'none',
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: isRegenerateActive ? '#DBEAFE' : '#F1F5F9',
            border: isRegenerateActive ? '1px solid #93C5FD' : '1px solid #CBD5E1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isRegenerateActive ? '#000099' : '#94A3B8',
            flexShrink: 0,
          }}
        >
          {isRegenerateActive ? <AlertTriangle size={15} /> : <RotateCcw size={14} />}
        </div>
        <div>
          <div
            style={{
              fontSize: '12.5px',
              color: isRegenerateActive ? '#1E3A8A' : '#64748B',
              lineHeight: 1.45,
              fontWeight: isRegenerateActive ? 600 : 400,
            }}
          >
            {isRegenerateActive
              ? 'Changed the original issue or function, so generated AI might not be aligned. Please click Regenerate AI if needed.'
              : 'Change the function or issue to regenerate'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {isRegenerateActive && (
          <SharedButton
            variant="outline"
            size="small"
            onClick={onDismiss}
            style={{ minHeight: '1.75rem', fontSize: '11.5px', padding: '0 12px' }}
          >
            Cancel
          </SharedButton>
        )}

        <SharedButton
          variant={isRegenerateActive ? 'primary' : 'outline'}
          size="small"
          startIcon={<RotateCcw size={12} />}
          onClick={onRegenerate}
          disabled={!isRegenerateActive || isAiLoading}
          loading={isAiLoading}
          style={
            !isRegenerateActive
              ? {
                  opacity: 0.6,
                  borderColor: '#CBD5E1',
                  color: '#94A3B8',
                  cursor: 'not-allowed',
                  backgroundColor: '#F8FAFC',
                }
              : undefined
          }
        >
          {isAiLoading ? 'Regenerating...' : 'Regenerate AI'}
        </SharedButton>
      </div>
    </div>
  );
};

export default AiRegenerationBanner;


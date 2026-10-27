import React from 'react';
import { AlertTriangle, Clock, RefreshCw, Unlock } from 'lucide-react';
import { SharedButton } from '../../../components/shared/buttons/SharedButton';

interface InactivityCountdownModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onKeepWorking: () => void;
  onUnlockNow: () => void;
  issueTitle?: string;
}

export const InactivityCountdownModal: React.FC<InactivityCountdownModalProps> = ({
  isOpen,
  secondsRemaining,
  onKeepWorking,
  onUnlockNow,
  issueTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '500px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #FDE68A',
        }}
      >
        {/* Header Ribbon */}
        <div
          style={{
            padding: '18px 24px',
            backgroundColor: '#FFFBEB',
            borderBottom: '1px solid #FDE68A',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} color="#D97706" />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '17px',
                fontWeight: 700,
                color: '#92400E',
                fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
              }}
            >
              Session Inactivity Warning
            </h3>
            <span
              style={{
                fontSize: '12px',
                color: '#B45309',
                display: 'block',
                marginTop: '2px',
              }}
            >
              1-Hour Auto-Unlock Watchdog
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: '#334155',
              lineHeight: 1.5,
              fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
            }}
          >
            You have been inactive for <strong>59 minutes</strong>. To ensure fair team collaboration and prevent concurrent edit collisions, your editing lock on{' '}
            {issueTitle ? (
              <span style={{ fontWeight: 600, color: '#000099' }}>&ldquo;{issueTitle}&rdquo;</span>
            ) : (
              'this finding'
            )}{' '}
            will automatically unlock in:
          </p>

          {/* Prominent Countdown Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '16px',
              backgroundColor: '#FFF7ED',
              borderRadius: '8px',
              border: '1px solid #FFEDD5',
            }}
          >
            <Clock size={28} color="#EA580C" style={{ animation: 'spin 4s linear infinite' }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span
                style={{
                  fontSize: '36px',
                  fontWeight: 800,
                  color: secondsRemaining <= 15 ? '#DC2626' : '#EA580C',
                  fontFamily: 'monospace',
                  letterSpacing: '-1px',
                  lineHeight: 1,
                }}
              >
                {String(secondsRemaining).padStart(2, '0')}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#C2410C' }}>seconds</span>
            </div>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: '12.5px',
              color: '#64748B',
              lineHeight: 1.4,
            }}
          >
            Click <strong>&ldquo;Keep Working&rdquo;</strong> to continue editing and reset the inactivity watchdog, or <strong>&ldquo;Unlock Now&rdquo;</strong> to allow other auditors to make changes immediately.
          </p>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <SharedButton
            variant="outline"
            onClick={onUnlockNow}
            startIcon={<Unlock size={14} />}
            style={{ borderColor: '#CBD5E1', color: '#475569' }}
          >
            Unlock Now
          </SharedButton>
          <SharedButton
            variant="primary"
            onClick={onKeepWorking}
            startIcon={<RefreshCw size={14} />}
            style={{ backgroundColor: '#000099', color: '#FFFFFF', fontWeight: 700 }}
          >
            Keep Working
          </SharedButton>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Database, RefreshCw, X, Check, Copy } from 'lucide-react';
import { SharedButton } from '../shared';

interface DataverseDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLiveConnected: boolean;
  diagnostics: Record<string, any> | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export const DataverseDiagnosticsModal: React.FC<DataverseDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  isLiveConnected,
  diagnostics,
  isRefreshing = false,
  onRefresh
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyDiagnostics = () => {
    if (diagnostics) {
      navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          maxWidth: '850px',
          width: '90%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
          fontFamily: '"jj-circular", Arial, Helvetica, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="#000099" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>
              Dataverse Connection Diagnostics
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Callout */}
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            borderRadius: '6px',
            backgroundColor: isLiveConnected ? '#ECFDF5' : '#FFFBEB',
            border: `1px solid ${isLiveConnected ? '#A7F3D0' : '#FDE68A'}`
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '13px', color: isLiveConnected ? '#087D0D' : '#B45309' }}>
            Status: {isLiveConnected ? 'Connected to Dataverse Live' : 'Local Dev Mode (Host Bridge Unavailable)'}
          </div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
            {isLiveConnected
              ? 'The app is successfully authenticated with your Microsoft Dataverse environment.'
              : 'Power Apps host session not detected or table queries failed. Serving local fallback catalog.'}
          </div>
        </div>

        {/* Table of Entity / Diagnostics Status */}
        <div
          className="slim-light-scrollbar"
          style={{
            maxHeight: '380px',
            overflowY: 'auto',
            marginBottom: '20px',
            border: '1px solid #E2E8F0',
            borderRadius: '4px'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B', backgroundColor: '#F8FAFC', position: 'sticky', top: 0, zIndex: 1 }}>
                <th style={{ padding: '8px 10px', width: '220px' }}>Table / Diagnostic</th>
                <th style={{ padding: '8px 10px', width: '90px' }}>Status</th>
                <th style={{ padding: '8px 10px' }}>Result / Error</th>
              </tr>
            </thead>
            <tbody>
              {isRefreshing ? (
                <tr>
                  <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#000099' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Connecting to Microsoft Dataverse (testing host bridge & tables)...</span>
                    </div>
                  </td>
                </tr>
              ) : diagnostics ? (
                Object.entries(diagnostics).map(([entity, info]) => (
                  <tr key={entity} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: '#334155', verticalAlign: 'top' }}>{entity}</td>
                    <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: info.status === 'fulfilled' ? '#ECFDF5' : info.status === 'connecting' ? '#EFF6FF' : '#FEF2F2',
                          color: info.status === 'fulfilled' ? '#087D0D' : info.status === 'connecting' ? '#1D4ED8' : '#DC2626'
                        }}
                      >
                        {info.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', color: '#334155', wordBreak: 'break-word', verticalAlign: 'top', fontFamily: info.error?.startsWith('[') || info.error?.startsWith('{') ? 'Consolas, monospace' : 'inherit', fontSize: '11px' }}>
                      {info.count !== undefined ? `${info.count} records loaded` : info.error || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: '#94A3B8' }}>
                    Connecting to Dataverse... Click Refresh below if not loaded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <SharedButton
            variant="outline"
            size="small"
            onClick={handleCopyDiagnostics}
            disabled={!diagnostics}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {copied ? <Check size={13} color="#087D0D" /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy Diagnostics'}
          </SharedButton>
          {onRefresh && (
            <SharedButton
              variant="outline"
              size="small"
              disabled={isRefreshing}
              loading={isRefreshing}
              onClick={onRefresh}
            >
              Refresh Dataverse
            </SharedButton>
          )}
          <SharedButton
            variant="primary"
            size="small"
            onClick={onClose}
          >
            Close
          </SharedButton>
        </div>
      </div>
    </div>
  );
};
